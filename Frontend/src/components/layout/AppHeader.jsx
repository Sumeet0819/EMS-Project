import React from "react";
import { RiMenuLine, RiCloseLine, RiBellLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { Button } from "../ui/button";
import UserAvatar from "../common/UserAvatar";
import { cn } from "../../lib/utils";
import { useTheme } from "../ThemeProvider";

/**
 * Role-aware AppHeader
 * Replaces: Header.jsx which had hardcoded "Welcome, Admin"
 * Now accepts userName and role props — shared by both Admin and Employee layouts
 */
const AppHeader = ({
  sidebarOpen,
  onToggleSidebar,
  userName = "",
  role = "admin",
  className,
}) => {
  const [firstName, lastName] = userName.split(" ");
  const greeting = userName ? `Welcome, ${firstName || userName}` : `Welcome, ${role === "admin" ? "Admin" : "Employee"}`;
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={cn(
        "flex items-center justify-between h-14 px-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
        </Button>
        <span className="text-sm font-medium text-muted-foreground hidden sm:block">
          {greeting}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <RiSunLine size={18} /> : <RiMoonLine size={18} />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Notifications">
          <RiBellLine size={18} />
        </Button>
        <UserAvatar firstName={firstName} lastName={lastName} size="sm" />
      </div>
    </header>
  );
};

export default AppHeader;
