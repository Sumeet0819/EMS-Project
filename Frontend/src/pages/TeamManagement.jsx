import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  RiAddLine,
} from "@remixicon/react";
import {
  asyncLoadEmployees,
  asyncDeleteEmployee,
  asyncUpdateEmployee,
} from "../store/actions/employeeActions";
import CreateEmployee from "../components/CreateEmployee";
import EmployeeCard from "../components/EmployeeCard";
import "../components/styles/TeamManagement.css";
import "../components/styles/EmployeeCard.css";
import {toast ,Toaster } from "sonner"

const TeamManagement = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((state) => state.employeeReducer);
  const [isCreateEmployee, setCreateEmployee] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Load employees on mount
  useEffect(() => {
    dispatch(asyncLoadEmployees());
  }, [dispatch]);

  const handleCreateEmployee = () => {
    setCreateEmployee(true);
  };

const handleDeleteEmployee = (id) => {
  toast.custom((t) => (
    <div className="confirm-toast">
      <p>Are you sure you want to delete this employee?</p>

      <div className="confirm-actions">
        <button
          className="confirm-yes"
          onClick={() => {
            toast.dismiss(t);

            dispatch(asyncDeleteEmployee(id)).then(() => {
              dispatch(asyncLoadEmployees());
              toast.success("Employee deleted");
            });
          }}
        >
          Yes
        </button>

        <button
          className="confirm-no"
          onClick={() => toast.dismiss(t)}
        >
          No
        </button>
      </div>
    </div>
  ));
};

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleCreateClose = () => {
    setCreateEmployee(false);
    // Reload employees after creation
    dispatch(asyncLoadEmployees());
  
  };

  const handleUpdateEmployee = (e) => {
    e.preventDefault();
    const updatedEmployee = {
      ...selectedEmployee,
      fullName: {
        firstName: e.target.firstName.value,
        lastName: e.target.lastName.value,
      },
      email: e.target.email.value,
      role: e.target.role.value,
    };
    dispatch(asyncUpdateEmployee(updatedEmployee));
    setEditModalOpen(false);
      toast.success("Employee Details Updated Successfully")
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
          <div className="employee-grid">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <EmployeeCard
                  key={emp._id || emp.id}
                  employee={emp}
                  onDelete={handleDeleteEmployee}
                  onEdit={handleEdit}
                />
              ))
            ) : (
              <p>No employees found</p>
            )}
          </div>
        </div>
      </div>
      {isCreateEmployee && (
        <CreateEmployee onClose={handleCreateClose} />
      )}
      {isEditModalOpen && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Employee</h2>
            <form onSubmit={handleUpdateEmployee}>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  defaultValue={selectedEmployee.fullName.firstName}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  defaultValue={selectedEmployee.fullName.lastName}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={selectedEmployee.email}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" defaultValue={selectedEmployee.role} required>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit">Update</button>
                <button type="button" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
