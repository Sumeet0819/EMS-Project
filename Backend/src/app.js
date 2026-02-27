const express = require('express');
const cokieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require("./routes/task.routes");
const employeeRoutes = require("./routes/employee.routes");
const worklogRoutes = require("./routes/worklog.routes");
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(cokieParser());
app.use(express.json());


app.use('/api/auth', authRoutes);
// Task routes

app.use("/api/tasks", taskRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/worklogs", worklogRoutes);

module.exports = app;