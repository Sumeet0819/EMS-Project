import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { asyncCreateEmployee } from "../store/actions/employeeActions";
import "./CreateEmployee.css";
import { toast } from "sonner";

const CreateEmployee = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.employeeReducer);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "default123",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(asyncCreateEmployee(form));
      toast.success("Employee Created Successfully")
      onClose();
    } catch (error) {
       toast.error("Failed to Create Employee")
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
          Enter the employee details. Default role is 'employee'. Default password is 'default123'.
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
              placeholder="john.doe@company.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group full">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="default123"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="btn-row">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? (
                <span className="button-loader">
                  <span className="spinner"></span> Creating...
                </span>
              ) : (
                "Add Employee"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployee;
