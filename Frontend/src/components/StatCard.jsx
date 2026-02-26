import React from "react";
import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

/**
 * StatCard — used by Admin Dashboard
 * Refactored to use shadcn Card
 */
const StatCard = ({ label, value, icon, className }) => {
  return (
    <Card className={cn("animate-fade-in", className)}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{value}</h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
