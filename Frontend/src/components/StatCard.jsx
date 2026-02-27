import React from "react";
import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

/**
 * StatCard — used by Admin Dashboard
 * Refactored to use shadcn Card
 */
const StatCard = ({ label, value, icon, className }) => {
  return (
    <Card className={cn("animate-fade-in hover:shadow-md transition-all duration-300 group hover:-translate-y-1", className)}>
      <CardContent className="flex items-center justify-between p-4 md:p-5 lg:p-6">
        <div>
          <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{label}</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{value}</h2>
        </div>
        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
