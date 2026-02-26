const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const authMiddleware = require("../middleware/auth.middleware");
const bcrypt = require("bcryptjs");

// Helper to format Prisma User to Frontend expected format
function formatEmployee(emp) {
  if (!emp) return null;
  return {
    _id: emp.id,
    id: emp.id,
    email: emp.email,
    role: emp.role,
    fullName: {
      firstName: emp.firstName,
      lastName: emp.lastName
    }
  };
}

const employeeSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true
};

// Protect all routes
router.use(authMiddleware);

// Get all employees
router.get("/", async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { role: "employee" },
      select: employeeSelect
    });
    
    res.status(200).json({ 
      success: true, 
      data: employees.map(formatEmployee),
      count: employees.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single employee by ID
router.get("/:id", async (req, res) => {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: employeeSelect
    });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, data: formatEmployee(employee) });
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

    const existingEmployee = await prisma.user.findUnique({ where: { email } });

    if (existingEmployee) {
      return res.status(400).json({ 
        success: false,
        message: "Employee with this email already exists" 
      });
    }

    const hashPassword = await bcrypt.hash(password || "default123", 10);

    const employee = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashPassword,
        role: "employee", // Default role
      },
      select: employeeSelect
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: formatEmployee(employee),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update employee
router.put("/:id", async (req, res) => {
  try {
    const { fullName, email } = req.body;
    
    const updateData = {};
    if (email) updateData.email = email;
    if (fullName && fullName.firstName) updateData.firstName = fullName.firstName;
    if (fullName && fullName.lastName) updateData.lastName = fullName.lastName;

    const employee = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: employeeSelect
    });

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: formatEmployee(employee),
    });
  } catch (error) {
    // Prisma returns P2025 if record to update not found
    if (error.code === 'P2025') {
       return res.status(404).json({ success: false, message: "Employee not found" });
    }
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

    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
     if (error.code === 'P2025') {
       return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
