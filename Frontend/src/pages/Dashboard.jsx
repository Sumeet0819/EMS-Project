import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import StatCard from "../components/StatCard";
import ActivityList from "../components/ActivityList";
import TaskDistribution from "../components/TaskDistribution";
import PageHeader from "../components/common/PageHeader";
import { DashboardSkeleton } from "../components/Loader";
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

  useEffect(() => {
    dispatch(asyncLoadEmployees());
    dispatch(asyncLoadEmployeeTasks());
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;
    const handleTaskUpdatedBroadcast = ({ task }) => dispatch(updateTask(task));
    const handleTaskStatusChanged = ({ task }) => dispatch(updateTask(task));
    const handleTaskDeleted = ({ taskId }) => dispatch(deleteTask(taskId));
    const handleTaskAssigned = ({ task }) => dispatch(createTask(task));

    socket.on('taskUpdatedBroadcast', handleTaskUpdatedBroadcast);
    socket.on('taskStatusChanged', handleTaskStatusChanged);
    socket.on('taskDeleted', handleTaskDeleted);
    socket.on('taskAssigned', handleTaskAssigned);

    return () => {
      socket.off('taskUpdatedBroadcast', handleTaskUpdatedBroadcast);
      socket.off('taskStatusChanged', handleTaskStatusChanged);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('taskAssigned', handleTaskAssigned);
    };
  }, [socket, dispatch]);

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeTasks = tasks.filter((t) => t.status === "in-progress").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = tasks.filter((t) => {
      if (t.status !== "completed" || !t.completedTime) return false;
      const completedDate = new Date(t.completedTime);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    return { totalEmployees, activeTasks, completedToday, pendingTasks };
  }, [employees, tasks]);

  const taskDistribution = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "completed").length;
    const progress = tasks.filter((t) => t.status === "in-progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    return { completed, progress, pending };
  }, [tasks]);

  const activity = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    return [...tasks]
      .filter((t) => t.updatedAt || t.completedTime || t.startTime)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.completedTime || a.startTime || 0);
        const dateB = new Date(b.updatedAt || b.completedTime || b.startTime || 0);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((t) => {
        const employeeName = t.assignedTo?.fullName
          ? `${t.assignedTo.fullName.firstName} ${t.assignedTo.fullName.lastName}`
          : t.assignedTo?.email || "Unknown";
        
        let activityText = `updated task: ${t.title}`;
        if (t.status === "completed") activityText = `completed task: ${t.title}`;
        else if (t.status === "in-progress") activityText = `started task: ${t.title}`;

        const diffMs = new Date() - new Date(t.updatedAt || t.completedTime || t.startTime || Date.now());
        const mins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(diffMs / 3600000);
        const days = Math.floor(diffMs / 86400000);

        let timeAgo = "just now";
        if (mins > 0 && mins < 60) timeAgo = `${mins}m ago`;
        else if (hrs > 0 && hrs < 24) timeAgo = `${hrs}h ago`;
        else if (days > 0) timeAgo = `${days}d ago`;

        return { name: employeeName, activity: activityText, time: timeAgo };
      });
    }, [tasks]);

  if (employeesLoading || tasksLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard Overview"
        subtitle="Welcome back! Here's what's happening today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats.totalEmployees} icon={<RiUserLine size={20}/>} />
        <StatCard label="Active Tasks"    value={stats.activeTasks}    icon={<RiTaskLine size={20}/>} />
        <StatCard label="Completed Today" value={stats.completedToday} icon={<RiCheckLine size={20}/>} />
        <StatCard label="Pending Tasks"   value={stats.pendingTasks}   icon={<RiTimeLine size={20}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
