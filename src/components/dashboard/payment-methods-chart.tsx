"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { paymentMethodsData, formatCurrency } from "@/lib/mock-data"

export function PaymentMethodsChart() {
  const maxVolume = Math.max(...paymentMethodsData.map((m) => m.volume))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Performance por Método de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {paymentMethodsData.slice(0, 6).map((method) => (
            <div key={method.method} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{method.method}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{method.approvalRate}%</span>
                  <span className="w-20 text-right">{formatCurrency(method.volume)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={(method.volume / maxVolume) * 100}
                  className="h-2 flex-1"
                />
                <span className="w-12 text-xs text-destructive">
                  {method.failureRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            <span>Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-destructive" />
            <span>Taxa de Falha</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
