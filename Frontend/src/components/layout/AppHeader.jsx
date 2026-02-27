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
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <RiCloseLine size={18} /> : <RiMenuLine size={18} />}
        </Button>
        <span className="text-xs md:text-sm font-semibold text-muted-foreground hidden md:block truncate max-w-[150px]">
          {greeting}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <RiSunLine size={16} /> : <RiMoonLine size={16} />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Notifications">
          <RiBellLine size={16} />
        </Button>
        <div className="ml-1">
          <UserAvatar firstName={firstName} lastName={lastName} size="sm" />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
