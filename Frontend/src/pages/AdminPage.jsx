import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Dashboard from "./Dashboard";
import TeamManagement from "./TeamManagement";
import "../styles/admin.css";
import TaskPage from "./TaskPage";
import Sidebar from "../components/Sidebar";

const AdminPage = () => {
  // Load activePage from localStorage or default to "dashboard"
  const getInitialPage = () => {
    try {
      const savedPage = localStorage.getItem("adminActivePage");
      if (savedPage && ["dashboard", "team", "task"].includes(savedPage)) {
        return savedPage;
      }
    } catch (error) {
      console.error("Error loading active page from localStorage:", error);
    }
    return "dashboard";
  };

  const [activePage, setActivePage] = useState(getInitialPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Save activePage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("adminActivePage", activePage);
  }, [activePage]);

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
