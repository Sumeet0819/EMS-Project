import React from "react";
import "./TaskDistribution.css";

const TaskDistribution = ({ completed, progress, pending }) => {
  return (
    <div className="task-dist-card">
      <h3>Task Distribution</h3>

      <div className="bar-group">
        <p>Completed</p>
        <div className="bar completed"></div>
        <span>{completed} tasks</span>
      </div>

      <div className="bar-group">
        <p>In Progress</p>
        <div className="bar progress"></div>
        <span>{progress} tasks</span>
      </div>

      <div className="bar-group">
        <p>Pending</p>
        <div className="bar pending"></div>
        <span>{pending} tasks</span>
      </div>
    </div>
  );
};

export default TaskDistribution;
