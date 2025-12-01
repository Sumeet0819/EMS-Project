import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { asyncLoginuser } from "../store/actions/userActions";
import "../components/styles/auth.css";

const Auth = () => {
  const [isEmployee, setIsEmployee] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [employeeForm, setEmployeeForm] = useState({ employeeId: "", password: "" });

  const handleAdminChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleEmployeeChange = (e) => {
    setEmployeeForm({ ...employeeForm, [e.target.name]: e.target.value });
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await dispatch(asyncLoginuser(adminForm, navigate, "admin"));
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await dispatch(asyncLoginuser({ email: employeeForm.employeeId, password: employeeForm.password }, navigate, "employee"));
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-left-container">
        <img src="https://images.unsplash.com/photo-1635776062360-af423602aff3?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" />
      </div>
      <div className="auth-right-container">
        <div className="auth-header">
          <div className="toggle">
            <span
              className={!isEmployee ? "active" : ""}
              onClick={() => {
                setIsEmployee(false);
                setError("");
              }}
            >
              Admin
            </span>

            <span
              className={isEmployee ? "active" : ""}
              onClick={() => {
                setIsEmployee(true);
                setError("");
              }}
            >
              Employee
            </span>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-body">
            {!isEmployee ? (
              <form className="auth-form" onSubmit={handleAdminSubmit}>
                <h2>Admin Login</h2>

                {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

                <div className="input-container">
                  <label>Email / Username</label>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter your email address or username"
                    value={adminForm.email}
                    onChange={handleAdminChange}
                    required
                  />
                </div>

                <div className="input-container">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={adminForm.password}
                    onChange={handleAdminChange}
                    required
                  />
                </div>

                <button className="button-ui" type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleEmployeeSubmit}>
                <h2>Employee Login</h2>

                {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

                <div className="input-container">
                  <label>Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    placeholder="Enter your employee ID"
                    value={employeeForm.employeeId}
                    onChange={handleEmployeeChange}
                    required
                  />
                </div>

                <div className="input-container">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    value={employeeForm.password}
                    onChange={handleEmployeeChange}
                    required
                  />
                </div>

                <button className="button-ui" type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
