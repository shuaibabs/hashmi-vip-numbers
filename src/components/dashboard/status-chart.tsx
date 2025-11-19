
"use client"

import * as React from "react"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { useApp } from "@/context/app-context";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useTheme } from "next-themes";


export function StatusChart() {
  const { numbers, reminders } = useApp();
  const { theme } = useTheme();
  
  const rtsCount = numbers.filter(n => n.status === "RTS").length;
  const nonRtsCount = numbers.length - rtsCount;
  const pendingUploads = reminders.filter(r => r.status === 'Upload Pending').length;

  const chartData = [
    { name: "RTS", value: rtsCount, fill: "hsl(var(--chart-2))" },
    { name: "Non-RTS", value: nonRtsCount, fill: "hsl(var(--chart-5))" },
    { name: "Pending Uploads", value: pendingUploads, fill: "hsl(var(--chart-4))" },
  ];

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
    }
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-full max-h-[250px]"
    >
      <ResponsiveContainer width="100%" height={250}>
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
