"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string
  change: number
  sparklineData: number[]
  icon: React.ReactNode
  format?: "currency" | "percentage" | "number"
}

export function KPICard({
  title,
  value,
  change,
  sparklineData,
  icon,
}: KPICardProps) {
  const isPositive = change >= 0
  const chartData = sparklineData.map((v, i) => ({ value: v, index: i }))

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm font-medium">{title}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
            </div>
            <div className="mt-1 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="size-3 text-success" />
              ) : (
                <TrendingDown className="size-3 text-destructive" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-success" : "text-destructive"
                )}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        <div className="mt-4 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                strokeWidth={1.5}
                fill={`url(#gradient-${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
