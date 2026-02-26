const prisma = require("../db/prisma");

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
        console.log(`Notification sent to employee ${assignedToId} via socket ${socketId}`);
      } else {
        console.log(`Employee ${assignedToId} is not connected`);
      }
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
    const { status, remark, assignedTo, title, description, priority, deadline } = req.body;
    
    // Get the original task to check if assignedTo changed
    const originalTask = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!originalTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (remark !== undefined) updateData.remark = remark;
    if (assignedTo !== undefined) updateData.assignedToId = assignedTo;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    
    // Add startTime when status changes to in-progress
    if (status) {
      // Prism enum requires replacing hyphens with underscores if mapped, but our Prisma Schema handles it implicitly.
      // E.g 'in-progress' -> 'in_progress'. Wait, the value from req.body is 'in-progress'.
      // In JS, Prisma enums are exact strings. In schema we used @map("in-progress") but the JS value is 'in_progress'.
      updateData.status = status === "in-progress" ? "in_progress" : status;
      
      if (status === "in-progress") {
        updateData.startTime = new Date();
      } else if (status === "completed") {
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
        const newSocketId = global.connectedUsers.get(newAssignedTo);
        
        if (newSocketId) {
          global.io.to(newSocketId).emit('taskAssigned', {
            task: formattedTask,
            message: `Task reassigned to you: ${updatedTask.title}`,
            timestamp: new Date()
          });
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
        const creatorSocketId = global.connectedUsers.get(creatorId);
        
        if (creatorSocketId && creatorId !== assignedToIdToNotify) {
          let statusMessage = '';
          if (status === 'in-progress') statusMessage = `Task started: ${updatedTask.title}`;
          else if (status === 'completed') statusMessage = `Task completed: ${updatedTask.title}`;
          
          if (statusMessage) {
            global.io.to(creatorSocketId).emit('taskStatusChanged', {
              task: formattedTask,
              message: statusMessage,
              timestamp: new Date()
            });
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
