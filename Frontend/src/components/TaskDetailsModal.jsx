import React, { useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import StatusBadge from "./common/StatusBadge";
import PriorityBadge from "./common/PriorityBadge";
import {
  RiTimeLine, RiCalendarLine, RiUserLine, RiTaskLine,
} from "@remixicon/react";

/**
 * TaskDetailsModal — shared by Admin (TaskPage) and Employee (EmployeeDashboard)
 * Refactored from custom CSS overlay to shadcn Dialog
 */
const TaskDetailsModal = ({ task, onClose }) => {
  if (!task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const assigneeName = task.assignedTo?.fullName
    ? `${task.assignedTo.fullName.firstName} ${task.assignedTo.fullName.lastName}`
    : task.assignedTo?.email || "Unassigned";

  return (
    <Dialog open={!!task} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              #{task._id.slice(-6)}
            </Badge>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} showIcon />
          </div>
          <DialogTitle className="text-xl leading-tight">{task.title}</DialogTitle>
        </DialogHeader>

        <Separator />

        {/* Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <RiTaskLine size={16} className="text-primary" />
            Description
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-5">
            {task.description || "No description provided."}
          </p>
        </div>

        <Separator />

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <RiUserLine size={14} />
              Assigned To
            </div>
            <p className="font-medium">{assigneeName}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <RiCalendarLine size={14} />
              Created
            </div>
            <p className="font-medium">{formatDate(task.createdAt)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <RiTimeLine size={14} />
              Deadline
            </div>
            <p className="font-medium">{formatDate(task.deadline)}</p>
          </div>

          {task.completedTime && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <RiTimeLine size={14} />
                Completed
              </div>
              <p className="font-medium">{formatDate(task.completedTime)}</p>
            </div>
          )}
        </div>

        {task.remark && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remark</p>
              <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">{task.remark}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;
