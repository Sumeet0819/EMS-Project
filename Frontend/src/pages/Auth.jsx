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
  const [employeeForm, setEmployeeForm] = useState({ email: "", password: "" });

  const handleAdminChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleEmployeeChange = (e) => {
    setEmployeeForm({ ...employeeForm, [e.target.name]: e.target.value });
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    dispatch(asyncLoginuser(adminForm, navigate))
      .then(() => {
        // Navigation happens in the action
        console.log("Admin login successful");
      })
      .catch((err) => {
        console.error("Admin login error:", err);
        setError(err.response?.data?.message || err.message || "Login failed");
        setLoading(false);
      });
  };

  const handleEmployeeSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    dispatch(asyncLoginuser(employeeForm, navigate))
      .then(() => {
        // Navigation happens in the action
        console.log("Employee login successful");
      })
      .catch((err) => {
        console.error("Employee login error:", err);
        setError(err.response?.data?.message || err.message || "Login failed");
        setLoading(false);
      });
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
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
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
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={employeeForm.email}
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
