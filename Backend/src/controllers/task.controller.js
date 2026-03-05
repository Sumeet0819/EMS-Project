const prisma = require("../db/prisma");
const sendEmail = require("../utils/sendEmail");

// Helper to map Prisma models to the shape the React Frontend expects (Mongoose shape)
function formatTask(task) {
  if (!task) return null;
  return {
    ...task,
    _id: task.id, // Frontend uses _id for React keys and URLs
    assignedTo: task.assignedTo ? {
      _id: task.assignedTo.id,
      id: task.assignedTo.id,
      email: task.assignedTo.email,
      fullName: { firstName: task.assignedTo.firstName, lastName: task.assignedTo.lastName }
    } : task.assignedToId,
    createdBy: task.createdBy ? {
      _id: task.createdBy.id,
      id: task.createdBy.id,
      email: task.createdBy.email,
      fullName: { firstName: task.createdBy.firstName, lastName: task.createdBy.lastName }
    } : task.createdById
  };
}

const userSelect = {
  select: { id: true, email: true, firstName: true, lastName: true }
};

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { assignedTo, title, description, priority, deadline, isDaily } = req.body;
    
    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        priority: priority || "medium",
        deadline: deadline ? new Date(deadline) : null,
        isDaily: isDaily || false,
        assignedToId: assignedTo, // mapped from frontend's Mongoose ObjectId
        createdById: req.user.id
      },
      include: {
        assignedTo: userSelect,
        createdBy: userSelect
      }
    });

    const formattedTask = formatTask(task);

    // Save notification in database
    await prisma.notification.create({
      data: {
        userId: task.assignedToId,
        title: 'New Task Assigned',
        message: task.title,
        type: 'TASK_ASSIGNED',
        link: '/employee-dashboard'
      }
    });

    // Emit socket event to notify the assigned employee
    if (global.io && global.connectedUsers) {
      const assignedToId = task.assignedToId;
      const socketId = global.connectedUsers.get(assignedToId);
      
      if (socketId) {
        global.io.to(socketId).emit('taskAssigned', {
          task: formattedTask,
          message: `New task assigned: ${task.title}`,
          timestamp: new Date()
        });
        global.io.to(socketId).emit('update_unreads');
        console.log(`Notification sent to employee ${assignedToId} via socket ${socketId}`);
      } else {
        console.log(`Employee ${assignedToId} is not connected`);
      }
    }

    // Send email notification asynchronously
    if (task.assignedTo && task.assignedTo.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2196F3; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Task Assigned</h2>
          </div>
          <div style="padding: 20px; color: #333; line-height: 1.6;">
            <p>Hello ${task.assignedTo.firstName || 'Team Member'},</p>
            <p>A new task has been assigned to you by ${task.createdBy ? task.createdBy.firstName : 'Admin'}.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2196F3;">${title}</h3>
              <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${priority || 'Medium'}</span></p>
              ${deadline ? `<p><strong>Deadline:</strong> ${new Date(deadline).toLocaleDateString()}</p>` : ''}
              ${description ? `<p style="margin-top: 10px;"><strong>Description:</strong><br/>${description.replace(/\n/g, '<br/>')}</p>` : ''}
            </div>
            <p>Please log in to the platform to view more details and start working on it.</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 0.8em; color: #777;">
            <p style="margin: 0;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      `;

      sendEmail({
        to: task.assignedTo.email,
        subject: `New Task Assigned: ${title}`,
        html: emailHtml
      });
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: formattedTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: userSelect,
        createdBy: userSelect
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, data: tasks.map(formatTask) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single task
exports.getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: userSelect,
        createdBy: userSelect
      }
    });

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    res.status(200).json({ success: true, data: formatTask(task) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    console.log("UpdateTask Request Body:", JSON.stringify(req.body, null, 2));
    console.log("UpdateTask Params:", req.params);
    const { status, remark, completionNote, assignedTo, title, description, priority, deadline } = req.body;
    
    // Get the original task to check if assignedTo changed
    const originalTask = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!originalTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (remark !== undefined) updateData.remark = remark; // always update cache
    if (assignedTo !== undefined) updateData.assignedToId = assignedTo;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

    
    // Add startTime when status changes to in-progress
    if (status) {
      const newStatus = status === "in-progress" ? "in_progress" : status;
      updateData.status = newStatus;
      
      const now = new Date();
      // Calculate 12-hour bucket boundary
      const bucketStart = new Date(now);
      bucketStart.setHours(now.getHours() < 12 ? 0 : 12, 0, 0, 0);

      // Calculate time spent if we're moving OUT of in-progress
      if (originalTask.status === "in_progress" && newStatus !== "in_progress") {
        if (originalTask.startTime) {
          const taskStart = new Date(originalTask.startTime);
          const duration = Math.floor((now - taskStart) / 1000);
          updateData.totalTimeSpent = (originalTask.totalTimeSpent || 0) + duration;
          
          // Calculate shift-specific time (only duration within current bucket)
          let currentShiftDuration = 0;
          if (taskStart >= bucketStart) {
            // Task started within this bucket
            currentShiftDuration = duration;
          } else {
            // Task started in previous bucket - only count time from bucket start
            currentShiftDuration = Math.floor((now - bucketStart) / 1000);
          }

          // If lastResetTime was before this bucket, start shiftTimeSpent from 0
          const lastReset = originalTask.lastResetTime ? new Date(originalTask.lastResetTime) : new Date(0);
          if (lastReset < bucketStart) {
            updateData.shiftTimeSpent = Math.max(0, currentShiftDuration);
          } else {
            updateData.shiftTimeSpent = (originalTask.shiftTimeSpent || 0) + Math.max(0, currentShiftDuration);
          }
          
          updateData.lastResetTime = now;
          updateData.startTime = null; // Clear start time as it's no longer running
        }
      }

      // Set startTime if we're moving INTO in-progress
      if (newStatus === "in_progress") {
        updateData.startTime = now;
        
        // Reset shiftTimeSpent if it's a new bucket
        const lastReset = originalTask.lastResetTime ? new Date(originalTask.lastResetTime) : new Date(0);
        if (lastReset < bucketStart) {
          updateData.shiftTimeSpent = 0;
          updateData.lastResetTime = now;
        }
        
        // AUTO-START DAY LOG if not started
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const userId = originalTask.assignedToId;
          
          await prisma.dailyWorkLog.upsert({
            where: { userId_date: { userId, date: today } },
            update: { isActive: true, startTime: new Date() },
            create: { userId, date: today, isActive: true, startTime: new Date() }
          });
        } catch (err) {
          console.error("Failed to auto-start day log:", err);
        }
      } 
      
      // Set completedTime if we're moving INTO completed
      if (newStatus === "completed") {
        updateData.completedTime = new Date();
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignedTo: userSelect,
        createdBy: userSelect
      }
    });

    const formattedTask = formatTask(updatedTask);

    // Emit socket notifications for task updates
    if (global.io && global.connectedUsers) {
      const originalAssignedTo = originalTask.assignedToId;
      const newAssignedTo = updatedTask.assignedToId;
      
      // Check if assignedTo changed - notify new assignee
      if (assignedTo && originalAssignedTo !== newAssignedTo) {
        await prisma.notification.create({
          data: {
            userId: newAssignedTo,
            title: 'Task Reassigned',
            message: updatedTask.title,
            type: 'TASK_ASSIGNED',
            link: '/employee-dashboard'
          }
        });

        const newSocketId = global.connectedUsers.get(newAssignedTo);
        
        if (newSocketId) {
          global.io.to(newSocketId).emit('taskAssigned', {
            task: formattedTask,
            message: `Task reassigned to you: ${updatedTask.title}`,
            timestamp: new Date()
          });
          global.io.to(newSocketId).emit('update_unreads');
        }
      }
      
      // Notify the assigned employee (current or new) about the task update
      const assignedToIdToNotify = newAssignedTo || originalAssignedTo;
      if (assignedToIdToNotify) {
        const socketId = global.connectedUsers.get(assignedToIdToNotify);
        
        if (socketId) {
          global.io.to(socketId).emit('taskUpdated', {
            task: formattedTask,
            message: 'Task updated',
            timestamp: new Date()
          });
        }
      }

      // Notify the task creator/admin when status changes (started or completed)
      const statusChanged = updateData.status && updateData.status !== originalTask.status;
      if (statusChanged && originalTask.createdById) {
        const creatorId = originalTask.createdById;
        let statusMessage = '';
        if (status === 'in-progress') statusMessage = `Task started: ${updatedTask.title}`;
        else if (status === 'completed') statusMessage = `Task completed: ${updatedTask.title}`;

        if (statusMessage) {
          await prisma.notification.create({
            data: {
               userId: creatorId,
               title: 'Task Status Updated',
               message: statusMessage,
               type: 'TASK_UPDATE',
               link: '/admin-dashboard'
            }
          });

          const creatorSocketId = global.connectedUsers.get(creatorId);
          if (creatorSocketId && creatorId !== assignedToIdToNotify) {
             global.io.to(creatorSocketId).emit('taskStatusChanged', {
                task: formattedTask,
                message: statusMessage,
                timestamp: new Date()
             });
             global.io.to(creatorSocketId).emit('update_unreads');
          }
        }
      }

      global.io.emit('taskUpdatedBroadcast', {
        task: formattedTask,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: formattedTask,
    });
  } catch (error) {
    console.error("Error in updateTask:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const taskToDelete = await prisma.task.findUnique({
      where: { id: req.params.id }
    });

    if (!taskToDelete) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    // Emit socket event to notify the assigned employee
    if (global.io && global.connectedUsers && taskToDelete.assignedToId) {
      const assignedToId = taskToDelete.assignedToId;
      const socketId = global.connectedUsers.get(assignedToId);
      
      if (socketId) {
        global.io.to(socketId).emit('taskDeleted', {
          taskId: req.params.id,
          taskTitle: taskToDelete.title,
          message: `Task deleted: ${taskToDelete.title}`,
          timestamp: new Date()
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get tasks by employee
exports.getTasksByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { assignedToId: employeeId },
      include: {
        assignedTo: userSelect,
        createdBy: userSelect
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ success: false, message: "No tasks found for this employee" });
    }

    res.status(200).json({ 
      success: true, 
      data: tasks.map(formatTask),
      count: tasks.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Submit (or update) today's EOD remark for a daily task
// POST /api/tasks/:id/remarks
exports.submitEODRemark = async (req, res) => {
  try {
    const { remark } = req.body;
    if (!remark || !remark.trim()) {
      return res.status(400).json({ success: false, message: "Remark text is required" });
    }

    // Verify the task exists and is a daily task
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    if (!task.isDaily) return res.status(400).json({ success: false, message: "EOD remarks are only for daily tasks" });

    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);
    const submitterId = req.user.id;

    const result = await prisma.taskRemark.upsert({
      where: {
        taskId_submittedBy_date: {
          taskId: req.params.id,
          submittedBy: submitterId,
          date: todayMidnight,
        }
      },
      update: { remark: remark.trim() },
      create: {
        taskId: req.params.id,
        submittedBy: submitterId,
        date: todayMidnight,
        remark: remark.trim(),
      }
    });

    // Also update the Task.remark cache so the task list shows the latest text
    await prisma.task.update({ where: { id: req.params.id }, data: { remark: remark.trim() } });

    res.status(200).json({ success: true, data: result, message: "EOD remark saved" });
  } catch (error) {
    console.error("Error in submitEODRemark:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get EOD remark history for a task (filterable by date/month/range, scoped by role)
exports.getTaskRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, month, startDate, endDate, userId, page = 1, limit = 20 } = req.query;
    const isAdmin = req.user.role === 'admin';

    // Build date filter on the `date` column (midnight UTC values)
    let dateFilter = {};
    if (date) {
      // Exact day: match from midnight to end of that day UTC
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      const dEnd = new Date(d); dEnd.setUTCHours(23, 59, 59, 999);
      dateFilter = { date: { gte: d, lte: dEnd } };
    } else if (month) {
      // e.g. "2026-03"
      const [yr, mo] = month.split('-').map(Number);
      const start = new Date(Date.UTC(yr, mo - 1, 1));
      const end = new Date(Date.UTC(yr, mo, 0, 23, 59, 59, 999));
      dateFilter = { date: { gte: start, lte: end } };
    } else if (startDate || endDate) {
      const fromDate = startDate ? new Date(startDate) : new Date(0);
      fromDate.setUTCHours(0, 0, 0, 0);
      const toDate = endDate ? new Date(endDate) : new Date();
      toDate.setUTCHours(23, 59, 59, 999);
      dateFilter = { date: { gte: fromDate, lte: toDate } };
    }

    // Role-based scoping: employee sees only their own; admin can filter by userId
    const userFilter = isAdmin
      ? (userId ? { submittedBy: userId } : {})
      : { submittedBy: req.user.id };

    const where = { taskId: id, ...dateFilter, ...userFilter };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [remarks, total] = await Promise.all([
      prisma.taskRemark.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.taskRemark.count({ where }),
    ]);

    const formatted = remarks.map(r => ({
      id: r.id,
      date: r.date,
      remark: r.remark,
      completionNote: r.completionNote,
      updatedAt: r.updatedAt,
      submittedBy: r.user ? {
        id: r.user.id,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
      } : null,
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });
  } catch (error) {
    console.error("Error in getTaskRemarks:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get today's EOD remark for the current user (used to pre-fill the remark textarea)
exports.getTodayRemark = async (req, res) => {
  try {
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);
    const tomorrowMidnight = new Date(todayMidnight);
    tomorrowMidnight.setUTCDate(tomorrowMidnight.getUTCDate() + 1);

    const remark = await prisma.taskRemark.findFirst({
      where: {
        taskId: req.params.id,
        submittedBy: req.user.id,
        date: { gte: todayMidnight, lt: tomorrowMidnight },
      }
    });

    res.status(200).json({ success: true, data: remark || null });
  } catch (error) {
    console.error("Error in getTodayRemark:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get task statistics by employee (aggregation translation)
exports.getTaskStatsByEmployee = async (req, res) => {
  try {
    // 1. Get all employees
    const users = await prisma.user.findMany({
      where: { role: 'employee' },
      include: {
        tasksAssigned: { select: { status: true } }
      }
    });

    // 2. Map their stats
    const stats = users.map(user => {
      const tasks = user.tasksAssigned || [];
      return {
        _id: user.id,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        total: tasks.length,
        employee: [{ 
          firstName: user.firstName, 
          lastName: user.lastName, 
          email: user.email 
        }]
      };
    });

    res.status(200).json({ 
      success: true, 
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
