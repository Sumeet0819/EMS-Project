import React, { useState } from "react";
import Header from "../components/Header";
import Dashboard from "./Dashboard";
import TeamManagement from "./TeamManagement";
import "../components/admin.css";
import TaskPage from "./TaskPage";
import Sidebar from "../components/Sidebar";

const AdminPage = () => {
  const [activePage, setActivePage] = useState("dashboard");

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
      <Sidebar onChangePage={setActivePage} active={activePage} />

      <div className="admin-right">
        <Header />

        <div className="admin-content">{renderPage()}</div>
      </div>
    </div>
  );
};

export default AdminPage;
