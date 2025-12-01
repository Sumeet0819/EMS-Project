import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { asyncCreateEmployee } from "../store/actions/employeeActions";
import "./CreateEmployee.css";

const CreateEmployee = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.employeeReducer);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    role: "employee",
    password: "default123", // Default password
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(asyncCreateEmployee(form));
      alert("Employee created successfully!");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        role: "employee",
        password: "default123",
      });
      onClose();
    } catch (error) {
      alert("Failed to create employee: " + error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add New Employee</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <p className="sub-text">
          Enter the employee details below. They will receive login credentials via email.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="John"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Doe"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="john.doe@manj.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full">
            <label>Mobile Number</label>
            <input
              type="text"
              name="mobile"
              placeholder="+1234567890"
              value={form.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="btn-row">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Creating..." : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployee;
