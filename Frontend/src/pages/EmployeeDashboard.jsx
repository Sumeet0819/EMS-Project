import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadTasksByEmployee,
  asyncStartTask,
  asyncSubmitTask,
  updateTaskTimerLocal,
} from "../store/actions/employeeTaskActions";
import { asyncLogoutuser } from "../store/actions/userActions";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { RiTimeLine, RiTaskLine, RiLogoutBoxLine, RiUserLine, RiMenuLine, RiCloseLine } from "@remixicon/react";
import { toast } from "sonner";
import "../components/EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, loading } = useSelector((state) => state.employeeTaskReducer);
  const { user } = useSelector((state) => state.userReducer);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load tasks assigned to the current employee on mount
  useEffect(() => {
    if (user && user.id) {
      dispatch(asyncLoadTasksByEmployee(user.id));
    }
  }, [dispatch, user]);

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // TIMER ENGINE - Calculate elapsed time for in-progress tasks
  useEffect(() => {
    const interval = setInterval(() => {
      tasks.forEach((t) => {
        if (t.status === "in-progress" && t.startTime) {
          const startTime = new Date(t.startTime).getTime();
          const now = Date.now();
          const elapsedMs = now - startTime;
          const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
          dispatch(updateTaskTimerLocal(t._id, elapsedSec));
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks, dispatch]);

  // Calculate task statistics
  const taskStats = useMemo(() => {
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter((t) => t.status === "in-progress").length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    return { totalTasks, activeTasks, completedTasks, pendingTasks };
  }, [tasks]);

  const handleLogout = () => {
    dispatch(asyncLogoutuser());
    navigate("/");
    toast.success("Logged out successfully");
  };

  const startTask = async (id) => {
    try {
      await dispatch(asyncStartTask(id));
      toast.success("Task started successfully");
    } catch (error) {
      toast.error("Failed to start task: " + error.message);
    }
  };

  const submitTask = async (id) => {
    try {
      await dispatch(asyncSubmitTask(id));
      toast.success("Task submitted successfully");
    } catch (error) {
      toast.error("Failed to submit task: " + error.message);
    }
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Calculate timer color based on percentage of estimated time
  const getTimerColor = (task) => {
    if (!task.deadline || task.status !== "in-progress") return "var(--success-color)";
    
    const now = Date.now();
    const startTime = new Date(task.startTime).getTime();
    const deadline = new Date(task.deadline).getTime();
    const elapsed = now - startTime;
    const total = deadline - startTime;
    
    if (total <= 0) return "var(--error-color)";
    
    const percentage = (elapsed / total) * 100;
    
    if (percentage >= 80) return "var(--error-color)";
    if (percentage >= 50) return "var(--warning-color)";
    return "var(--success-color)";
  };

  const getTimerBgColor = (task) => {
    if (!task.deadline || task.status !== "in-progress") return "rgba(40, 167, 69, 0.1)";
    
    const now = Date.now();
    const startTime = new Date(task.startTime).getTime();
    const deadline = new Date(task.deadline).getTime();
    const elapsed = now - startTime;
    const total = deadline - startTime;
    
    if (total <= 0) return "rgba(220, 53, 69, 0.1)";
    
    const percentage = (elapsed / total) * 100;
    
    if (percentage >= 80) return "rgba(220, 53, 69, 0.1)";
    if (percentage >= 50) return "rgba(255, 193, 7, 0.1)";
    return "rgba(40, 167, 69, 0.1)";
  };

  const formatClockTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const employeeName = user?.fullName
    ? `${user.fullName.firstName} ${user.fullName.lastName}`
    : user?.email || "Employee";

  if (loading)
    return (
      <div className="emp-main-wrapper">
        <Loader message="Loading tasks..." size="medium" />
      </div>
    );

  return (
    <div className="emp-main-wrapper">
      {/* MOBILE MENU TOGGLE */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <RiCloseLine size={24} /> : <RiMenuLine size={24} />}
      </button>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside className={`emp-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="emp-sidebar-header">
          <div className="emp-avatar">
            <span className="emp-avatar-initials">
              {employeeName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div className="emp-info">
            <h3 className="emp-name">{employeeName}</h3>
            <div className="emp-status">
              <span className="status-dot active"></span>
              <span>Active</span>
            </div>
          </div>
        </div>

        <div className="emp-sidebar-stats">
          <div className="emp-stat-item">
            <RiTaskLine size={20} />
            <div>
              <span className="stat-value">{taskStats.totalTasks}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
          </div>
          <div className="emp-stat-item">
            <RiTimeLine size={20} />
            <div>
              <span className="stat-value">{taskStats.activeTasks}</span>
              <span className="stat-label">Active</span>
            </div>
          </div>
        </div>

        <div className="emp-sidebar-clock">
          <RiTimeLine size={18} />
          <div className="clock-time">{formatClockTime(currentTime)}</div>
        </div>

        <div className="emp-sidebar-footer">
          <button 
            className="emp-logout-btn" 
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
          >
            <RiLogoutBoxLine size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="task-content">
        <div className="section-header">
          <h2 className="section-title">My Tasks</h2>
          <p className="section-subtitle">Tasks assigned to you</p>
        </div>

        <div className="task-card-list">
          {Array.isArray(tasks) && tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task._id} className="task-card">
                {/* HEADER */}
                <div className="task-header">
                  <h4>{task.title || "Untitled Task"}</h4>
                  <span className={`status ${task.status || "pending"}`}>
                    {(task.status || "pending").replace("-", " ")}
                  </span>
                </div>

                <p className="task-desc">
                  {task.description || "No description"}
                </p>

                {/* FOOTER ROW */}
                <div className="task-meta">
                  <div style={{ display: "flex", gap: "var(--spacing-sm)", alignItems: "center" }}>
                    <span className={`priority ${task.priority || "medium"}`}>
                      {task.priority || "medium"}
                    </span>
                    {task.deadline && (
                      <span className="deadline">
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "var(--spacing-sm)", alignItems: "center" }}>
                    {(task.status || "pending") === "pending" && (
                      <button
                        className="start-btn"
                        onClick={() => startTask(task._id)}
                      >
                        Start Task
                      </button>
                    )}

                    {(task.status || "pending") === "in-progress" && (
                      <>
                        <span
                          className="task-timer"
                          style={{
                            color: getTimerColor(task),
                            background: getTimerBgColor(task),
                          }}
                        >
                          <RiTimeLine size={14} />
                          {task.startTime
                            ? formatTime(
                                Math.max(
                                  0,
                                  Math.floor(
                                    (Date.now() - new Date(task.startTime).getTime()) /
                                      1000
                                  )
                                )
                              )
                            : formatTime(task.timer || 0)}
                        </span>
                        <button
                          className="submit-btn"
                          onClick={() => submitTask(task._id)}
                        >
                          Submit
                        </button>
                      </>
                    )}

                    {(task.status || "pending") === "completed" && (
                      <span className="done-label">✓ Completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-tasks-container">
              <p className="no-tasks">No tasks assigned yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
