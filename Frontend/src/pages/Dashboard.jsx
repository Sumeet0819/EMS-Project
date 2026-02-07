import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import "../styles/dashboard.css";
import StatCard from "../components/StatCard";
import ActivityList from "../components/ActivityList";
import TaskDistribution from "../components/TaskDistribution";
import Loader from "../components/Loader";
import { RiCheckLine, RiTaskLine, RiTimeLine, RiUserLine } from "@remixicon/react";
import { asyncLoadEmployees } from "../store/actions/employeeActions";
import { asyncLoadEmployeeTasks } from "../store/actions/employeeTaskActions";
import { updateTask, deleteTask, createTask } from "../store/reducers/employeeTaskSlice";
import { useSocket } from "../contexts/SocketContext";

const Dashboard = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const { employees, loading: employeesLoading } = useSelector((state) => state.employeeReducer);
  const { tasks, loading: tasksLoading } = useSelector((state) => state.employeeTaskReducer);

  // Load data on mount
  useEffect(() => {
    dispatch(asyncLoadEmployees());
    dispatch(asyncLoadEmployeeTasks());
  }, [dispatch]);

  // Listen for real-time task updates via socket.io
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdatedBroadcast = (data) => {
      const { task } = data;
      // Update the task in the Redux store
      dispatch(updateTask(task));
    };

    const handleTaskStatusChanged = (data) => {
      const { task } = data;
      // Update the task in the Redux store
      dispatch(updateTask(task));
    };

    const handleTaskDeleted = (data) => {
      const { taskId } = data;
      // Remove the task from the Redux store
      dispatch(deleteTask(taskId));
    };

    const handleTaskAssigned = (data) => {
      const { task } = data;
      // Add the new task to the Redux store
      dispatch(createTask(task));
    };

    // Listen for task update events
    socket.on('taskUpdatedBroadcast', handleTaskUpdatedBroadcast);
    socket.on('taskStatusChanged', handleTaskStatusChanged);
    socket.on('taskDeleted', handleTaskDeleted);
    socket.on('taskAssigned', handleTaskAssigned);

    // Cleanup listeners on unmount
    return () => {
      socket.off('taskUpdatedBroadcast', handleTaskUpdatedBroadcast);
      socket.off('taskStatusChanged', handleTaskStatusChanged);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('taskAssigned', handleTaskAssigned);
    };
  }, [socket, dispatch]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    
    const activeTasks = tasks.filter((task) => task.status === "in-progress").length;
    const pendingTasks = tasks.filter((task) => task.status === "pending").length;
    
    // Calculate completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = tasks.filter((task) => {
      if (task.status !== "completed" || !task.completedTime) return false;
      const completedDate = new Date(task.completedTime);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    return {
      totalEmployees,
      activeTasks,
      completedToday,
      pendingTasks,
    };
  }, [employees, tasks]);

  // Calculate task distribution
  const taskDistribution = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const progress = tasks.filter((task) => task.status === "in-progress").length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    
    return { completed, progress, pending };
  }, [tasks]);

  // Generate activity feed from recent task updates
  const activity = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    // Sort tasks by updatedAt (most recent first)
    const sortedTasks = [...tasks]
      .filter((task) => task.updatedAt || task.completedTime || task.startTime)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.completedTime || a.startTime || 0);
        const dateB = new Date(b.updatedAt || b.completedTime || b.startTime || 0);
        return dateB - dateA;
      })
      .slice(0, 5); // Get 5 most recent

    return sortedTasks.map((task) => {
      const employeeName = task.assignedTo?.fullName
        ? `${task.assignedTo.fullName.firstName} ${task.assignedTo.fullName.lastName}`
        : task.assignedTo?.email || "Unknown";
      
      let activityText = "";
      if (task.status === "completed") {
        activityText = `completed task: ${task.title}`;
      } else if (task.status === "in-progress") {
        activityText = `started task: ${task.title}`;
      } else {
        activityText = `updated task: ${task.title}`;
      }

      // Calculate time ago
      const updateDate = new Date(task.updatedAt || task.completedTime || task.startTime || Date.now());
      const now = new Date();
      const diffMs = now - updateDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo = "";
      if (diffMins < 1) {
        timeAgo = "just now";
      } else if (diffMins < 60) {
        timeAgo = `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
      } else {
        timeAgo = `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
      }

      return {
        name: employeeName,
        activity: activityText,
        time: timeAgo,
      };
    });
  }, [tasks]);

  const loading = employeesLoading || tasksLoading;

  return (
    <div className="dashboard-container">
      <h1>Dashboard Overview</h1>
      <p className="subtitle">Welcome back! Here's what's happening today.</p>

          <div className="stats-grid">
            <StatCard 
              label="Total Employees" 
              value={stats.totalEmployees.toString()} 
              icon={<RiUserLine size={20}/>} 
            />
            <StatCard 
              label="Active Tasks" 
              value={stats.activeTasks.toString()} 
              icon={<RiTaskLine size={20}/>} 
            />
            <StatCard 
              label="Completed Today" 
              value={stats.completedToday.toString()} 
              icon={<RiCheckLine size={20}/>} 
            />
            <StatCard 
              label="Pending Tasks" 
              value={stats.pendingTasks.toString()} 
              icon={<RiTimeLine size={20}/>} 
            />
          </div>

          <div className="lower-grid">
            <ActivityList data={activity} />
            <TaskDistribution 
              completed={taskDistribution.completed} 
              progress={taskDistribution.progress} 
              pending={taskDistribution.pending} 
            />
          </div>
    </div>
  );
};

export default Dashboard;
