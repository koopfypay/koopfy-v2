"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  RefreshCcw, Search, Download, Calendar, Building2,
  CheckCircle2, Clock, XCircle, Filter, CalendarClock,
  Banknote, TrendingUp, AlertCircle, ChevronRight,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTransferTotals, useTransfers } from "@/hooks"
import { transfersApi } from "@/lib/api"
import type { Transfer } from "@/types/api.types"
import { useRouter } from "next/navigation"

// ─── Formatadores ─────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2,
  }).format(v).replace("US$", "US$ ")
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed: {
    label: "Concluído",    icon: CheckCircle2,   className: "bg-success/10 text-success border-success/20",         color: "text-success",
  },
  pending: {
    label: "Pendente",     icon: Clock,          className: "bg-warning/10 text-warning border-warning/20",         color: "text-warning",
  },
  scheduled: {
    label: "Agendado",     icon: CalendarClock,  className: "bg-primary/10 text-primary border-primary/20",         color: "text-primary",
  },
  failed: {
    label: "Falhou",       icon: XCircle,        className: "bg-destructive/10 text-destructive border-destructive/20", color: "text-destructive",
  },
} as const

const TX_STATUS_CONFIG = {
  included:   { label: "Incluído",     className: "bg-success/10 text-success border-success/20" },
  pending:    { label: "Pendente",     className: "bg-warning/10 text-warning border-warning/20" },
  processing: { label: "Processando",  className: "bg-primary/10 text-primary border-primary/20" },
  held:       { label: "Retido",       className: "bg-destructive/10 text-destructive border-destructive/20" },
}

// ─── Summary Card Skeleton ────────────────────────────────────────────────────

function SummarySkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="size-12 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function TransfersPage() {
  const [search,          setSearch]         = useState("")
  const [statusFilter,    setStatusFilter]   = useState("all")
  const [page,            setPage]           = useState(1)
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [sheetOpen,       setSheetOpen]      = useState(false)
  const [retrying,        setRetrying]       = useState<string | null>(null)

  const router = useRouter();

  const { data: totals,    isLoading: loadingTotals }    = useTransferTotals()
  const { data: transfers, isLoading: loadingTransfers, mutate } = useTransfers({
    page, pageSize: 20,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  })

  const handleRetry = async (transferId: string) => {
    setRetrying(transferId)
    try {
      await transfersApi.retry(transferId)
      mutate()
    } finally {
      setRetrying(null) }
  }

  const openSheet = (t: Transfer) => { setSelectedTransfer(t); setSheetOpen(true) }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repasses</h1>
          <p className="text-muted-foreground">Acompanhe os repasses e a liberação de valores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.push('/wallet')}>
            <ArrowUpRight className="size-4" />
            Solicitar Saque
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => mutate()}>
            <RefreshCcw className="size-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {loadingTotals ? <SummarySkeleton /> : totals && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Pendentes",         value: totals.pending,   count: null,  icon: Clock,        iconCls: "bg-warning/10",  textCls: "text-warning",  sub: "Aguardando liberação" },
            { label: "Agendados",         value: totals.scheduled, count: null,  icon: CalendarClock, iconCls: "bg-primary/10",  textCls: "text-primary",  sub: "Datas programadas" },
            { label: "Total em Trânsito", value: totals.inTransit, count: null,  icon: Banknote,      iconCls: "bg-muted",       textCls: "text-foreground", sub: "Aguardando liberação" },
            { label: "Concluídos (30d)",  value: totals.completed, count: null,  icon: TrendingUp,    iconCls: "bg-success/10",  textCls: "text-success",  sub: "Últimos 30 dias" },
          ].map(card => {
            const Icon = card.icon
            return (
              <Card key={card.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                      <p className={cn("text-2xl font-bold mt-0.5", card.textCls)}>{fmt(card.value)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                    </div>
                    <div className={cn("flex size-12 items-center justify-center rounded-xl", card.iconCls)}>
                      <Icon className={cn("size-6", card.textCls === "text-foreground" ? "text-muted-foreground" : card.textCls)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base font-medium">Repasses</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar vendedor, ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 md:w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <Filter className="mr-2 size-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="scheduled">Agendados</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Download className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead>ID</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Liberação</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTransfers ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (transfers?.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      Nenhum repasse encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  (transfers?.data ?? []).map(transfer => {
                    const s = STATUS_CONFIG[transfer.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
                    const StatusIcon = s.icon
                    return (
                      <TableRow
                        key={transfer.id}
                        className="group cursor-pointer"
                        onClick={() => openSheet(transfer)}
                      >
                        <TableCell className="font-mono text-sm">{transfer.id.slice(0, 8)}…</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0">
                              <Building2 className="size-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{transfer.seller}</p>
                              <p className="text-xs text-muted-foreground font-mono">{transfer.sellerId?.slice(0, 8)}…</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmt(transfer.amount)}</TableCell>
                        <TableCell className={cn("text-right font-semibold", s.color)}>{fmt(transfer.netAmount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1 font-medium", s.className)}>
                            <StatusIcon className="size-3" />{s.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CalendarClock className="size-4 text-muted-foreground" />
                            <span className="text-sm">{transfer.releaseDate}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100"
                            onClick={e => { e.stopPropagation(); openSheet(transfer) }}
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {transfers && transfers.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {transfers.page} de {transfers.totalPages} · {transfers.total} repasses
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page === transfers.totalPages} onClick={() => setPage(p => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4 px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Building2 className="size-5 text-muted-foreground" />
              </div>
              <div>
                <SheetTitle>{selectedTransfer?.seller ?? "—"}</SheetTitle>
                <SheetDescription className="font-mono text-xs">{selectedTransfer?.id}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {selectedTransfer && (() => {
            const s = STATUS_CONFIG[selectedTransfer.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
            const StatusIcon = s.icon

            return (
              <div className="space-y-6 px-6">
                {/* Status Banner */}
                <div className={cn("flex items-center gap-3 p-4 rounded-lg border", s.className)}>
                  <StatusIcon className={cn("size-5 shrink-0", s.color)} />
                  <div>
                    <p className={cn("font-semibold", s.color)}>{s.label}</p>
                    {selectedTransfer.status === "failed" && selectedTransfer.failReason && (
                      <p className="text-sm text-muted-foreground">{selectedTransfer.failReason}</p>
                    )}
                    {(selectedTransfer.status === "pending" || selectedTransfer.status === "scheduled") && (
                      <p className="text-sm text-muted-foreground">Liberação prevista: {selectedTransfer.releaseDate}</p>
                    )}
                  </div>
                </div>

                {/* Values */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Resumo</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Bruto",  value: fmt(selectedTransfer.amount),    color: "" },
                      { label: "Taxa",   value: `-${fmt(selectedTransfer.fee)}`, color: "text-destructive" },
                      { label: "Líquido",value: fmt(selectedTransfer.netAmount), color: "text-success" },
                    ].map(v => (
                      <Card key={v.label}>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-muted-foreground">{v.label}</p>
                          <p className={cn("text-base font-bold mt-1", v.color)}>{v.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-success/10 shrink-0">
                        <CheckCircle2 className="size-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Repasse Criado</p>
                        <p className="text-xs text-muted-foreground">{selectedTransfer.createdAt}</p>
                      </div>
                    </div>
                    <div className="ml-4 h-5 w-px bg-border" />
                    <div className="flex items-center gap-3">
                      <div className={cn("flex size-8 items-center justify-center rounded-full shrink-0",
                        selectedTransfer.status === "completed" ? "bg-success/10"
                        : selectedTransfer.status === "failed"    ? "bg-destructive/10"
                        : "bg-muted"
                      )}>
                        {selectedTransfer.status === "completed"
                          ? <CheckCircle2 className="size-4 text-success"/>
                          : selectedTransfer.status === "failed"
                          ? <XCircle className="size-4 text-destructive"/>
                          : <Clock className="size-4 text-muted-foreground"/>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {selectedTransfer.status === "completed" ? "Pago"
                           : selectedTransfer.status === "failed" ? "Falhou"
                           : "Liberação Prevista"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedTransfer.paidAt ?? selectedTransfer.releaseDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Transactions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Transações Incluídas ({selectedTransfer.transactions?.length ?? 0})
                  </h3>
                  {(selectedTransfer.transactions ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação vinculada</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTransfer.transactions.map(tx => {
                        const txS = TX_STATUS_CONFIG[tx.status as keyof typeof TX_STATUS_CONFIG] ?? TX_STATUS_CONFIG.pending
                        return (
                          <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                                <Banknote className="size-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-mono">{tx.id}</p>
                                <p className="text-xs text-muted-foreground">{tx.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{fmt(tx.amount)}</p>
                              <Badge variant="outline" className={cn("text-xs", txS.className)}>{txS.label}</Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedTransfer.status === "failed" && (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button variant="outline" className="flex-1 gap-2">
                      <AlertCircle className="size-4" />Ver Erro
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      disabled={retrying === selectedTransfer.id}
                      onClick={() => handleRetry(selectedTransfer.id)}
                    >
                      {retrying === selectedTransfer.id
                        ? <><div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"/>Tentando...</>
                        : <><RefreshCcw className="size-4"/>Tentar Novamente</>
                      }
                    </Button>
                  </div>
                )}
              </div>
            )
          })()}
        </SheetContent>
      </Sheet>

    </div>
  )
}