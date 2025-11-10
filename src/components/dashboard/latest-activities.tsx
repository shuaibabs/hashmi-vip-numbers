"use client";

import { useApp } from "@/context/app-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from "../ui/avatar";

export function LatestActivities() {
  const { activities } = useApp();

  const sortedActivities = [...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="space-y-4">
      {sortedActivities.slice(0, 5).map(activity => (
        <div key={activity.id} className="flex items-center gap-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{activity.employeeName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">
              <span className="font-semibold">{activity.employeeName}</span> {activity.action.toLowerCase()}
            </p>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  );
}
