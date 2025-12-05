import React from "react";
import "./TaskDistribution.css";

const TaskDistribution = ({ completed, progress, pending }) => {
  const total = completed + progress + pending;
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const progressPercent = total > 0 ? (progress / total) * 100 : 0;
  const pendingPercent = total > 0 ? (pending / total) * 100 : 0;

  return (
    <div className="task-dist-card">
      <h3>Task Distribution</h3>

      <div className="bar-group">
        <p>
          Completed <span>{completed} tasks</span>
        </p>
        <div className="bar">
          <div className="completed" style={{ width: `${completedPercent}%` }}></div>
        </div>
      </div>

      <div className="bar-group">
        <p>
          In Progress <span>{progress} tasks</span>
        </p>
        <div className="bar">
          <div className="progress" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="bar-group">
        <p>
          Pending <span>{pending} tasks</span>
        </p>
        <div className="bar">
          <div className="pending" style={{ width: `${pendingPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default TaskDistribution;
