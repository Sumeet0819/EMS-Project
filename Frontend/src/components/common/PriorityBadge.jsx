import React from "react";
import { Badge } from "../ui/badge";
import { RiFlagLine } from "@remixicon/react";

/**
 * Shared PriorityBadge — used by both Admin (TaskPage) and Employee (EmployeeDashboard)
 * Replaces: inline <span className={`priority ${task.priority}`}> across all pages
 */
const priorityConfig = {
  "high":   { variant: "destructive", label: "High" },
  "medium": { variant: "warning",     label: "Medium" },
  "low":    { variant: "secondary",   label: "Low" },
};

const PriorityBadge = ({ priority, showIcon = false, className }) => {
  const config = priorityConfig[priority] || { variant: "outline", label: priority || "Medium" };
  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && <RiFlagLine size={11} />}
      {config.label}
    </Badge>
  );
};

export default PriorityBadge;
