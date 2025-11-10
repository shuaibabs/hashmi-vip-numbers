"use client";

import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/page-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { LatestActivities } from "@/components/dashboard/latest-activities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { role } = useApp();

  if (role === 'employee') {
    return (
      <>
        <PageHeader 
          title="Welcome, Employee!"
          description="Here's a quick overview of your tasks."
        />
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold">Employee view is limited.</h2>
          <p className="text-muted-foreground mt-2">Please use the sidebar to navigate to your assigned sections.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader 
        title="Admin Dashboard"
        description="Overview of the Number Management System."
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
              <CardTitle>Latest Employee Activities</CardTitle>
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
