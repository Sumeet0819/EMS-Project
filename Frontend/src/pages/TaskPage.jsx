import React, { useState, useEffect, useMemo } from "react";
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
import "../styles/TaskPage.css";
import { RiDeleteBinLine, RiPencilLine, RiEyeLine, RiAddLine } from "@remixicon/react";
import { toast } from "sonner";
import TaskDetailsModal from "../components/TaskDetailsModal";
import SearchBar from "../components/common/SearchBar";
import ViewToggle from "../components/common/ViewToggle";

const TaskPage = () => {
  const dispatch = useDispatch();
  const socket = useSocket();
  const { tasks, loading } = useSelector((state) => state.employeeTaskReducer);
  const { employees } = useSelector((state) => state.employeeReducer);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
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

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailsModal(true);
  };

  const handleEditClick = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsEditMode(true);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Employee filter
      if (employeeFilter) {
        const assignedToId = task.assignedTo?._id || task.assignedTo;
        if (assignedToId !== employeeFilter) return false;
      }

      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      
      const title = (task.title || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      
      // Check assignee name if available
      let assigneeName = "";
      if (task.assignedTo && typeof task.assignedTo === 'object') {
         if (task.assignedTo.fullName) {
            assigneeName = `${task.assignedTo.fullName.firstName || ''} ${task.assignedTo.fullName.lastName || ''}`;
         } else if (task.assignedTo.email) {
            assigneeName = task.assignedTo.email;
         }
      }
      
      return title.includes(query) || description.includes(query) || assigneeName.toLowerCase().includes(query);
    });
  }, [tasks, employeeFilter, searchQuery]);

  return (
    <div className="task-page-wrapper">
      <div className="task-header-bar">
        <div>
          <h1 className="task-title">Task Management</h1>
          <p className="task-subtitle">Manage all tasks and assign work</p>
        </div>

        <div className="header-actions">
          <SearchBar 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
          />
          <ViewToggle 
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          
          <select
            className="employee-filter-select"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: "var(--border-radius-sm)",
              border: "1px solid var(--border-light)",
              background: "var(--surface-color)",
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
              minWidth: "200px",
            }}
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp._id || emp.id} value={emp._id || emp.id}>
                {emp.fullName?.firstName || emp.firstName} {emp.fullName?.lastName || emp.lastName}
              </option>
            ))}
          </select>
          
          <button
            className="add-task-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Task
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
      <div className="tasks-table-container">
        {Array.isArray(tasks) && tasks.length > 0 ? (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task._id} onClick={() => handleViewDetails(task)}>
                  <td className="task-title-cell">
                    <strong>{task.title}</strong>
                  </td>
                  <td className="task-desc-cell">
                    {truncateText(task.description, 100)}
                  </td>
                  <td className="task-assigned-cell">
                    {task.assignedTo?.fullName
                      ? `${task.assignedTo.fullName.firstName} ${task.assignedTo.fullName.lastName}`
                      : task.assignedTo?.email || "Unassigned"}
                  </td>
                  <td>
                <span className={`priority ${task.priority}`}>
                  {task.priority}
                </span>
                  </td>
                  <td>
                    <span className={`status ${task.status}`}>
                      {task.status.replace("-", " ")}
                  </span>
                  </td>
                  <td className="task-actions-cell" onClick={(e) => e.stopPropagation()}>
                    <div className="task-tools">
                  <span onClick={(e) => handleEditClick(task, e)} title="Edit Task">
                        <RiPencilLine size={16} />
                  </span>
                  <span
                    className="delete"
                    onClick={(e) => handleDeleteClick(task, e)}
                    title="Delete Task"
                  >
                        <RiDeleteBinLine size={16} />
                  </span>
                </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><img src="./task.svg" alt="" /></div>
                <h3>No Tasks Yet</h3>
                <p>Get started by adding your first task to the team.</p>
                <button className="empty-state-btn" onClick={() => setShowCreateModal(true)}>
                  <RiAddLine size={16} />
                  Add First Task
                </button>
              </div>
        )}
      </div>
      ) : (
        <div className="tasks-grid-container">
          {Array.isArray(tasks) && tasks.length > 0 ? (
            <div className="tasks-grid">
              {filteredTasks.map((task) => (
                  <div key={task._id} className="task-grid-card" onClick={() => handleViewDetails(task)}>
                    <div className="task-card-header">
                      <span className={`priority-badge ${task.priority}`}>
                        {task.priority}
                      </span>
                      <div className="task-card-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="edit-btn-card"
                          onClick={(e) => handleEditClick(task, e)}
                          title="Edit Task"
                        >
                          <span style={{ color: "var(--primary-color)" }}><RiPencilLine size={16} /></span>
                        </button>
                        <button
                          className="delete-btn-card"
                          onClick={(e) => handleDeleteClick(task, e)}
                          title="Delete Task"
                        >
                          <span style={{ color: "var(--primary-color)" }}><RiDeleteBinLine size={16} /></span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="task-card-body">
                      <h3 className="task-card-title">{task.title}</h3>
                      <p className="task-card-description">
                        {truncateText(task.description, 80)}
                      </p>
                      
                      <div className="task-card-meta">
                        <div className="task-card-assignee">
                          <span className="meta-label">Assigned to:</span>
                          <span className="meta-value">
                            {task.assignedTo?.fullName
                              ? `${task.assignedTo.fullName.firstName} ${task.assignedTo.fullName.lastName}`
                              : task.assignedTo?.email || "Unassigned"}
                          </span>
                        </div>
                        
                        <span className={`status-badge ${task.status}`}>
                          {task.status.replace("-", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><img src="./task.svg" alt="" /></div>
              <h3>No Tasks Yet</h3>
              <p>Get started by adding your first task to the team.</p>
              <button className="empty-state-btn" onClick={() => setShowCreateModal(true)}>
                <RiAddLine size={16} />
                Add First Task
              </button>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateTask
          employees={employees}
          preSelectedEmployee={employeeFilter}
          onCancel={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {/* Task Edit Modal */}
      {isEditMode && selectedTask && (
        <div
          className="task-modal-overlay"
          onClick={() => {
            setIsEditMode(false);
            setSelectedTask(null);
          }}
        >
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
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
          </div>
        </div>
      )}
      {showDetailsModal && selectedTask && (
        <TaskDetailsModal 
          task={selectedTask} 
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTask(null);
          }} 
        />
      )}
    </div>
  );
};

export default TaskPage;
