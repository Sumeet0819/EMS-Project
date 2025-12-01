import React from "react";
import "../components/styles/sidebar.css";
import { RiDashboard2Fill, RiDashboardLine, RiGroupLine, RiTeamLine } from "@remixicon/react";

const Sidebar = ({ onChangePage, active }) => {
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
          <RiGroupLine size={16}/>Task Management
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
