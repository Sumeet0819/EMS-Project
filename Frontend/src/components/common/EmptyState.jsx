import React from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

/**
 * Shared EmptyState — used by Admin (TaskPage, TeamManagement) and Employee (EmployeeDashboard)
 * Replaces: 4+ duplicate empty-state blocks with inconsistent markup
 */
const EmptyState = ({ icon, title, description, action, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      )}
      {description && (
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && action}
    </div>
  );
};

export default EmptyState;
