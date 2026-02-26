import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  RiDashboardLine, RiGroupLine, RiTaskLine,
  RiLogoutBoxLine, RiCalendarCheckLine, RiFileList3Line
} from "@remixicon/react";
import { asyncLogoutuser } from "../../store/actions/userActions";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import UserAvatar from "../common/UserAvatar";
import { cn } from "../../lib/utils";

/**
 * Role-aware AppSidebar
 * role="admin"    → Dashboard, Team Management, Task Management nav
 * role="employee" → Daily Tasks, Regular Tasks nav
 *
 * Replaces: Sidebar.jsx (admin) + inline <aside> in EmployeeDashboard.jsx
 */

const ADMIN_NAV = [
  { key: "dashboard", label: "Dashboard",       icon: RiDashboardLine },
  { key: "team",      label: "Team Management", icon: RiGroupLine },
  { key: "task",      label: "Task Management", icon: RiTaskLine },
];

const EMPLOYEE_NAV = [
  { key: "daily",   label: "Daily Tasks",   icon: RiCalendarCheckLine },
  { key: "regular", label: "Regular Tasks", icon: RiFileList3Line },
];

const AppSidebar = ({
  role = "admin",
  activePage,
  onNavigate,
  userName = "",
  onCollapse,
  isOpen = true,
  className,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = role === "admin" ? ADMIN_NAV : EMPLOYEE_NAV;

  const handleLogout = () => {
    dispatch(asyncLogoutuser());
    navigate("/");
  };

  const [firstName, lastName] = userName.split(" ");

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-card border-r border-border",
        className
      )}
    >
      {/* Brand / Logo */}
      <div className="flex items-center px-6 h-14 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
             <span className="font-bold text-lg leading-none">M</span>
          </div>
          <span className="text-xl font-bold tracking-tight">MANJ</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
              activePage === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <RiLogoutBoxLine size={18} />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
