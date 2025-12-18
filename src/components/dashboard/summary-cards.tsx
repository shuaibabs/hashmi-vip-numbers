
"use client";

import { useApp } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, CheckCircle, Clock, UploadCloud, DollarSign, LogOut, Bookmark } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useMemo } from "react";

export function SummaryCards() {
  const { user, role } = useAuth();
  const { numbers, sales, portOuts, preBookings } = useApp();

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


  const totalNumbers = numbers.length;
  const rtsNumbers = numbers.filter(n => n.status === 'RTS').length;
  const nonRtsNumbers = totalNumbers - rtsNumbers;
  const pendingUploads = numbers.filter(n => n.uploadStatus === 'Pending').length;
  const totalSales = roleFilteredSales.length;
  const totalPortOuts = roleFilteredPortOuts.length;
  const totalPreBookings = preBookings.length;


  const summaryData = [
    { title: "Total Numbers", value: totalNumbers, icon: Smartphone, color: "text-blue-500" },
    { title: "RTS Numbers", value: rtsNumbers, icon: CheckCircle, color: "text-green-500" },
    { title: "Non-RTS Numbers", value: nonRtsNumbers, icon: Clock, color: "text-red-500" },
    { title: "Pre-Bookings", value: totalPreBookings, icon: Bookmark, color: "text-amber-500" },
    { title: "Sales", value: totalSales, icon: DollarSign, color: "text-indigo-500" },
    { title: "Port Outs", value: totalPortOuts, icon: LogOut, color: "text-purple-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {summaryData.map(item => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 text-muted-foreground ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
