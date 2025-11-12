
"use client";

import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { SidebarTrigger } from "../ui/sidebar";
import { ThemeToggle } from "../theme-toggle";
import { useApp } from "@/context/app-context";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { useState, useEffect } from "react";

function ActivityTime({ timestamp }: { timestamp: Date }) {
    const [timeAgo, setTimeAgo] = useState('');
  
    useEffect(() => {
      // This will only run on the client, after hydration
      setTimeAgo(formatDistanceToNow(timestamp, { addSuffix: true }));
    }, [timestamp]);
  
    // Render a placeholder or nothing on the server
    if (!timeAgo) {
      return null;
    }
  
    return <>{timeAgo}</>;
}


export function AppHeader() {
    const { activities } = useApp();
    
    const sortedActivities = [...activities].sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());

    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="flex-1">
                {/* Optional: Add page title or breadcrumbs here */}
            </div>
            <div className="flex items-center gap-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {sortedActivities.length > 0 && (
                                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-[10px]">
                                    {sortedActivities.length}
                                </Badge>
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                       <div className="p-4">
                         <h4 className="font-medium text-sm">Notifications</h4>
                       </div>
                       <Separator />
                       <ScrollArea className="h-96">
                        <div className="p-4 space-y-4">
                        {sortedActivities.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-8">No new notifications.</p>
                        )}
                        {sortedActivities.map(activity => (
                            <div key={activity.id} className="flex items-start gap-4">
                                <Avatar className="h-8 w-8 border">
                                    <AvatarFallback>{activity.employeeName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1 flex-1">
                                    <p className="text-sm font-medium leading-none">
                                    <span className="font-semibold">{activity.employeeName}</span> {activity.action.toLowerCase()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                                     <p className="text-xs text-muted-foreground">
                                        <ActivityTime timestamp={activity.timestamp.toDate()} />
                                    </p>
                                </div>
                            </div>
                        ))}
                        </div>
                       </ScrollArea>
                       <Separator />
                       <div className="p-2">
                           <Button variant="link" size="sm" className="w-full" asChild>
                               <Link href="/activities">View all activities</Link>
                           </Button>
                       </div>
                    </PopoverContent>
                </Popover>
                <ThemeToggle />
            </div>
        </header>
    );
}
