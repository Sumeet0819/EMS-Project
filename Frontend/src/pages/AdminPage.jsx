import React, { useState, useEffect } from "react";
import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import Dashboard from "./Dashboard";
import TeamManagement from "./TeamManagement";
import TaskPage from "./TaskPage";

const AdminPage = () => {
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    localStorage.setItem("adminActivePage", activePage);
  }, [activePage]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard />;
      case "team":      return <TeamManagement />;
      case "task":      return <TaskPage />;
      default:          return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out lg:relative ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:-ml-64"
        }`}
      >
        <AppSidebar
          role="admin"
          activePage={activePage}
          onNavigate={(page) => {
            setActivePage(page);
            if (isMobile) setSidebarOpen(false);
          }}
          onCollapse={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-foreground">
        <AppHeader 
          role="admin"
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
