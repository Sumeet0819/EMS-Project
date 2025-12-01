const express = require('express');
const cokieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require("./routes/task.routes");
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

module.exports = app;