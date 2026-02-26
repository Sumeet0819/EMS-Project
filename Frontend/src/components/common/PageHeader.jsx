import React from "react";
import { cn } from "../../lib/utils";

/**
 * Shared PageHeader — used by both Admin and Employee pages
 * Replaces: repeated title + subtitle + action button pattern across Dashboard, TaskPage,
 * TeamManagement, and EmployeeDashboard
 */
const PageHeader = ({ title, subtitle, actions, className }) => {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
