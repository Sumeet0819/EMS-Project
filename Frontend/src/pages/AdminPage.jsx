import React, { useState } from "react";
import Header from "../components/Header";
import Dashboard from "./Dashboard";
import TeamManagement from "./TeamManagement";
import "../components/admin.css";
import TaskPage from "./TaskPage";
import Sidebar from "../components/Sidebar";

const AdminPage = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "team":
        return <TeamManagement />;
      case "task":
        return <TaskPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-layout">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div 
          className="admin-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className={`sidebar-wrapper ${sidebarOpen ? "sidebar-open" : ""}`}>
        <Sidebar 
          onChangePage={(page) => {
            setActivePage(page);
            setSidebarOpen(false);
          }} 
          active={activePage} 
        />
      </div>

      <div className="admin-right">
        <Header 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="admin-content">{renderPage()}</div>
      </div>
    </div>
  );
};

export default AdminPage;
