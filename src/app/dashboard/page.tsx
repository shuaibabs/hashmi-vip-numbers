
"use client";

import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/page-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { LatestActivities } from "@/components/dashboard/latest-activities";
import { useMemo } from "react";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { numbers, reminders, sales, portOuts } = useApp();

  const roleFilteredSales = useMemo(() => {
    if (role === 'admin') {
      return sales;
    }
    return sales.filter(sale => sale.originalNumberData?.assignedTo === user?.displayName);
  }, [sales, role, user?.displayName]);

  const roleFilteredPortOuts = useMemo(() => {
    if (role === 'admin') {
      return portOuts;
    }
    return portOuts.filter(portOut => portOut.originalNumberData?.assignedTo === user?.displayName);
  }, [portOuts, role, user?.displayName]);


  const rtsCount = numbers.filter(n => n.status === "RTS").length;
  const nonRtsCount = numbers.length - rtsCount;
  const pendingUploads = numbers.filter(n => n.uploadStatus === 'Pending').length;
  const salesCount = roleFilteredSales.length;
  const portOutsCount = roleFilteredPortOuts.length;


  const title = role === 'admin' ? "Admin Dashboard" : "My Dashboard";
  const description = role === 'admin' 
    ? "Overview of the Number Management System."
    : "Here's a quick overview of your assigned numbers and tasks.";

  return (
    <>
      <PageHeader 
        title={title}
        description={description}
      />
      <div className="space-y-6">
        <SummaryCards />
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <CardDescription>
                A summary of all number statuses and pending work.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="min-h-[250px] w-full">
                <StatusChart />
              </div>
               <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-2))]"></span>
                    <span className="font-medium">RTS</span>
                    <span className="ml-auto text-muted-foreground">{rtsCount}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-5))]"></span>
                    <span className="font-medium">Non-RTS</span>
                    <span className="ml-auto text-muted-foreground">{nonRtsCount}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-4))]"></span>
                    <span className="font-medium">Pending Uploads</span>
                    <span className="ml-auto text-muted-foreground">{pendingUploads}</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-1))]"></span>
                    <span className="font-medium">Sales</span>
                    <span className="ml-auto text-muted-foreground">{salesCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--chart-3))]"></span>
                    <span className="font-medium">Port Outs</span>
                    <span className="ml-auto text-muted-foreground">{portOutsCount}</span>
                </div>
            </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Latest Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <LatestActivities />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
