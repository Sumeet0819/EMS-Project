import React from "react";
import { Badge } from "../ui/badge";

/**
 * Shared StatusBadge — used by both Admin (TaskPage) and Employee (EmployeeDashboard)
 * Replaces: inline <span className={`status ${task.status}`}> across all pages
 */
const statusConfig = {
  "pending":     { variant: "warning",  label: "Pending" },
  "in-progress": { variant: "info",     label: "In Progress" },
  "completed":   { variant: "success",  label: "Completed" },
};

const StatusBadge = ({ status, className }) => {
  const config = statusConfig[status] || { variant: "outline", label: status || "Unknown" };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
