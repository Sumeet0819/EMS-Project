import React from "react";
import { RiLayoutGridLine, RiListCheck } from "@remixicon/react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

/**
 * Shared ViewToggle — used by Admin (TaskPage, TeamManagement)
 * Refactored to use shadcn Button (ghost variant)
 */
const ViewToggle = ({ viewMode, setViewMode, className }) => {
  return (
    <div className={cn("flex items-center rounded-md border border-border p-1 gap-1", className)}>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={() => setViewMode("list")}
        title="List View"
      >
        <RiListCheck size={16} />
      </Button>
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={() => setViewMode("grid")}
        title="Grid View"
      >
        <RiLayoutGridLine size={16} />
      </Button>
    </div>
  );
};

export default ViewToggle;
