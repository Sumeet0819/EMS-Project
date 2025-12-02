const express = require("express");
const router = express.Router();
const userModel = require("../models/user.models");
const authMiddleware = require("../middleware/auth.middleware");
const bcrypt = require("bcryptjs");

// Protect all routes
router.use(authMiddleware);

// Get all employees
router.get("/", async (req, res) => {
  try {
    const employees = await userModel.find({ role: "employee" }).select("-password");
    res.status(200).json({ 
      success: true, 
      data: employees,
      count: employees.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single employee by ID
router.get("/:id", async (req, res) => {
  try {
    const employee = await userModel.findById(req.params.id).select("-password");
    
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new employee - Admin only
router.post("/", async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admins can create employees" 
      });
    }

    const {
      fullName: { firstName, lastName },
      email,
      password,
    } = req.body;

    const existingEmployee = await userModel.findOne({ email });

    if (existingEmployee) {
      return res.status(400).json({ 
        success: false,
        message: "Employee with this email already exists" 
      });
    }

    const hashPassword = await bcrypt.hash(password || "default123", 10);

    const employee = new userModel({
      fullName: {
        firstName,
        lastName,
      },
      email,
      password: hashPassword,
      role: "employee", // Default role
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        id: employee._id,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update employee
router.put("/:id", async (req, res) => {
  try {
    const { fullName, email } = req.body;

    const employee = await userModel.findByIdAndUpdate(
      req.params.id,
      { fullName, email },
      { new: true }
    ).select("-password");

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete employee
router.delete("/:id", async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Only admins can delete employees" 
      });
    }

    const employee = await userModel.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
