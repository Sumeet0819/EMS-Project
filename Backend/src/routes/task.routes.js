const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middleware/auth.middleware"); // if you have one

// Protect all routes
router.use(authMiddleware);

// CRUD routes
router.post("/", taskController.createTask);
router.get("/", taskController.getTasks);
router.get("/stats/all", taskController.getTaskStatsByEmployee);
router.get("/employee/:employeeId", taskController.getTasksByEmployee);
router.get("/:id", taskController.getTaskById);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
