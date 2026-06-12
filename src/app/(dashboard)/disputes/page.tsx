"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Search, Download, Upload, Send,
  AlertTriangle, CheckCircle2, Clock, XCircle,
  ChevronLeft, ChevronRight, DollarSign, MessageSquareWarning,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDisputeStats, useDisputes, useRespondDispute } from "@/hooks"
import type { Dispute } from "@/types/api.types"

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }).format(v)
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending:           { label: "Pendente",             icon: Clock,         className: "bg-warning/10 text-warning border-warning/20" },
  evidence_required: { label: "Evidência Necessária", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  won:               { label: "Ganha",                icon: CheckCircle2,  className: "bg-success/10 text-success border-success/20" },
  lost:              { label: "Perdida",              icon: XCircle,       className: "bg-muted text-muted-foreground" },
}

export default function DisputesPage() {
  const [page, setPage]               = useState(1)
  const [status, setStatus]           = useState("all")
  const [search, setSearch]           = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [responseText, setResponseText]       = useState("")
  const [responseOpen, setResponseOpen]       = useState(false)

  const { data: stats, isLoading: loadingStats } = useDisputeStats()
  const { data, isLoading } = useDisputes({ page, pageSize: 20, status, search })
  const { respond, isLoading: sending } = useRespondDispute()

  const handleRespond = async () => {
    if (!selectedDispute || !responseText.trim()) return
    await respond(selectedDispute.id, { disputeId: selectedDispute.id, message: responseText })
    setResponseOpen(false)
    setResponseText("")
  }

  const STAT_CARDS = stats ? [
    { label: "Total de Disputas",  value: stats.total,              icon: MessageSquareWarning, sub: null },
    { label: "Pendentes",          value: stats.pending,            icon: AlertTriangle,        sub: "Requer ação" },
    { label: "Taxa de Sucesso",    value: `${stats.winRate}%`,      icon: CheckCircle2,         sub: `${stats.won} ganhas` },
    { label: "Valor em Disputa",   value: fmt(stats.totalAmount),   icon: DollarSign,           sub: null },
  ] : []

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contestações</h1>
          <p className="text-muted-foreground">Gerencie chargebacks e disputas de pagamento</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="size-4" /> Exportar Relatório
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {loadingStats
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          : STAT_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-bold">{card.value}</p>
                        {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
                      </div>
                      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                        <Icon className="size-6 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
        }
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base font-medium">Lista de Contestações</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1) }}}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="evidence_required">Evidência Necessária</SelectItem>
                  <SelectItem value="won">Ganhas</SelectItem>
                  <SelectItem value="lost">Perdidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : data?.data.map((d) => {
                      const s = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.pending
                      const SIcon = s.icon
                      const isUrgent = d.status === "evidence_required"
                      return (
                        <TableRow key={d.id} className={cn("group", isUrgent && "bg-destructive/5")}>
                          <TableCell>
                            <p className="font-mono text-sm">{d.id}</p>
                            <p className="text-xs text-muted-foreground">{d.transactionId}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{d.customer}</p>
                            <p className="text-xs text-muted-foreground">{d.seller}</p>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-[200px] truncate">{d.reason}</p>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{fmt(d.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("gap-1 font-medium", s.className)}>
                              <SIcon className="size-3" />{s.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              d.deadline && !["won","lost"].includes(d.status) && "text-warning font-medium"
                            )}>
                              {d.deadline ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {["pending","evidence_required"].includes(d.status) && (
                              <Button variant="outline" size="sm" onClick={() => {
                                setSelectedDispute(d)
                                setResponseOpen(true)
                              }}>
                                Responder
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                }
              </TableBody>
            </Table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Página {data.page} de {data.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de resposta */}
      <Dialog open={responseOpen} onOpenChange={setResponseOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Responder Contestação</DialogTitle>
            <DialogDescription>Envie sua resposta e evidências para contestar a disputa.</DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disputa</span>
                  <span className="font-mono">{selectedDispute.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold">{fmt(selectedDispute.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Motivo</span>
                  <span>{selectedDispute.reason}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sua Resposta</Label>
                  <Textarea
                    placeholder="Descreva sua defesa..."
                    className="min-h-[100px] resize-none"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anexar Evidências</Label>
                  <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                    <Upload className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Arraste arquivos ou clique para fazer upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG até 10MB</p>
                    <Button variant="outline" size="sm" className="mt-3">Selecionar Arquivos</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseOpen(false)}>Cancelar</Button>
            <Button className="gap-2" disabled={!responseText.trim() || sending} onClick={handleRespond}>
              {sending
                ? <><div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />Enviando...</>
                : <><Send className="size-4" />Enviar Resposta</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}