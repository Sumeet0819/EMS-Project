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
import { toast } from "sonner";

const TaskPage = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.employeeTaskReducer);
  const { employees } = useSelector((state) => state.employeeReducer);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Load tasks and employees on mount
  useEffect(() => {
    dispatch(asyncLoadEmployeeTasks());
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  const handleCreateTask = async (newTask) => {
    try {
      await dispatch(asyncCreateEmployeeTask(newTask));
      dispatch(asyncLoadEmployeeTasks());
      setShowCreateModal(false);
      toast.success("Task Created Successfully")
    } catch (error) {
      toast.error("Failed to create task: " + error.message);
    }
  };

  const truncateText = (text, limit = 200) => {
    if (!text) return "";
    return text.length > limit ? text.slice(0, limit) + "..." : text;
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
            <div
              key={task._id}
              className="task-card"
              onClick={() => setSelectedTask(task)}
            >
              <div className="task-header">
                <h4>{task.title}</h4>
                <span className={`status ${task.status}`}>
                  {task.status.replace("-", " ")}
                </span>
              </div>

              <p className="task-desc">{truncateText(task.description, 200)}</p>

              <div className="task-meta">
                <span className={`priority ${task.priority}`}>
                  {task.priority}
                </span>

                {task.deadline && (
                  <span className="deadline">
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}

                <div
                  className="task-tools"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>
                    <RiPencilLine size={14} />
                  </span>
                  <span className="delete">
                    <RiDeleteBinLine size={14} />
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

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          className="task-modal-overlay"
          onClick={() => setSelectedTask(null)}
        >
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedTask.title}</h2>
            {selectedTask.description.length >
              0 &&(<p className="task-modal-desc">{selectedTask.description}</p>)}
            <div className="task-modal-meta">
              <p>
                <strong>Status:</strong> {selectedTask.status}
              </p>
              <p>
                <strong>Priority:</strong> {selectedTask.priority}
              </p>

              {selectedTask.deadline && (
                <p>
                  <strong>Deadline:</strong>{" "}
                  {new Date(selectedTask.deadline).toLocaleDateString()}
                </p>
              )}
            </div>

            <button className="close-btn" onClick={() => setSelectedTask(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPage;
