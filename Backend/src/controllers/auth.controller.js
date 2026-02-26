const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");

async function registerUser(req, res) {
  try {
    const {
      fullName: { firstName, lastName },
      email,
      password,
      role = "employee", // Default matching the Prisma schema default
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashPassword,
        role,
      },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,       // Required for HTTPS (Render)
      sameSite: "none",   // Required for cross-site from localhost to Render
    });

    res.status(201).json({
      message: "User registered successfully",
      employee: {
        id: user.id,
        fullName: { firstName: user.firstName, lastName: user.lastName },
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,       // Required for HTTPS (Render)
      sameSite: "none",   // Required for cross-site from localhost to Render
    });

    res.status(200).json({
      message: "User logged in successfully",
      employee: {
        id: user.id,
        fullName: { firstName: user.firstName, lastName: user.lastName },
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = { registerUser, loginUser };
