const Task = require("../models/task.model");

// Create Task
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id
    });

    // Populate task with user details for notification
    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "email fullName")
      .populate("createdBy", "email fullName");

    // Emit socket event to notify the assigned employee
    if (global.io && global.connectedUsers) {
      const assignedToId = task.assignedTo.toString();
      const socketId = global.connectedUsers.get(assignedToId);
      
      if (socketId) {
        global.io.to(socketId).emit('taskAssigned', {
          task: populatedTask,
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
      data: populatedTask || task,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "email fullName")
      .populate("createdBy", "email fullName");

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single task
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "email fullName")
      .populate("createdBy", "email fullName");

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const { status, ...otherUpdates } = req.body;
    
    // Get the original task to check if assignedTo changed
    const originalTask = await Task.findById(req.params.id);
    if (!originalTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const updateData = { ...otherUpdates };
    
    // Add startTime when status changes to in-progress
    if (status === "in-progress") {
      updateData.status = status;
      updateData.startTime = new Date();
    } else if (status === "completed") {
      updateData.status = status;
      updateData.completedTime = new Date();
      // If remark is provided, add it
      if (req.body.remark !== undefined) {
        updateData.remark = req.body.remark;
      }
    } else {
      updateData.status = status;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("assignedTo", "email fullName")
     .populate("createdBy", "email fullName");

    if (!updated) return res.status(404).json({ success: false, message: "Task not found" });

    // Emit socket notifications for task updates
    if (global.io && global.connectedUsers) {
      const originalAssignedTo = originalTask.assignedTo?.toString();
      const newAssignedTo = updated.assignedTo?._id?.toString() || updated.assignedTo?.toString();
      
      // Check if assignedTo changed - notify new assignee
      if (updateData.assignedTo && originalAssignedTo !== newAssignedTo) {
        const newSocketId = global.connectedUsers.get(newAssignedTo);
        
        if (newSocketId) {
          global.io.to(newSocketId).emit('taskAssigned', {
            task: updated,
            message: `Task reassigned to you: ${updated.title}`,
            timestamp: new Date()
          });
          console.log(`Reassignment notification sent to employee ${newAssignedTo} via socket ${newSocketId}`);
        }
      }
      
      // Notify the assigned employee (current or new) about the task update
      const assignedToId = newAssignedTo || originalAssignedTo;
      if (assignedToId) {
        const socketId = global.connectedUsers.get(assignedToId);
        
        if (socketId) {
          // Determine what changed for a more informative message
          const changes = [];
          if (updateData.title && updateData.title !== originalTask.title) changes.push('title');
          if (updateData.description && updateData.description !== originalTask.description) changes.push('description');
          if (updateData.priority && updateData.priority !== originalTask.priority) changes.push('priority');
          if (updateData.deadline && new Date(updateData.deadline).getTime() !== new Date(originalTask.deadline || 0).getTime()) changes.push('deadline');
          if (updateData.status && updateData.status !== originalTask.status) changes.push('status');
          
          const changeMessage = changes.length > 0 
            ? `Task updated: ${changes.join(', ')} changed`
            : 'Task updated';
          
          global.io.to(socketId).emit('taskUpdated', {
            task: updated,
            message: changeMessage,
            timestamp: new Date()
          });
          console.log(`Update notification sent to employee ${assignedToId} via socket ${socketId}`);
        }
      }

      // Notify the task creator/admin when status changes (started or completed)
      const statusChanged = updateData.status && updateData.status !== originalTask.status;
      if (statusChanged && originalTask.createdBy) {
        const creatorId = originalTask.createdBy?.toString();
        const creatorSocketId = global.connectedUsers.get(creatorId);
        
        // Don't notify creator if they are also the assigned employee (already notified above)
        if (creatorSocketId && creatorId !== assignedToId) {
          let statusMessage = '';
          if (updateData.status === 'in-progress') {
            statusMessage = `Task started: ${updated.title}`;
          } else if (updateData.status === 'completed') {
            statusMessage = `Task completed: ${updated.title}`;
          }
          
          if (statusMessage) {
            global.io.to(creatorSocketId).emit('taskStatusChanged', {
              task: updated,
              message: statusMessage,
              oldStatus: originalTask.status,
              newStatus: updateData.status,
              timestamp: new Date()
            });
            console.log(`Status change notification sent to creator ${creatorId} via socket ${creatorSocketId}`);
          }
        }
      }

      // Broadcast task update to all admins (for real-time updates in admin dashboard)
      // This ensures admin views stay updated even if they're not the creator
      global.io.emit('taskUpdatedBroadcast', {
        task: updated,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    // Get task details before deleting to notify the assigned employee
    const taskToDelete = await Task.findById(req.params.id)
      .populate("assignedTo", "email fullName");

    if (!taskToDelete) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const deleted = await Task.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Emit socket event to notify the assigned employee
    if (global.io && global.connectedUsers && taskToDelete.assignedTo) {
      const assignedToId = taskToDelete.assignedTo._id?.toString() || taskToDelete.assignedTo.toString();
      const socketId = global.connectedUsers.get(assignedToId);
      
      if (socketId) {
        global.io.to(socketId).emit('taskDeleted', {
          taskId: req.params.id,
          taskTitle: taskToDelete.title,
          message: `Task deleted: ${taskToDelete.title}`,
          timestamp: new Date()
        });
        console.log(`Deletion notification sent to employee ${assignedToId} via socket ${socketId}`);
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

    const tasks = await Task.find({ assignedTo: employeeId })
      .populate("assignedTo", "email fullName")
      .populate("createdBy", "email fullName");

    if (!tasks) {
      return res.status(404).json({ 
        success: false, 
        message: "No tasks found for this employee" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get task statistics by employee
exports.getTaskStatsByEmployee = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee"
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
