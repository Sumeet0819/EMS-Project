import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadEmployees,
} from "../store/actions/employeeActions";
import CreateTask from "./CreateTask";
import "../components/TaskPage.css";

const TaskPage = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.employeeReducer);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Fix Landing Page UI",
      assignedTo: "John Doe",
      priority: "High",
      status: "Pending",
      deadline: "2025-12-01"
    },
    {
      id: 2,
      title: "Prepare Monthly Report",
      assignedTo: "Jane Smith",
      priority: "Medium",
      status: "In Progress",
      deadline: "2025-12-05"
    }
  ]);

  // Load employees on mount
  useEffect(() => {
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  const handleCreateTask = (newTask) => {
    const taskObj = {
      id: tasks.length + 1,
      ...newTask
    };
    setTasks([...tasks, taskObj]);
    setShowCreateModal(false);
  };

  return (
    <div className="task-page-wrapper">
      <div className="task-header-bar">
        <div>
          <h1 className="task-title">Task Management</h1>
          <p className="task-subtitle">Manage all tasks and assign work</p>
        </div>

        <button
          className="add-task-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Task
        </button>
      </div>

      <div className="task-table-wrapper">
        <table className="task-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Deadline</th>
            </tr>
          </thead>

          <tbody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.assignedTo}</td>
                  <td>
                    <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${task.status.replace(" ", "-").toLowerCase()}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>{task.deadline}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateTask
          employees={employees}
          onCancel={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}
    </div>
  );
};

export default TaskPage;
