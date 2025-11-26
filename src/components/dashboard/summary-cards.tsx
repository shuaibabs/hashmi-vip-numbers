
"use client";

import { useApp } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, CheckCircle, Clock, UploadCloud, DollarSign, LogOut } from "lucide-react";

export function SummaryCards() {
  const { numbers, sales, portOuts } = useApp();

  const totalNumbers = numbers.length;
  const rtsNumbers = numbers.filter(n => n.status === 'RTS').length;
  const nonRtsNumbers = totalNumbers - rtsNumbers;
  const pendingUploads = numbers.filter(n => n.uploadStatus === 'Pending').length;
  const totalSales = sales.length;
  const totalPortOuts = portOuts.length;


  const summaryData = [
    { title: "Total Numbers", value: totalNumbers, icon: Smartphone, color: "text-blue-500" },
    { title: "RTS Numbers", value: rtsNumbers, icon: CheckCircle, color: "text-green-500" },
    { title: "Non-RTS Numbers", value: nonRtsNumbers, icon: Clock, color: "text-red-500" },
    { title: "Pending Uploads", value: pendingUploads, icon: UploadCloud, color: "text-yellow-500" },
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
