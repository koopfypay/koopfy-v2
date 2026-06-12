"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cashFlowData, formatCurrency } from "@/lib/mock-data"

export function CashFlowChart() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Cash Flow</CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Entrada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Saída</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="incomingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outgoingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "incoming" ? "Entrada" : "Saída",
                ]}
              />
              <Area
                type="monotone"
                dataKey="incoming"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#incomingGradient)"
              />
              <Area
                type="monotone"
                dataKey="outgoing"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                fill="url(#outgoingGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
