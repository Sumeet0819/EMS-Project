import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

/**
 * ActivityList — used by Admin Dashboard
 * Refactored from vanilla CSS to shadcn Card + Separator
 */
const ActivityList = ({ data }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {data && data.length > 0 ? (
          <ul className="divide-y divide-border">
            {data.map((i, idx) => (
              <li key={idx} className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{i.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{i.activity}</p>
                </div>
                <span className="ml-4 flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">{i.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityList;
