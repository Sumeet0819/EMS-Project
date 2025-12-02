import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadTasksByEmployee,
  asyncStartTask,
  asyncSubmitTask,
  updateTaskTimerLocal,
} from "../store/actions/employeeTaskActions";
import "../components/EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.employeeTaskReducer);
  const { user } = useSelector((state) => state.userReducer);

  // Load tasks assigned to the current employee on mount
  useEffect(() => {
    if (user && user.id) {
      dispatch(asyncLoadTasksByEmployee(user.id));
    }
  }, [dispatch, user]);

  // TIMER ENGINE - Calculate elapsed time for in-progress tasks
  useEffect(() => {
    const interval = setInterval(() => {
      tasks.forEach((t) => {
        if (t.status === "in-progress" && t.startTime) {
          const startTime = new Date(t.startTime);
          const elapsedMs = Date.now() - startTime.getTime();
          const elapsedSec = Math.floor(elapsedMs / 1000);
          dispatch(updateTaskTimerLocal(t._id, elapsedSec));
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks, dispatch]);

  const startTask = async (id) => {
    try {
      await dispatch(asyncStartTask(id));
    } catch (error) {
      alert("Failed to start task: " + error.message);
    }
  };

  const submitTask = async (id) => {
    try {
      await dispatch(asyncSubmitTask(id));
    } catch (error) {
      alert("Failed to submit task: " + error.message);
    }
  };

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (loading)
    return (
      <div className="emp-main-wrapper">
        <p>Loading tasks...</p>
      </div>
    );

  return (
    <div className="emp-main-wrapper">
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
                <div className="card-header">
                  <div>
                    <h3>{task.title || "Untitled Task"}</h3>
                    <p className="task-description">
                      {task.description || "No description"}
                    </p>
                  </div>
                </div>

                {/* STATUS & PRIORITY */}
                <div className="card-status">
                  <span className={`status-badge ${task.status || "pending"}`}>
                    {(task.status || "pending").replace("-", " ")}
                  </span>
                  <span className={`priority-badge ${task.priority || "medium"}`}>
                    {task.priority || "medium"}
                  </span>
                </div>

                {/* DEADLINE */}
                {task.deadline && (
                  <div className="task-deadline">
                    Due: {new Date(task.deadline).toLocaleDateString()}
                  </div>
                )}

                {/* FOOTER ROW */}
                <div className="card-footer">
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
                      <span className="task-timer">
                        ⏱️ {formatTime(task.timer || 0)}
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
