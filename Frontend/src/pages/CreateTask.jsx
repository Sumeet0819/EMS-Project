import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { asyncLoadEmployees } from "../store/actions/employeeActions";
import "../styles/CreateTask.css";

const CreateTask = ({ onCancel, onSubmit, employees: passedEmployees, preSelectedEmployee }) => {
  const dispatch = useDispatch();
  const { employees: reduxEmployees, loading } = useSelector((state) => state.employeeReducer);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: preSelectedEmployee || "",
    priority: "medium",
    status: "pending",
    isDaily: false,
  });

  // Load employees on mount if not passed as prop
  useEffect(() => {
    if (!passedEmployees || passedEmployees.length === 0) {
      dispatch(asyncLoadEmployees());
    }
  }, [dispatch, passedEmployees]);

  // Update assignedTo when preSelectedEmployee changes
  useEffect(() => {
    if (preSelectedEmployee) {
      setForm(prev => ({ ...prev, assignedTo: preSelectedEmployee }));
    }
  }, [preSelectedEmployee]);

  const employees = passedEmployees && passedEmployees.length > 0 ? passedEmployees : reduxEmployees;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Find employee name by ID
    const selectedEmployee = employees.find((e) => e._id === form.assignedTo || e.id === form.assignedTo);

    // Return form to parent
    onSubmit({
      title: form.title,
      description: form.description,
      assignedTo: form.assignedTo,
      assignedToName: selectedEmployee ? `${selectedEmployee.fullName?.firstName || selectedEmployee.firstName} ${selectedEmployee.fullName?.lastName || selectedEmployee.lastName}` : "",
      priority: form.priority,
      status: form.status,
      isDaily: form.isDaily,
    });

    // Reset form
    setForm({
      title: "",
      description: "",
      assignedTo: preSelectedEmployee || "",
      priority: "medium",
      status: "pending",
      isDaily: false,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="task-box">
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <p className="sub-text">Fill in the task details and assign it to an employee.</p>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="form-group full">
            <label>Task Title</label>
            <input
              type="text"
              name="title"
              required
              onChange={handleChange}
              value={form.title}
              placeholder="Enter task title"
            />
          </div>

          <div className="form-group full">
            <label>Description</label>
            <textarea
              name="description"
              onChange={handleChange}
              value={form.description}
              placeholder="Enter task description"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Assign To</label>
            <select 
              name="assignedTo" 
              required 
              onChange={handleChange} 
              value={form.assignedTo}
              disabled={loading || employees.length === 0}
            >
              <option value="">
                {loading ? "Loading employees..." : "Select employee"}
              </option>
              {employees.map((emp) => (
                <option key={emp._id || emp.id} value={emp._id || emp.id}>
                  {emp.fullName?.firstName || emp.firstName} {emp.fullName?.lastName || emp.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select name="priority" onChange={handleChange} value={form.priority}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" onChange={handleChange} value={form.status}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group full">
            <label style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="isDaily"
                checked={form.isDaily}
                onChange={(e) => setForm({ ...form, isDaily: e.target.checked })}
                style={{ width: "auto", cursor: "pointer" }}
              />
              <span>Mark as Daily Task (recurring)</span>
            </label>
          </div>

          <div className="task-btn-row full">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={loading || employees.length === 0}>
              {loading ? (
                <span className="button-loader">
                  <span className="spinner"></span> Creating...
                </span>
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
