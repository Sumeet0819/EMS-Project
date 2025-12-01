import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncStartTask,
  asyncSubmitTask,
  updateTaskTimerLocal,
} from "../store/actions/employeeTaskActions";
import "../components/EmployeeDashboard.css";

const EmployeeTaskCards = ({ employee }) => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.employeeTaskReducer);

  // TIMER ENGINE
  useEffect(() => {
    const interval = setInterval(() => {
      tasks.forEach((t) => {
        if (t.status === "inprogress" && t.startTime) {
          const timer = Math.floor((Date.now() - t.startTime) / 1000);
          dispatch(updateTaskTimerLocal(t.id, timer));
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks, dispatch]);

  const startTask = (id) => {
    dispatch(asyncStartTask(id));
  };

  const submitTask = (id) => {
    dispatch(asyncSubmitTask(id));
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
        <h2 className="section-title">My Tasks</h2>
        <div className="task-card-list">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="task-card">
                {/* TOP ROW */}
                <div className="card-header">
                  <h3>{task.title}</h3>
                  <i className="card-menu">⋮⋮</i>
                </div>

                {/* STATUS ROW */}
                <div className="card-status">
                  <span className="progress-label">Progress</span>
                  <span className="subtask-label">
                    {task.subtasks?.done || 0}/{task.subtasks?.total || 0} subtasks
                  </span>
                </div>

                {/* TAGS */}
                <div className="card-tags">
                  <span className="tag-blue">{task.tag}</span>
                  <span className={`tag-priority ${task.priority?.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>

                {/* FOOTER ROW */}
                <div className="card-footer">
                  <span className="task-date">{task.date}</span>

                  {task.status === "inprogress" && (
                    <span className="task-timer">
                      {formatTime(task.timer || 0)}
                    </span>
                  )}

                  {task.status === "todo" && (
                    <button
                      className="start-btn"
                      onClick={() => startTask(task.id)}
                    >
                      Start
                    </button>
                  )}

                  {task.status === "inprogress" && (
                    <button
                      className="submit-btn"
                      onClick={() => submitTask(task.id)}
                    >
                      Submit
                    </button>
                  )}

                  {task.status === "done" && (
                    <span className="done-label">Completed</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No tasks assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTaskCards;
