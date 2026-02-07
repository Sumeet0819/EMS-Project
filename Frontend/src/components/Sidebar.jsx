import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import "../styles/sidebar.css";
import { RiDashboardLine, RiGroupLine, RiLogoutBoxLine, RiTaskLine } from "@remixicon/react";
import { asyncLogoutuser } from "../store/actions/userActions";

const Sidebar = ({ onChangePage, active }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(asyncLogoutuser());
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <h2 className="brand">Admin Panel</h2>

      <nav>
        <button
          className={active === "dashboard" ? "active" : ""}
          onClick={() => onChangePage("dashboard")}
        >
         <RiDashboardLine size={16}/>  Dashboard
        </button>

        <button
          className={active === "team" ? "active" : ""}
          onClick={() => onChangePage("team")}
        >
          <RiGroupLine size={16}/>Team Management
        </button>
        <button
          className={active === "task" ? "active" : ""}
          onClick={() => onChangePage("task")}
        >
          <RiTaskLine size={16}/>Task Management
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <RiLogoutBoxLine size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
