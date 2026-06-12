"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Wallet, Clock, Lock, ArrowUpRight, ArrowDownLeft,
  TrendingUp, RefreshCw, Plane, CalendarClock,
  CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
  Truck, Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWalletBalance, useWalletEntries, usePayouts } from "@/hooks"
import { WithdrawDialog } from "@/components/withdraw-dialog"

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "USD", minimumFractionDigits: 2,
  }).format(v)
}

const PAYOUT_STATUS: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  paid:    { label: "Pago",     icon: CheckCircle2, className: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pendente", icon: Clock,        className: "bg-warning/10 text-warning border-warning/20" },
  failed:  { label: "Falhou",   icon: AlertCircle,  className: "bg-destructive/10 text-destructive border-destructive/20" },
}

// Sinalizador de envio do pedido — saldo libera quando o pedido é enviado (com rastreio)
function OrderBadge({ shipped }: { shipped?: boolean }) {
  return shipped ? (
    <Badge variant="outline" className="gap-1 font-medium text-xs bg-success/10 text-success border-success/20">
      <Truck className="size-3" />Enviado
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 font-medium text-xs bg-warning/10 text-warning border-warning/20">
      <Package className="size-3" />Aguardando envio
    </Badge>
  )
}

export default function WalletPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [activeTab, setActiveTab]       = useState("overview")
  const [typeFilter, setTypeFilter]     = useState("all")
  const [entryPage, setEntryPage]       = useState(1)
  const [payoutPage, setPayoutPage]     = useState(1)

  const { data: balance, isLoading: loadingBalance, mutate: refreshBalance } = useWalletBalance()
  const { data: entries, isLoading: loadingEntries } = useWalletEntries({ page: entryPage, pageSize: 20, type: typeFilter })
  const { data: payouts, isLoading: loadingPayouts } = usePayouts({ page: payoutPage, pageSize: 20 })

  const BALANCE_CARDS = [
    { label: "Saldo Disponível",  value: balance?.availableBalance || 0, sub: "Pronto para saque",         icon: Wallet,       color: "success", cta: true,  note: null },
    { label: "Saldo Pendente",    value: balance?.pendingBalance || 0,   sub: "Aguardando compensação",    icon: Clock,        color: "warning", cta: false, note: "Libera após o envio do pedido" },
    { label: "Saldo em Reserva",  value: balance?.reservedBalance || 0,  sub: "Retido para chargebacks",   icon: Lock,         color: "primary", cta: false, note: "Liberação em 90 dias" },
    { label: "Total em Trânsito", value: balance?.inTransit || 0,        sub: "Saques em processamento",   icon: Plane,        color: "chart-2", cta: false, note: "Chegando em sua conta" },
  ] 


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carteira</h1>
          <p className="text-muted-foreground">Gerencie seus saldos e movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refreshBalance()}>
            <RefreshCw className="size-4" /> Atualizar
          </Button>
          <Button className="gap-2" onClick={() => setWithdrawOpen(true)}>
            <ArrowUpRight className="size-4" /> Solicitar Saque
          </Button>
        </div>
      </div>

      {/* Saldo Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingBalance
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))
          : BALANCE_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label} className="relative overflow-hidden">
                  <CardContent className="relative px-5 py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-bold tracking-tight">{fmt(card.value)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                      </div>
                      <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                        <Icon className="size-5 text-muted-foreground" />
                      </div>
                    </div>
                    {card.cta && (
                      <Button size="sm" className="w-full gap-2" onClick={() => setWithdrawOpen(true)}>
                        <ArrowUpRight className="size-4" /> Sacar Agora
                      </Button>
                    )}
                    {card.note && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarClock className="size-3.5" />
                        <span>{card.note}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
        }
      </div>

      {/* Informativo — liberação por envio do pedido */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Truck className="size-4 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">Como o saldo é liberado</p>
          <p className="text-muted-foreground mt-0.5">
            O saldo pendente de cada venda é liberado somente após o pedido ser enviado e ter um código de rastreio.
            Movimentações de pedidos ainda não enviados aparecem como <span className="font-medium text-warning">Aguardando envio</span>.
          </p>
        </div>
      </div>

      {/* Total Banner */}
      {balance && (
        <Card className="bg-gradient-to-r from-card to-muted/30">
          <CardContent className="px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patrimônio Total na Plataforma</p>
                <p className="text-3xl font-bold tracking-tight">{fmt(balance.total)}</p>
              </div>
              {balance.nextPayout && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                    <CalendarClock className="size-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Próximo Saque Automático</p>
                    <p className="font-semibold">{fmt(balance.nextPayout.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {balance.nextPayout.date} via {balance.nextPayout.method}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Movimentações</TabsTrigger>
          <TabsTrigger value="payouts">Histórico de Saques</TabsTrigger>
        </TabsList>

        {/* Movimentações */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Histórico de Movimentações</CardTitle>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setEntryPage(1) }}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="credit">Entradas</SelectItem>
                    <SelectItem value="debit">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Tipo</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingEntries
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    : entries?.data.map((entry) => (
                        <TableRow key={entry.id} className="group">
                          <TableCell>
                            <div className={cn("flex size-9 items-center justify-center rounded-lg",
                              entry.type === "credit" ? "bg-success/10" : "bg-destructive/10"
                            )}>
                              {entry.type === "credit"
                                ? <ArrowDownLeft className="size-4 text-success" />
                                : <ArrowUpRight className="size-4 text-destructive" />
                              }
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {entry.id.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="font-medium">{entry.description}</TableCell>
                          <TableCell className={cn("text-right font-semibold",
                            entry.type === "credit" ? "text-success" : "text-destructive"
                          )}>
                            {entry.type === "credit" ? "+" : "-"}{fmt(entry.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              entry.status === "completed"
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-warning/10 text-warning border-warning/20"
                            }>
                              {entry.status === "completed" ? "Concluído" : "Pendente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {entry.type === "credit"
                              ? <OrderBadge shipped={entry.orderShipped} />
                              : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{entry.date}</TableCell>
                        </TableRow>
                      ))
                  }
                </TableBody>
              </Table>

              {entries && entries.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Página {entries.page} de {entries.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={entryPage === 1} onClick={() => setEntryPage((p) => p - 1)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={entryPage === entries.totalPages} onClick={() => setEntryPage((p) => p + 1)}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico de Saques */}
        <TabsContent value="payouts" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Histórico de Saques</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPayouts
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    : payouts?.data.map((p) => {
                        const s = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending
                        const SIcon = s.icon
                        return (
                          <TableRow key={p.id} className="group">
                            <TableCell className="font-mono text-sm">{p.id.slice(0, 8)}…</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {p.method === "bank" ? "Banco" : "Cripto"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{fmt(p.amount)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("gap-1 font-medium", s.className)}>
                                <SIcon className="size-3" />{s.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{p.date}</TableCell>
                          </TableRow>
                        )
                      })
                  }
                </TableBody>
              </Table>

              {payouts && payouts.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Página {payouts.page} de {payouts.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={payoutPage === 1} onClick={() => setPayoutPage((p) => p - 1)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={payoutPage === payouts.totalPages} onClick={() => setPayoutPage((p) => p + 1)}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableBalance={balance?.availableBalance ?? 0}
      />
    </div>
  )
}