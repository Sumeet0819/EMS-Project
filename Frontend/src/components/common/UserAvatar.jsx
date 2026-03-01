import React from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils";

/**
 * Shared UserAvatar — used in EmployeeCard, AppHeader, AppSidebar
 * Renders initials inside an Avatar circle
 */
const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const UserAvatar = ({ firstName = "", lastName = "", className, size = "md" }) => {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  return (
    <Avatar className={cn(sizeMap[size], className)}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
