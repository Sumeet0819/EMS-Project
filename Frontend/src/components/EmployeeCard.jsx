import React from "react";
import { RiPencilLine, RiDeleteBinLine, RiMailLine, RiShieldUserLine, RiUserLine } from "@remixicon/react";
import "../styles/EmployeeCard.css";

const EmployeeCard = ({ employee, onEdit, onDelete }) => {
  const { fullName, email, role, _id } = employee;
  
  // Get initials for avatar
  const getInitials = () => {
    const first = fullName?.firstName?.[0] || "";
    const last = fullName?.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="employee-card">
      <div className="employee-card-header">
        <div className="employee-avatar">
          <span className="avatar-initials">{getInitials()}</span>
        </div>
        <div className="employee-actions">
          <button 
            className="action-btn edit-btn" 
            title="Edit Employee" 
            onClick={() => onEdit(employee)}
          >
            <RiPencilLine size={16} />
          </button>
          <button
            className="action-btn delete-btn"
            title="Delete Employee"
            onClick={() => onDelete(_id)}
          >
            <RiDeleteBinLine size={16} />
          </button>
        </div>
      </div>
      
      <div className="employee-card-body">
        <div className="employee-name">
          {fullName?.firstName} {fullName?.lastName}
        </div>
        <div className="employee-email">
          <RiMailLine size={14} />
          <span>{email}</span>
        </div>
      </div>
      
      <div className="employee-card-footer">
        <span
          className={`role-badge ${
            role === "admin" ? "admin-role" : "employee-role"
          }`}
        >
          {role === "admin" ? <RiShieldUserLine size={12} /> : <RiUserLine size={12} />}
          <span>{role}</span>
        </span>
      </div>
    </div>
  );
};

export default EmployeeCard;
