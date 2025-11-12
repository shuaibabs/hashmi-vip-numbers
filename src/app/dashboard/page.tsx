"use client";

import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/page-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { LatestActivities } from "@/components/dashboard/latest-activities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { role } = useAuth();

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <StatusChart />
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
