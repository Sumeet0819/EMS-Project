import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  asyncLoadEmployeeTasks,
  asyncCreateEmployeeTask,
  asyncUpdateEmployeeTask,
  asyncDeleteEmployeeTask,
} from "../store/actions/employeeTaskActions";
import { asyncLoadEmployees } from "../store/actions/employeeActions";
import { updateTask, deleteTask } from "../store/reducers/employeeTaskSlice";
import { useSocket } from "../contexts/SocketContext";
import CreateTask from "./CreateTask";
import "../components/TaskPage.css";
import { RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import { toast } from "sonner";

const TaskPage = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const { tasks, loading } = useSelector((state) => state.employeeTaskReducer);
  const { employees } = useSelector((state) => state.employeeReducer);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
    deadline: "",
  });

  // Load tasks and employees on mount
  useEffect(() => {
    dispatch(asyncLoadEmployeeTasks());
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  // Listen for real-time task updates via socket.io
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = (data) => {
      const { task } = data;
      // Update the task in the Redux store
      dispatch(updateTask(task));
      
      // Only update selected task if we're NOT in edit mode (to prevent modal from reopening)
      if (selectedTask && selectedTask._id === task._id && !isEditMode) {
        setSelectedTask(task);
      }
    };

    const handleTaskDeleted = (data) => {
      const { taskId } = data;
      // Remove the task from the Redux store
      dispatch(deleteTask(taskId));
      
      // Clear selected task if it was deleted
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(null);
        setIsEditMode(false);
      }
    };

    const handleTaskStatusChanged = (data) => {
      const { task, message } = data;
      // Update the task in the Redux store
      dispatch(updateTask(task));
      
      // Show notification
      toast.info(message || "Task status changed", {
        description: task.title,
        duration: 4000,
      });
      
      // Only update selected task if we're NOT in edit mode (to prevent modal from reopening)
      if (selectedTask && selectedTask._id === task._id && !isEditMode) {
        setSelectedTask(task);
      }
    };

    const handleTaskUpdatedBroadcast = (data) => {
      const { task } = data;
      // Update the task in the Redux store
      dispatch(updateTask(task));
      
      // Only update selected task if we're NOT in edit mode (to prevent modal from reopening)
      if (selectedTask && selectedTask._id === task._id && !isEditMode) {
        setSelectedTask(task);
      }
    };

    // Listen for task update events
    socket.on('taskUpdatedBroadcast', handleTaskUpdatedBroadcast);
    socket.on('taskStatusChanged', handleTaskStatusChanged);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);

    // Cleanup listeners on unmount
    return () => {
      socket.off('taskUpdatedBroadcast', handleTaskUpdatedBroadcast);
      socket.off('taskStatusChanged', handleTaskStatusChanged);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
    };
  }, [socket, dispatch, selectedTask, isEditMode]);

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

  const handleEditClick = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsEditMode(true);
    // Format deadline for input (YYYY-MM-DD)
    const deadlineDate = task.deadline
      ? new Date(task.deadline).toISOString().split("T")[0]
      : "";
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      deadline: deadlineDate,
    });
  };

  const handleDeleteClick = (task, e) => {
    e.stopPropagation();
    toast.custom((t) => (
      <div className="confirm-toast">
        <p>Are you sure you want to delete this task?</p>
        <p style={{ fontSize: "12px", color: "var(--text-color-muted)", marginTop: "4px" }}>
          "{task.title}"
        </p>
        <div className="confirm-actions">
          <button
            className="confirm-yes"
            onClick={async () => {
              toast.dismiss(t);
              try {
                await dispatch(asyncDeleteEmployeeTask(task._id));
                dispatch(asyncLoadEmployeeTasks());
                toast.success("Task deleted successfully");
                if (selectedTask?._id === task._id) {
                  setSelectedTask(null);
                  setIsEditMode(false);
                }
              } catch (error) {
                toast.error("Failed to delete task: " + error.message);
              }
            }}
          >
            Yes
          </button>
          <button className="confirm-no" onClick={() => toast.dismiss(t)}>
            No
          </button>
        </div>
      </div>
    ));
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const taskId = selectedTask._id;
      await dispatch(
        asyncUpdateEmployeeTask(taskId, {
          title: editForm.title,
          description: editForm.description,
          assignedTo: editForm.assignedTo,
          priority: editForm.priority,
          status: editForm.status,
          deadline: editForm.deadline || undefined,
        })
      );
      dispatch(asyncLoadEmployeeTasks());
      toast.success("Task updated successfully");
      // Close modal and clear edit mode
      setIsEditMode(false);
      setSelectedTask(null);
      // Clear edit form
      setEditForm({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        status: "pending",
        deadline: "",
      });
    } catch (error) {
      toast.error("Failed to update task: " + error.message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedTask(null);
    setEditForm({
      title: "",
      description: "",
      assignedTo: "",
      priority: "medium",
      status: "pending",
      deadline: "",
    });
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
                  <span onClick={(e) => handleEditClick(task, e)} title="Edit Task">
                    <RiPencilLine size={14} />
                  </span>
                  <span
                    className="delete"
                    onClick={(e) => handleDeleteClick(task, e)}
                    title="Delete Task"
                  >
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

      {/* Task Details/Edit Modal */}
      {selectedTask && (
        <div
          className="task-modal-overlay"
          onClick={() => {
            if (!isEditMode) {
              setSelectedTask(null);
            }
          }}
        >
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            {isEditMode ? (
              <>
                <div className="modal-header">
                  <h2>Edit Task</h2>
                  <button
                    className="close-btn"
                    type="button"
                    onClick={handleCancelEdit}
                  >
                    ×
                  </button>
                </div>
                <p className="sub-text">Update the task details below.</p>
                <form className="task-form" onSubmit={handleUpdateTask}>
                  <div className="form-group full">
                    <label>Task Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      value={editForm.title}
                      placeholder="Enter task title"
                    />
                  </div>

                  <div className="form-group full">
                    <label>Description</label>
                    <textarea
                      name="description"
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                      value={editForm.description}
                      placeholder="Enter task description"
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Assign To</label>
                    <select
                      name="assignedTo"
                      required
                      onChange={(e) =>
                        setEditForm({ ...editForm, assignedTo: e.target.value })
                      }
                      value={editForm.assignedTo}
                    >
                      <option value="">Select employee</option>
                      {employees.map((emp) => (
                        <option
                          key={emp._id || emp.id}
                          value={emp._id || emp.id}
                        >
                          {emp.fullName?.firstName || emp.firstName}{" "}
                          {emp.fullName?.lastName || emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      name="priority"
                      onChange={(e) =>
                        setEditForm({ ...editForm, priority: e.target.value })
                      }
                      value={editForm.priority}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                      value={editForm.status}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      onChange={(e) =>
                        setEditForm({ ...editForm, deadline: e.target.value })
                      }
                      value={editForm.deadline}
                    />
                  </div>

                  <div className="task-btn-row full">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="primary-btn">
                      Update Task
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <h2>{selectedTask.title}</h2>
                  <button
                    className="close-btn"
                    type="button"
                    onClick={() => {
                      setSelectedTask(null);
                      setIsEditMode(false);
                    }}
                  >
                    ×
                  </button>
                </div>
                {selectedTask.description &&
                  selectedTask.description.length > 0 && (
                    <p className="task-modal-desc">
                      {selectedTask.description}
                    </p>
                  )}
                <div className="task-modal-meta">
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`status ${selectedTask.status}`}>
                      {selectedTask.status.replace("-", " ")}
                    </span>
                  </p>
                  <p>
                    <strong>Priority:</strong>{" "}
                    <span className={`priority ${selectedTask.priority}`}>
                      {selectedTask.priority}
                    </span>
                  </p>
                  {selectedTask.assignedTo && (
                    <p>
                      <strong>Assigned To:</strong>{" "}
                      {selectedTask.assignedTo?.fullName?.firstName ||
                        selectedTask.assignedTo?.firstName}{" "}
                      {selectedTask.assignedTo?.fullName?.lastName ||
                        selectedTask.assignedTo?.lastName}
                    </p>
                  )}
                  {selectedTask.deadline && (
                    <p>
                      <strong>Deadline:</strong>{" "}
                      {new Date(selectedTask.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="task-modal-actions">
                  <button
                    className="edit-btn-modal"
                    onClick={() => handleEditClick(selectedTask, { stopPropagation: () => {} })}
                  >
                    <RiPencilLine size={16} /> Edit Task
                  </button>
                  <button
                    className="delete-btn-modal"
                    onClick={() => handleDeleteClick(selectedTask, { stopPropagation: () => {} })}
                  >
                    <RiDeleteBinLine size={16} /> Delete Task
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPage;
