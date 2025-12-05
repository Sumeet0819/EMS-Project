import React from "react";
import { RiMenuLine, RiCloseLine } from "@remixicon/react";
import "./Header.css";

const Header = ({ sidebarOpen, onToggleSidebar }) => {
  return (
    <header className="header">
      <button 
        className="header-menu-toggle"
        onClick={onToggleSidebar}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
      </button>
      <span>Welcome, Admin</span>
    </header>
  );
};

export default Header;