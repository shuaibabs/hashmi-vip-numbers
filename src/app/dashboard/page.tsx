"use client";

import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/page-header";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { LatestActivities } from "@/components/dashboard/latest-activities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { role, user } = useAuth();
  const { databaseSeeded, seedDatabase, isSeeding } = useApp();

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
        {!databaseSeeded && role === 'admin' && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Welcome, Admin!</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              Your database is empty. Click here to populate it with sample data.
              <Button onClick={seedDatabase} disabled={isSeeding}>
                {isSeeding ? 'Seeding...' : 'Seed Database'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
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
