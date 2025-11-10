"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useApp } from "@/context/app-context";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export function StatusChart() {
  const { numbers } = useApp();
  const rtsCount = numbers.filter(n => n.status === "RTS").length;
  const nonRtsCount = numbers.length - rtsCount;
  
  const data = [
    {
      name: "Status",
      RTS: rtsCount,
      "Non-RTS": nonRtsCount,
    },
  ];

  const chartConfig = {
    RTS: {
      label: "RTS",
      color: "hsl(var(--chart-2))",
    },
    "Non-RTS": {
      label: "Non-RTS",
      color: "hsl(var(--chart-5))",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={false}
                />
                <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="RTS" stackId="a" fill="var(--color-RTS)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Non-RTS" stackId="a" fill="var(--color-Non-RTS)" radius={[4, 0, 0, 4]} />
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
  )
}
