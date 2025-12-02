const Task = require("../models/task.model");

// Create Task
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
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
    
    const updateData = { ...otherUpdates };
    
    // Add startTime when status changes to in-progress
    if (status === "in-progress") {
      updateData.status = status;
      updateData.startTime = new Date();
    } else if (status === "completed") {
      updateData.status = status;
      updateData.completedTime = new Date();
    } else {
      updateData.status = status;
    }

    const updated = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("assignedTo", "email fullName")
     .populate("createdBy", "email fullName");

    if (!updated) return res.status(404).json({ success: false, message: "Task not found" });

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
    const deleted = await Task.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ success: false, message: "Task not found" });

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
