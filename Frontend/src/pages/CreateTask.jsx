import React, { useState } from "react";
import "../components/CreateTask.css";

const CreateTask = ({ onCancel, onSubmit, employees }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "Medium",
    status: "Pending",
    deadline: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Find employee name by ID
    const selectedEmployee = employees.find((e) => e.id == form.assignedTo);

    // Return form to parent
    onSubmit({
      title: form.title,
      description: form.description,
      assignedTo: selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "",
      priority: form.priority,
      status: form.status,
      deadline: form.deadline
    });

    // Reset form
    setForm({
      title: "",
      description: "",
      assignedTo: "",
      priority: "Medium",
      status: "Pending",
      deadline: ""
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
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
            />
          </div>

          <div className="form-group full">
            <label>Description</label>
            <textarea
              name="description"
              onChange={handleChange}
              value={form.description}
            ></textarea>
          </div>

          <div className="form-group">
            <label>Assign To</label>
            <select name="assignedTo" required onChange={handleChange} value={form.assignedTo}>
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select name="priority" onChange={handleChange} value={form.priority}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" onChange={handleChange} value={form.status}>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date"
              name="deadline"
              required
              onChange={handleChange}
              value={form.deadline}
            />
          </div>

          <div className="task-btn-row full">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
