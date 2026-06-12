"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { recentTransactions, formatCurrency, formatDate, getCountryFlag } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const statusConfig = {
  success: {
    label: "Sucesso",
    className: "bg-success/10 text-success border-success/20",
  },
  pending: {
    label: "Pendente",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  failed: {
    label: "Falhou",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

export function TransactionsTable() {
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Transações Recentes</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link href="/transactions">
            Ver todas
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.map((transaction) => {
              const status = statusConfig[transaction.status as keyof typeof statusConfig]
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                  <TableCell className="font-medium">{transaction.customer}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span>{getCountryFlag(transaction.country)}</span>
                      <span className="text-muted-foreground">{transaction.country}</span>
                    </span>
                  </TableCell>
                  <TableCell>{transaction.paymentMethod}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("font-medium", status.className)}
                    >
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(transaction.date)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
