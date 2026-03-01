const express = require('express');
const cokieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require("./routes/task.routes");
const employeeRoutes = require("./routes/employee.routes");
const worklogRoutes = require("./routes/worklog.routes");
const notificationRoutes = require("./routes/notification.routes");
const announcementRoutes = require("./routes/announcement.routes");
const messageRoutes = require("./routes/message.routes");
const channelRoutes = require("./routes/channel.routes");
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
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/channels", channelRoutes);

module.exports = app;