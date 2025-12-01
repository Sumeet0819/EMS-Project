import React from "react";
import "../components/styles/dashboard.css";
import StatCard from "../components/StatCard";
import ActivityList from "../components/ActivityList";
import TaskDistribution from "../components/TaskDistribution";
import { RiCheckLine, RiTaskLine, RiTimeLine, RiUserLine } from "@remixicon/react";

const Dashboard = () => {
  const activity = [
    { name: "John Doe", activity: "completed 5 tasks", time: "2 hours ago" },
    { name: "Jane Smith", activity: "submitted daily report", time: "4 hours ago" },
    { name: "Mike Johnson", activity: "updated task status", time: "5 hours ago" },
    { name: "Sarah Williams", activity: "completed 3 tasks", time: "6 hours ago" },
  ];

  return (
    <div className="dashboard-container">
      <h1>Dashboard Overview</h1>
      <p className="subtitle">Welcome back! Here's what's happening today.</p>

      <div className="stats-grid">
        <StatCard label="Total Employees" value="24" icon={<RiUserLine size={20}/>} />
        <StatCard label="Active Tasks" value="156" icon={<RiTaskLine size={20}/>} />
        <StatCard label="Completed Today" value="42" icon={<RiCheckLine size={20}/>} />
        <StatCard label="Pending Tasks" value="18" icon={<RiTimeLine size={20}/>} />
      </div>

      <div className="lower-grid">
        <ActivityList data={activity} />
        <TaskDistribution completed={42} progress={38} pending={18} />
      </div>
    </div>
  );
};

export default Dashboard;
