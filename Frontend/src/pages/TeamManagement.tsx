import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiPencilLine,
} from "@remixicon/react";
import {
  asyncLoadEmployees,
  asyncDeleteEmployee,
} from "../store/actions/employeeActions";
import CreateEmployee from "../components/CreateEmployee";
import "../components/TeamManagement.css";

const TeamManagement = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((state) => state.employeeReducer);
  const [isCreateEmployee, setCreateEmployee] = useState(false);

  // Load employees on mount
  useEffect(() => {
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  const handleCreateEmployee = () => {
    setCreateEmployee(true);
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      dispatch(asyncDeleteEmployee(id));
    }
  };

  if (loading) return <div className="team-layout"><p>Loading employees...</p></div>;

  return (
    <div className="team-layout">
      <div className="team-container">
        <div className="team-header">
          <div>
            <h1>Team Management</h1>
            <p>Manage your employees and their roles</p>
          </div>
          <button className="add-employee-btn" onClick={handleCreateEmployee}>
            <span className="icon-btn">
              <RiAddLine />
            </span>
            Add Employee
          </button>
        </div>

        <div className="team-table-card">
          <h2>All Employees</h2>

          <table className="employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Role</th>
                <th className="action-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.firstName} {emp.lastName}</td>
                    <td>{emp.email}</td>
                    <td>{emp.mobile}</td>
                    <td>
                      <span
                        className={`role-badge ${
                          emp.role === "admin" ? "admin-role" : "employee-role"
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>

                    <td className="actions">
                      <button className="icon-btn" title="Edit">
                        <RiPencilLine />
                      </button>
                      <button
                        className="icon-btn delete"
                        title="Delete"
                        onClick={() => handleDeleteEmployee(emp.id)}
                      >
                        <RiDeleteBinLine />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isCreateEmployee && (
        <CreateEmployee onClose={() => setCreateEmployee(false)} />
      )}
    </div>
  );
};

export default TeamManagement;
