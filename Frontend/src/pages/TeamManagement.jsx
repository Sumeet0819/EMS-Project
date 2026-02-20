import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  RiAddLine, RiPencilLine, RiDeleteBinLine, RiCloseLine
} from "@remixicon/react";
import SearchBar from "../components/common/SearchBar";
import ViewToggle from "../components/common/ViewToggle";
import {
  asyncLoadEmployees,
  asyncDeleteEmployee,
  asyncUpdateEmployee,
} from "../store/actions/employeeActions";
import CreateEmployee from "../components/CreateEmployee";
import EmployeeCard from "../components/EmployeeCard";
import "../styles/TeamManagement.css";
import "../styles/EmployeeCard.css";
import {toast ,Toaster } from "sonner"

const TeamManagement = () => {
  const dispatch = useDispatch();
  const { employees, loading } = useSelector((state) => state.employeeReducer);
  const [isCreateEmployee, setCreateEmployee] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const firstName = emp.fullName?.firstName || emp.firstName || "";
      const lastName = emp.fullName?.lastName || emp.lastName || "";
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [employees, searchQuery]);

  return (
    <div className="team-layout">
      <div className="team-container">
        <div className="team-header">
          <div>
            <h1>Team Management</h1>
            <p>Manage your employees and their roles</p>
          </div>
          <div className="header-actions">
            <SearchBar 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
            />
            <ViewToggle 
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            <button className="add-employee-btn" onClick={handleCreateEmployee}>
              <span className="icon-btn">
                <RiAddLine size={16} />
              </span>
              Add Employee
            </button>
          </div>
        </div>

        <div className="team-table-card">
          <h2 data-count={filteredEmployees.length > 0 ? `${filteredEmployees.length} ${filteredEmployees.length === 1 ? 'Employee' : 'Employees'}` : ''}>
            All Employees
          </h2>
          
          {viewMode === 'list' ? (
            <div className="employees-table-container">
              {filteredEmployees.length > 0 ? (
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr key={emp._id || emp.id}>
                        <td className="employee-name-cell">
                          <strong>
                            {emp.fullName?.firstName || emp.firstName} {emp.fullName?.lastName || emp.lastName}
                          </strong>
                        </td>
                        <td className="employee-email-cell">{emp.email}</td>
                        <td>
                          <span className={`role-badge ${emp.role}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="employee-actions-cell">
                          <div className="employee-actions">
                            <button
                              className="edit-btn"
                              onClick={() => handleEdit(emp)}
                              title="Edit Employee"
                            >
                              <RiPencilLine size={18} />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteEmployee(emp._id || emp.id)}
                              title="Delete Employee"
                            >
                              <RiDeleteBinLine size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon"><img src="./emp.svg" alt="" /></div>
                  <h3>No Employees Yet</h3>
                  <p>Get started by adding your first employee to the team.</p>
                  <button className="empty-state-btn" onClick={handleCreateEmployee}>
                    <RiAddLine size={16} />
                    Add First Employee
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="employees-grid-container">
              {filteredEmployees.length > 0 ? (
                <div className="employees-grid">
                  {filteredEmployees.map((emp) => (
                    <div key={emp._id || emp.id} className="employee-grid-card">
                      <div className="employee-card-header">
                        <div className="employee-avatar">
                          {(emp.fullName?.firstName?.[0] || emp.firstName?.[0] || 'E').toUpperCase()}
                        </div>
                        <div className="employee-card-actions">
                          <button
                            className="edit-btn-card"
                            onClick={() => handleEdit(emp)}
                            title="Edit Employee"
                          >
                            <span style={{ color: "var(--primary-color)" }}><RiPencilLine size={16} /></span>
                          </button>
                          <button
                            className="delete-btn-card"
                            onClick={() => handleDeleteEmployee(emp._id || emp.id)}
                            title="Delete Employee"
                          >
                            <span style={{ color: "var(--primary-color)" }}><RiDeleteBinLine size={16} /></span>
                          </button>
                        </div>
                      </div>
                      <div className="employee-card-body">
                        <h3 className="employee-card-name">
                          {emp.fullName?.firstName || emp.firstName} {emp.fullName?.lastName || emp.lastName}
                        </h3>
                        <p className="employee-card-email">{emp.email}</p>
                        <span className={`role-badge ${emp.role}`}>
                          {emp.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon"><img src="./emp.svg" alt="" /></div>
                  <h3>No Employees Yet</h3>
                  <p>Get started by adding your first employee to the team.</p>
                  <button className="empty-state-btn" onClick={handleCreateEmployee}>
                    <RiAddLine size={16} />
                    Add First Employee
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isCreateEmployee && (
        <CreateEmployee onClose={handleCreateClose} />
      )}
      {isEditModalOpen && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>Edit Employee</h2>
              <button
                className="close-btn"
                onClick={() => setEditModalOpen(false)}
              >
                <RiCloseLine size={24} />
              </button>
            </div>
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
              <div className="form-actions row">
                <button type="button" className="cancel-btn" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
