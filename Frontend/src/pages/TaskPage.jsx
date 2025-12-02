import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadEmployeeTasks,
  asyncCreateEmployeeTask,
} from "../store/actions/employeeTaskActions";
import { asyncLoadEmployees } from "../store/actions/employeeActions";
import CreateTask from "./CreateTask";
import "../components/TaskPage.css";
import { RiDeleteBinLine, RiPencilLine } from "@remixicon/react";

const TaskPage = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.employeeTaskReducer);
  const { employees } = useSelector((state) => state.employeeReducer);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load tasks and employees on mount
  useEffect(() => {
    dispatch(asyncLoadEmployeeTasks());
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  const handleCreateTask = async (newTask) => {
    try {
      await dispatch(asyncCreateEmployeeTask(newTask));
      // Reload tasks
      dispatch(asyncLoadEmployeeTasks());
      setShowCreateModal(false);
    } catch (error) {
      alert("Failed to create task: " + error.message);
    }
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

      <div className="tasks-grid">
        {Array.isArray(tasks) && tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task._id} className="task-card">
              <div className="task-header">
                <h4>{task.title}</h4>
                <span className={`status ${task.status}`}>
                  {task.status.replace("-", " ")}
                </span>
              </div>
              <p className="task-desc">{task.description}</p>
              <div className="task-meta">
                <span className={`priority ${task.priority}`}>
                  {task.priority}
                </span>
                {task.deadline && (
                  <span className="deadline">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
                <div className="task-tools">
                  <span>
                    {" "}
                    <RiPencilLine size={14} />
                  </span>
                  <span className="delete">
                    {" "}
                    <RiDeleteBinLine  size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No tasks found</p>
        )}
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
