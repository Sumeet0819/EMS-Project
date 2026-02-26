import React from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { RiPencilLine, RiDeleteBinLine, RiMailLine, RiShieldUserLine, RiUserLine } from "@remixicon/react";
import UserAvatar from "./common/UserAvatar";

/**
 * EmployeeCard — used in TeamManagement (grid view)
 * Refactored from custom CSS to shadcn Card + shared UserAvatar
 */
const EmployeeCard = ({ employee, onEdit, onDelete }) => {
  const { fullName, email, role, _id } = employee;
  const firstName = fullName?.firstName || "";
  const lastName  = fullName?.lastName  || "";

  return (
    <Card className="group flex flex-col gap-4 p-5 animate-fade-in">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <UserAvatar firstName={firstName} lastName={lastName} size="lg" />
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit Employee" onClick={() => onEdit(employee)}>
            <RiPencilLine size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
            title="Delete Employee"
            onClick={() => onDelete(_id)}
          >
            <RiDeleteBinLine size={15} />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div>
        <p className="font-semibold text-sm">{firstName} {lastName}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
          <RiMailLine size={13} />
          {email}
        </p>
      </div>

      {/* Footer */}
      <Badge
        variant={role === "admin" ? "default" : "secondary"}
        className="w-fit"
      >
        {role === "admin" ? <RiShieldUserLine size={11} /> : <RiUserLine size={11} />}
        {role}
      </Badge>
    </Card>
  );
};

export default EmployeeCard;
