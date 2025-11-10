"use client";

import { Bell, UserCircle } from "lucide-react";
import { Button } from "../ui/button";
import { SidebarTrigger } from "../ui/sidebar";
import { ThemeToggle } from "../theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useApp } from "@/context/app-context";
import { Badge } from "../ui/badge";

export function AppHeader() {
    const { role, setRole } = useApp();
    
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="flex-1">
                {/* Optional: Add page title or breadcrumbs here */}
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-muted-foreground" />
                    <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'employee')}>
                        <SelectTrigger className="w-[120px] border-0 focus:ring-0 shadow-none">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-[10px]">3</Badge>
                    <span className="sr-only">Notifications</span>
                </Button>
                <ThemeToggle />
            </div>
        </header>
    );
}
