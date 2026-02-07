import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadTasksByEmployee,
  asyncStartTask,
  asyncSubmitTask,
  updateTaskTimerLocal,
} from "../store/actions/employeeTaskActions";
import { deleteTask, updateTask } from "../store/reducers/employeeTaskSlice";
import { asyncLogoutuser } from "../store/actions/userActions";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { RiTimeLine, RiTaskLine, RiLogoutBoxLine, RiUserLine, RiMenuLine, RiCloseLine, RiFilter3Line, RiMenuFoldLine, RiMenuUnfoldLine } from "@remixicon/react";
import { toast } from "sonner";
import { useSocket } from "../contexts/SocketContext";
import "../styles/EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tasks, loading } = useSelector((state) => state.employeeTaskReducer);
  const { user } = useSelector((state) => state.userReducer);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [taskToSubmit, setTaskToSubmit] = useState(null);
  const [remarkText, setRemarkText] = useState("");
  const [filterDate, setFilterDate] = useState(null); // Date to filter tasks by
  const [activeTaskView, setActiveTaskView] = useState('daily'); // 'daily' or 'regular'
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'in-progress', 'completed'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'low', 'medium', 'high'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const socket = useSocket();

  // Load tasks assigned to the current employee on mount
  useEffect(() => {
    if (user && user.id) {
      dispatch(asyncLoadTasksByEmployee(user.id));
    }
  }, [dispatch, user]);

  // Listen for task assignment notifications via socket.io
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleTaskAssigned = (data) => {
      const { task, message } = data;
      
      // Check if the task is assigned to the current user
      const assignedToId = task?.assignedTo?._id || task?.assignedTo;
      if (assignedToId && assignedToId.toString() === user.id.toString()) {
        // Show notification using sonner
        toast.success(message || "New task assigned!", {
          description: task.title || "You have been assigned a new task",
          duration: 5000,
          action: {
            label: "View",
            onClick: () => {
              // Reload tasks to show the new task
              dispatch(asyncLoadTasksByEmployee(user.id));
            }
          }
        });

        // Reload tasks to include the newly assigned task
        dispatch(asyncLoadTasksByEmployee(user.id));
      }
    };

    const handleTaskDeleted = (data) => {
      const { taskId, taskTitle, message } = data;
      
      // Show notification using sonner
      toast.info(message || "Task deleted", {
        description: taskTitle || "A task assigned to you has been deleted",
        duration: 4000,
      });

      // Remove the task from the list using the deleteTask action
      dispatch(deleteTask(taskId));
    };

    const handleTaskUpdated = (data) => {
      const { task, message } = data;
      
      // Check if the task is assigned to the current user
      const assignedToId = task?.assignedTo?._id || task?.assignedTo;
      if (assignedToId && assignedToId.toString() === user.id.toString()) {
        // Show notification using sonner
        toast.success(message || "Task updated!", {
          description: task.title || "A task assigned to you has been updated",
          duration: 4000,
        });

        // Update the task in the list using the updateTask action
        dispatch(updateTask(task));
      }
    };

    // Listen for task assignment events
    socket.on('taskAssigned', handleTaskAssigned);
    // Listen for task deletion events
    socket.on('taskDeleted', handleTaskDeleted);
    // Listen for task update events
    socket.on('taskUpdated', handleTaskUpdated);

    // Cleanup listeners on unmount
    return () => {
      socket.off('taskAssigned', handleTaskAssigned);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('taskUpdated', handleTaskUpdated);
    };
  }, [socket, user, dispatch]);

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

  // Separate daily tasks from regular tasks, with optional date filter
  const { dailyTasks, regularTasks } = useMemo(() => {
    let filteredTasks = tasks;
    
    // Filter by date if filterDate is set
    if (filterDate) {
      const filterDateStr = filterDate.toISOString().split("T")[0];
      filteredTasks = tasks.filter((task) => {
        // For completed tasks, filter by completedTime
        if (task.status === "completed" && task.completedTime) {
          const completedDate = new Date(task.completedTime).toISOString().split("T")[0];
          return completedDate === filterDateStr;
        }
        // For other tasks, filter by createdAt or updatedAt
        if (task.createdAt) {
          const createdDate = new Date(task.createdAt).toISOString().split("T")[0];
          return createdDate === filterDateStr;
        }
        return false;
      });
    }
    
    const daily = filteredTasks.filter((t) => t.isDaily === true);
    const regular = filteredTasks.filter((t) => !t.isDaily || t.isDaily === false);
    return { dailyTasks: daily, regularTasks: regular };
  }, [tasks, filterDate]);

  // Get tasks to display based on active view
  const displayTasks = useMemo(() => {
    let tasks = activeTaskView === 'daily' ? dailyTasks : regularTasks;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(task => 
        (task.title && task.title.toLowerCase().includes(query)) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.remark && task.remark.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      tasks = tasks.filter(task => (task.status || 'pending') === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      tasks = tasks.filter(task => (task.priority || 'medium') === priorityFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      tasks = tasks.filter(task => {
        const taskDate = task.createdAt ? new Date(task.createdAt) : null;
        if (!taskDate) return false;
        
        const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        
        if (dateFilter === 'today') {
          return taskDay.getTime() === today.getTime();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return taskDay >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return taskDay >= monthAgo;
        }
        return true;
      });
    }
    
    return tasks;
  }, [activeTaskView, dailyTasks, regularTasks, searchQuery, statusFilter, priorityFilter, dateFilter]);


  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => {
      if (task.completedTime) {
        const completedDate = new Date(task.completedTime).toISOString().split("T")[0];
        return completedDate === dateStr;
      }
      return false;
    });
  };

  const navigateMonth = (direction) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFilterDate(date);
  };

  const clearDateFilter = () => {
    setFilterDate(null);
    setSelectedDate(new Date());
  };

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

  const submitTask = (id) => {
    setTaskToSubmit(id);
    setRemarkText("");
    setShowRemarkModal(true);
  };

  const handleSubmitWithRemark = async () => {
    try {
      await dispatch(asyncSubmitTask(taskToSubmit, remarkText));
      toast.success("Task submitted successfully");
      setShowRemarkModal(false);
      setTaskToSubmit(null);
      setRemarkText("");
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

  const truncateText = (text, limit = 100) => {
    if (!text) return "";
    return text.length > limit ? text.slice(0, limit) + "..." : text;
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
      <aside className={`emp-sidebar ${sidebarOpen ? "sidebar-open" : ""} ${!isSidebarVisible ? "sidebar-collapsed" : ""}`}>
        <div className="emp-sidebar-header">
          <button 
            className="sidebar-collapse-btn"
            onClick={() => setIsSidebarVisible(false)}
            title="Collapse Sidebar"
          >
            <RiMenuFoldLine size={20} />
          </button>
          <div className="emp-info">
            <h3 className="emp-name">{employeeName}</h3>
            <div className="emp-status">
              <span className="status-dot active"></span>
              <span>Active</span>
            </div>
          </div>
        </div>

        {/* Task Type Navigation */}
        <div className="task-type-nav">
          <button 
            className={`task-type-btn ${activeTaskView === 'daily' ? 'active' : ''}`}
            onClick={() => {
              setActiveTaskView('daily');
              setSidebarOpen(false);
            }}
          >
            <RiTimeLine size={18} />
            <span>Daily Tasks</span>
          </button>
          <button 
            className={`task-type-btn ${activeTaskView === 'regular' ? 'active' : ''}`}
            onClick={() => {
              setActiveTaskView('regular');
              setSidebarOpen(false);
            }}
          >
            <RiTaskLine size={18} />
            <span>Regular Tasks</span>
          </button>
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
          <div className="header-left-content">
            {!isSidebarVisible && (
              <button 
                className="sidebar-expand-btn"
                onClick={() => setIsSidebarVisible(true)}
                title="Expand Sidebar"
              >
                <RiMenuUnfoldLine size={24} />
              </button>
            )}
            <div>
              <h2 className="section-title">My Tasks</h2>
              <p className="section-subtitle">Tasks assigned to you</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-bar">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks by title, description, or remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          
          <button 
            className="filter-toggle-btn" 
            onClick={() => setIsFilterOpen(true)}
          >
            <RiFilter3Line size={20} />
            <span>Filters</span>
            {(statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all') && (
              <span className="filter-indicator-dot"></span>
            )}
          </button>
        </div>

        {/* Filter Sidebar Overlay */}
        {isFilterOpen && (
          <div className="filter-overlay" onClick={() => setIsFilterOpen(false)}></div>
        )}

        {/* Filter Sidebar */}
        <div className={`filter-sidebar ${isFilterOpen ? 'open' : ''}`}>
          <div className="filter-sidebar-header">
            <h3>Filters</h3>
            <button className="close-filter-btn" onClick={() => setIsFilterOpen(false)}>
              <RiCloseLine size={24} />
            </button>
          </div>
          
          <div className="filter-sidebar-content">
            <div className="filter-section">
              <span className="filter-label">Status</span>
              <div className="filter-pills vertical">
                <button
                  className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All Status
                </button>
                <button
                  className={`filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={`filter-pill ${statusFilter === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('in-progress')}
                >
                  In Progress
                </button>
                <button
                  className={`filter-pill ${statusFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('completed')}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className="filter-section">
              <span className="filter-label">Priority</span>
              <div className="filter-pills vertical">
                <button
                  className={`filter-pill ${priorityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('all')}
                >
                  All Priority
                </button>
                <button
                  className={`filter-pill ${priorityFilter === 'low' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('low')}
                >
                  Low
                </button>
                <button
                  className={`filter-pill ${priorityFilter === 'medium' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('medium')}
                >
                  Medium
                </button>
                <button
                  className={`filter-pill ${priorityFilter === 'high' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('high')}
                >
                  High
                </button>
              </div>
            </div>

            <div className="filter-section">
              <span className="filter-label">Date</span>
              <div className="filter-pills vertical">
                <button
                  className={`filter-pill ${dateFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDateFilter('all')}
                >
                  All Time
                </button>
                <button
                  className={`filter-pill ${dateFilter === 'today' ? 'active' : ''}`}
                  onClick={() => setDateFilter('today')}
                >
                  Today
                </button>
                <button
                  className={`filter-pill ${dateFilter === 'week' ? 'active' : ''}`}
                  onClick={() => setDateFilter('week')}
                >
                  This Week
                </button>
                <button
                  className={`filter-pill ${dateFilter === 'month' ? 'active' : ''}`}
                  onClick={() => setDateFilter('month')}
                >
                  This Month
                </button>
              </div>
            </div>
          </div>

          <div className="filter-sidebar-footer">
            {(statusFilter !== 'all' || priorityFilter !== 'all' || dateFilter !== 'all') ? (
              <button
                className="clear-all-filters-btn full-width"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setDateFilter('all');
                }}
              >
                Clear All Filters
              </button>
            ) : (
                <button
                className="clear-all-filters-btn full-width disabled"
                disabled
              >
                No Active Filters
              </button>
            )}
        </div>
        </div>

        <div className="content-with-calendar">
          <div className="tasks-section">
            {/* Modern Task Table */}
            <div className="modern-tasks-container">
              {displayTasks.length > 0 ? (
                <table className="modern-tasks-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Timer</th>
                      <th>Remarks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTasks.map((task) => (
                      <tr key={task._id} className={`task-row ${task.status}`}>
                        <td className="task-info-cell">
                          <div className="task-info">
                            <strong className="task-name">{task.title || "Untitled Task"}</strong>
                            <p className="task-description">{truncateText(task.description || "No description", 60)}</p>
                          </div>
                        </td>
                        <td>
                          <span className={`task-type-badge ${activeTaskView}`}>
                            {activeTaskView === 'daily' ? 'Daily' : 'Regular'}
                          </span>
                        </td>
                        <td>
                          <span className={`priority-badge ${task.priority || "medium"}`}>
                            {task.priority || "medium"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${task.status || "pending"}`}>
                            {(task.status || "pending").replace("-", " ")}
                          </span>
                        </td>
                        <td className="timer-cell">
                          {(task.status || "pending") === "in-progress" && (
                            <span
                              className="task-timer-badge"
                              style={{
                                color: getTimerColor(task),
                                background: getTimerBgColor(task),
                              }}
                            >
                              <RiTimeLine size={12} />
                              {task.startTime
                                ? formatTime(
                                    Math.max(
                                      0,
                                      Math.floor(
                                        (Date.now() - new Date(task.startTime).getTime()) / 1000
                                      )
                                    )
                                  )
                                : formatTime(task.timer || 0)}
                            </span>
                          )}
                          {(task.status || "pending") !== "in-progress" && "-"}
                        </td>
                        <td className="remarks-cell">
                          {task.remark ? (
                            <span className="remark-text" title={task.remark}>
                              {truncateText(task.remark, 50)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="actions-cell">
                          <div className="task-actions">
                            {(task.status || "pending") === "pending" && (
                              <button
                                className="action-btn start-btn"
                                onClick={() => startTask(task._id)}
                              >
                                Start
                              </button>
                            )}
                            {(task.status || "pending") === "in-progress" && (
                              <button
                                className="action-btn submit-btn"
                                onClick={() => submitTask(task._id)}
                              >
                                Submit
                              </button>
                            )}
                            {(task.status || "pending") === "completed" && (
                              <span className="completed-badge">✓ Done</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-tasks-state">
                  <RiTaskLine size={48} />
                  <h3>No {activeTaskView} tasks found</h3>
                  <p>There are no {activeTaskView} tasks assigned to you yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* CALENDAR COMPONENT */}
          {/* <div className="calendar-container">
            <div className="calendar-sidebar-header">
              <h3>Calendar</h3>
              {filterDate && (
                <button className="calendar-clear-btn" onClick={clearDateFilter} title="Clear filter">
                  Clear
                </button>
              )}
            </div>
            <div className="calendar-view">
              <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}>
                  ←
                </button>
                <h4 className="calendar-month-title">
                  {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h4>
                <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}>
                  →
                </button>
              </div>
              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <div key={idx} className="calendar-weekday">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="calendar-days">
                  {getDaysInMonth(selectedDate).map((date, index) => {
                    const dayTasks = date ? getTasksForDate(date) : [];
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    const isSelected = date && filterDate && date.toDateString() === filterDate.toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`calendar-day ${!date ? "empty" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                        onClick={() => date && handleDateSelect(date)}
                      >
                        {date && (
                          <>
                            <span className="calendar-day-number">{date.getDate()}</span>
                            {dayTasks.length > 0 && (
                              <span className="calendar-task-indicator" title={`${dayTasks.length} task(s)`}>
                                {dayTasks.length}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Remark Modal */}
        {showRemarkModal && (
          <div className="remark-modal-overlay" onClick={() => setShowRemarkModal(false)}>
            <div className="remark-modal" onClick={(e) => e.stopPropagation()}>
              <div className="remark-modal-header">
                <h3>Add Remark</h3>
                <button className="close-btn" onClick={() => setShowRemarkModal(false)}>
                  ×
                </button>
              </div>
              <div className="remark-modal-body">
                <p className="remark-modal-text">Please add a remark for this task submission:</p>
                <textarea
                  className="remark-textarea"
                  placeholder="Enter your remark here..."
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="remark-modal-footer">
                <button
                  className="cancel-remark-btn"
                  onClick={() => {
                    setShowRemarkModal(false);
                    setTaskToSubmit(null);
                    setRemarkText("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="submit-remark-btn"
                  onClick={handleSubmitWithRemark}
                  disabled={!remarkText.trim()}
                >
                  Submit Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
