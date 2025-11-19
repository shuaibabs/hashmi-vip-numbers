
"use client"

import * as React from "react"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { useApp } from "@/context/app-context";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useTheme } from "next-themes";


export function StatusChart() {
  const { numbers, reminders, sales, portOuts } = useApp();
  const { theme } = useTheme();
  
  const rtsCount = numbers.filter(n => n.status === "RTS").length;
  const nonRtsCount = numbers.length - rtsCount;
  const pendingUploads = reminders.filter(r => r.status === 'Upload Pending').length;
  const salesCount = sales.length;
  const portOutsCount = portOuts.length;

  const chartData = [
    { name: "RTS", value: rtsCount, fill: "hsl(var(--chart-2))" },
    { name: "Non-RTS", value: nonRtsCount, fill: "hsl(var(--chart-5))" },
    { name: "Pending Uploads", value: pendingUploads, fill: "hsl(var(--chart-4))" },
    { name: "Sales", value: salesCount, fill: "hsl(var(--chart-1))" },
    { name: "Port Outs", value: portOutsCount, fill: "hsl(var(--chart-3))" },
  ].filter(item => item.value > 0);

   const chartConfig = {
    rts: {
      label: "RTS",
      color: "hsl(var(--chart-2))",
    },
    "non-rts": {
      label: "Non-RTS",
      color: "hsl(var(--chart-5))",
    },
    "pending-uploads": {
        label: "Pending Uploads",
        color: "hsl(var(--chart-4))"
    },
    sales: {
        label: "Sales",
        color: "hsl(var(--chart-1))"
    },
    "port-outs": {
        label: "Port Outs",
        color: "hsl(var(--chart-3))"
    }
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full max-h-[250px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
           <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={5}
            labelLine={false}
          >
             {chartData.map((entry) => (
                <Cell
                    key={`cell-${entry.name}`}
                    fill={entry.fill}
                    stroke={theme === 'dark' ? 'hsl(var(--background))' : 'hsl(var(--card))'}
                />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
