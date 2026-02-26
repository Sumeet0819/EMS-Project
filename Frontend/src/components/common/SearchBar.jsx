import React from "react";
import { RiSearchLine } from "@remixicon/react";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

/**
 * Shared SearchBar — used by Admin (TaskPage, TeamManagement) and Employee (EmployeeDashboard)
 * Refactored to use shadcn Input
 */
const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  className,
  width,
}) => {
  return (
    <div
      className={cn("relative flex-1", className)}
      style={width ? { minWidth: width, maxWidth: width } : {}}
    >
      <RiSearchLine
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pl-9"
      />
    </div>
  );
};

export default SearchBar;
