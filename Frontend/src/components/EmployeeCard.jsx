import React from "react";
import { RiPencilLine, RiDeleteBinLine } from "@remixicon/react";
import "./styles/EmployeeCard.css";

const EmployeeCard = ({ employee, onEdit, onDelete }) => {
  const { fullName, email, role, _id } = employee;

  return (
    <div className="employee-card">
      <div className="employee-info">
        <div className="employee-name">
          {fullName?.firstName} {fullName?.lastName}
        </div>
        <div className="employee-email">{email}</div>
        <span
          className={`role-badge ${
            role === "admin" ? "admin-role" : "employee-role"
          }`}
        >
          {role}
        </span>
      </div>
      <div className="actions">
        <button className="icon-btn" title="Edit" onClick={() => onEdit(employee)}>
          <RiPencilLine size={14} />
        </button>
        <button
          className="icon-btn delete"
          title="Delete"
          onClick={() => onDelete(_id)}
        >
          <RiDeleteBinLine size={14}/>
        </button>
      </div>
    </div>
  );
};

export default EmployeeCard;
