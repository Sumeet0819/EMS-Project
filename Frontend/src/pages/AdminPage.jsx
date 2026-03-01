import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import AppHeader from "../components/layout/AppHeader";
import AppSidebar from "../components/layout/AppSidebar";
import Dashboard from "./Dashboard";
import TeamManagement from "./TeamManagement";
import TaskPage from "./TaskPage";
import ChatPage from "../components/common/ChatPage";
import ChatUnreadListener from "../components/common/ChatUnreadListener";

import { useResponsiveSidebar } from "../hooks/useResponsive";

const AdminPage = () => {
  const getInitialPage = () => {
    try {
      const savedPage = localStorage.getItem("adminActivePage");
      if (savedPage && ["dashboard", "team", "task", "chat"].includes(savedPage)) {
        return savedPage;
      }
    } catch (error) {
      console.error("Error loading active page from localStorage:", error);
    }
    return "dashboard";
  };

  const [activePage, setActivePage] = useState(getInitialPage);
  const { sidebarOpen, setSidebarOpen, isMobile } = useResponsiveSidebar();
  const { user } = useSelector((state) => state.userReducer);
  const conversations = useSelector(s => s.messageReducer.conversations);
  const chatChannels  = useSelector(s => s.channelReducer.channels);

  const chatUnread = useMemo(() =>
    conversations.reduce((a, c) => a + (c.unreadCount || 0), 0) +
    chatChannels.reduce((a, c)  => a + (c.unreadCount || 0), 0)
  , [conversations, chatChannels]);

  useEffect(() => {
    localStorage.setItem("adminActivePage", activePage);
  }, [activePage]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard />;
      case "team":      return <TeamManagement />;
      case "task":      return <TaskPage />;
      case "chat":      return <ChatPage />;
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

      {/* Always-on chat unread listener */}
      <ChatUnreadListener />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out lg:relative ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:-ml-64"
        }`}
      >
        <AppSidebar
          role="admin"
          activePage={activePage}
          chatUnread={chatUnread}
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
          userName={user ? `${user.fullName?.firstName || ""} ${user.fullName?.lastName || ""}`.trim() : "Admin"}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className={`flex-1 overflow-y-auto ${activePage === 'chat' ? 'p-4' : 'p-4 md:p-6 lg:p-8'}`}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
