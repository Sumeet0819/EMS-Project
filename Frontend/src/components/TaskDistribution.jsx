import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

/**
 * TaskDistribution — used by Admin Dashboard
 * Refactored from vanilla CSS to shadcn Card with Tailwind progress bars
 */
const TaskDistribution = ({ completed, progress, pending }) => {
  const total = completed + progress + pending;
  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const progressPct  = total > 0 ? (progress  / total) * 100 : 0;
  const pendingPct   = total > 0 ? (pending   / total) * 100 : 0;

  const bars = [
    { label: "Completed", count: completed, pct: completedPct, color: "bg-success" },
    { label: "In Progress", count: progress, pct: progressPct, color: "bg-primary" },
    { label: "Pending",   count: pending,   pct: pendingPct,   color: "bg-warning" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Task Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bars.map(({ label, count, pct, color }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold">{count} tasks</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ))}

        {total === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskDistribution;
