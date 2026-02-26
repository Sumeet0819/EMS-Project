import React from "react";
import { Skeleton } from "./ui/skeleton";

/**
 * Loader — used across Dashboard, etc.
 * Refactored to use shadcn Skeleton for content-aware loading states
 * Keeps original spinner mode for backwards compat
 */
const Loader = ({ message = "Loading...", size = "medium", fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
      </div>
    );
  }

  const sizeMap = { small: "h-6 w-6", medium: "h-8 w-8", large: "h-12 w-12" };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div
        className={`rounded-full border-4 border-primary border-t-transparent animate-spin ${sizeMap[size] || sizeMap.medium}`}
      />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
};

/** Convenience skeleton layout for dashboard-like pages */
export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  </div>
);

export default Loader;
