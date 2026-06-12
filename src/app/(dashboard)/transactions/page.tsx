"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search, Filter, Download, ChevronLeft, ChevronRight,
  CreditCard, User, Calendar, Hash, Banknote,
  Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Smartphone, Shield, Receipt, Copy,
  FileSpreadsheet, FileText, Loader2, Truck, Package,
} from "lucide-react"
import { useTransactions } from "@/hooks"
import { cn } from "@/lib/utils"
import type { PaymentStatus, Transaction } from "@/types/api.types"
import { renderCountryFlag } from "@/utils/country-flag"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  approved:        { label: "Aprovado",     className: "bg-success/10 text-success border-success/20",           icon: CheckCircle2  },
  pending:         { label: "Pendente",     className: "bg-warning/10 text-warning border-warning/20",           icon: Clock         },
  failed:          { label: "Falhou",       className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle      },
  processing:      { label: "Processando",  className: "bg-warning/10 text-warning border-warning/20",           icon: RefreshCw     },
  requires_action: { label: "Pendente",    className: "bg-warning/10 text-warning border-warning/20",           icon: AlertCircle   },
  refunded:        { label: "Reembolsado",  className: "bg-muted text-muted-foreground",                         icon: RefreshCw     },
  chargeback:      { label: "Chargeback",   className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
}

// ─── Ícones de método de pagamento ────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const icons: Record<string, React.ReactNode> = {
    card:       <CreditCard className="size-3" />,
    apple_pay:  <Smartphone className="size-3" />,
    google_pay: <Smartphone className="size-3" />,
    pix:        <Banknote className="size-3" />,
    mbway:      <Smartphone className="size-3" />,
    multibanco: <Banknote className="size-3" />,
  }
  const label: Record<string, string> = {
    card:       "Cartão", credit_card: "Cartão", debit_card: "Débito",
    apple_pay:  "Apple Pay", google_pay: "Google Pay",
    pix:        "PIX", mbway: "MB Way", multibanco: "Multibanco",
    boleto:     "Boleto", sepa: "SEPA", ideal: "iDEAL",
    bancontact: "Bancontact", klarna: "Klarna",
  }
  return (
    <Badge variant="secondary" className="gap-1 font-medium text-xs">
      {icons[method] ?? <CreditCard className="size-3" />}
      {label[method] ?? method}
    </Badge>
  )
}

// ─── Sinalizador de envio do pedido ─────────────────────────────────────────────

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

// ─── Formatadores ─────────────────────────────────────────────────────────────

function fmt(v: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency }).format(v)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ─── Copy helper ──────────────────────────────────────────────────────────────

function CopyText({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="flex items-center gap-1.5 group"
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
    >
      <span className="font-mono text-sm">{display ?? value}</span>
      {copied
        ? <CheckCircle2 className="size-3.5 text-success" />
        : <Copy className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      }
    </button>
  )
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0 w-36">{label}</span>
      <div className="text-sm font-medium text-right">{children}</div>
    </div>
  )
}

// ─── Transaction Detail Sheet ─────────────────────────────────────────────────

function TransactionSheet({ tx, open, onOpenChange }: {
  tx: Transaction | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  if (!tx) return null

  const s     = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending
  const SIcon = s.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg">Detalhes da Transação</SheetTitle>
              <SheetDescription>
                <CopyText value={tx.id} display={tx.id.slice(0, 16) + "…"} />
              </SheetDescription>
            </div>
            <Badge variant="outline" className={cn("gap-1.5 font-semibold", s.className)}>
              <SIcon className="size-3.5" />{s.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-5 p-6">

          {/* Valores */}
          <div >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Receipt className="size-3.5" />Valores
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bruto</p>
                  <p className="text-base font-bold mt-1">{fmt(tx.amountUSD,  'USD')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Taxa</p>
                  <p className="text-base font-bold mt-1 text-destructive">
                    {tx.fee ? `-${fmt(tx.fee, 'USD')}` : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Líquido</p>
                  <p className="text-base font-bold mt-1 text-success">
                    {tx.netAmount ? fmt(tx.netAmount, 'USD') : "—"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pagamento */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <CreditCard className="size-3.5" />Pagamento
            </h3>
            <div className="rounded-xl border border-border overflow-hidden px-4">
              <DetailRow label="Método">
                <MethodBadge method={tx.paymentMethod} />
              </DetailRow>
              {tx.cardBrand && (
                <DetailRow label="Bandeira">
                  <span className="uppercase">{tx.cardBrand}</span>
                </DetailRow>
              )}
              {tx.cardLast4 && (
                <DetailRow label="Cartão">
                  <span className="font-mono">•••• •••• •••• {tx.cardLast4}</span>
                </DetailRow>
              )}
              <DetailRow label="Moeda original">
                <span>{tx.currency?.toUpperCase() ?? "USD"}</span>
              </DetailRow>
              <DetailRow label="Provider">
                <span className="capitalize">{tx.provider ?? "—"}</span>
              </DetailRow>
              {tx.providerTransactionId && (
                <DetailRow label="ID Provider">
                  <CopyText value={tx.providerTransactionId} display={tx.providerTransactionId.slice(0, 18) + "…"} />
                </DetailRow>
              )}
            </div>
          </div>

          {/* Envio do Pedido */}
       {/*   <div className="hidden">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Truck className="size-3.5" />Envio do Pedido
            </h3>
            <div className="rounded-xl border border-border overflow-hidden px-4">
              <DetailRow label="Status do envio">
                <OrderBadge shipped={tx.orderShipped} />
              </DetailRow>
              <DetailRow label="Código de rastreio">
                {tx.trackingCode
                  ? <CopyText value={tx.trackingCode} />
                  : <span className="text-muted-foreground">—</span>}
              </DetailRow>
            </div>
            {!tx.orderShipped && (
              <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-warning" />
                O saldo desta venda será liberado após o envio do pedido com código de rastreio.
              </p>
            )}
          </div>*/}

          {/* Cliente */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <User className="size-3.5" />Cliente
            </h3>
            <div className="rounded-xl border border-border overflow-hidden px-4">
              <DetailRow label="Nome">
                <span>{tx.customer ?? "—"}</span>
              </DetailRow>
              {tx.customerEmail && (
                <DetailRow label="Email">
                  <CopyText value={tx.customerEmail} />
                </DetailRow>
              )}
              <DetailRow label="País">
                <span className="flex items-center gap-1.5 justify-end">
                  {renderCountryFlag(tx.country) ?? "🌍"}
                </span>
              </DetailRow>
            </div>
          </div>

          {/* Datas */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="size-3.5" />Datas
            </h3>
            <div className="rounded-xl border border-border overflow-hidden px-4">
              <DetailRow label="Criada em">
                <span>{fmtDate(tx.createdAt)}</span>
              </DetailRow>
              {tx.approvedAt && (
                <DetailRow label="Aprovada em">
                  <span className="text-success">{fmtDate(tx.approvedAt)}</span>
                </DetailRow>
              )}
              {tx.failedAt && (
                <DetailRow label="Falhou em">
                  <span className="text-destructive">{fmtDate(tx.failedAt)}</span>
                </DetailRow>
              )}
            </div>
          </div>

          {/* Risco */}
          {(tx.riskLevel || tx.riskScore !== undefined) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Shield className="size-3.5" />Risco
              </h3>
              <div className="rounded-xl border border-border overflow-hidden px-4">
                {tx.riskLevel && (
                  <DetailRow label="Nível">
                    <Badge variant="outline" className={cn("font-medium",
                      tx.riskLevel === "WHITE"    ? "bg-success/10 text-success border-success/20"
                      : tx.riskLevel === "GRAY" ? "bg-warning/10 text-warning border-warning/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                    )}>
                      {tx.riskLevel === "WHITE" ? "Baixo" : tx.riskLevel === "GRAY" ? "Médio" : "Alto"}
                    </Badge>
                  </DetailRow>
                )}
                {tx.riskScore !== undefined && (
                  <DetailRow label="Score">
                    <span>{tx.riskScore} / 100</span>
                  </DetailRow>
                )}
                {tx.ip && (
                  <DetailRow label="IP">
                    <CopyText value={tx.ip} />
                  </DetailRow>
                )}
              </div>
            </div>
          )}

          {/* IDs de referência */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Hash className="size-3.5" />Referências
            </h3>
            <div className="rounded-xl border border-border overflow-hidden px-4">
              <DetailRow label="ID Transação">
                <CopyText value={tx.id} display={tx.id.slice(0, 20) + "…"} />
              </DetailRow>
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── EXPORT HELPERS ───────────────────────────────────────────────────────────

const STATUS_LABEL_PT: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  failed: "Falhou",
  processing: "Processando",
  requires_action: "Ação Requerida",
  refunded: "Reembolsado",
  chargeback: "Chargeback",
}

const METHOD_LABEL_PT: Record<string, string> = {
  card: "Cartão", credit_card: "Cartão", debit_card: "Débito",
  apple_pay: "Apple Pay", google_pay: "Google Pay",
  pix: "PIX", mbway: "MB Way", multibanco: "Multibanco",
  boleto: "Boleto", sepa: "SEPA", ideal: "iDEAL",
  bancontact: "Bancontact", klarna: "Klarna",
}

/** Mapeia uma transação para uma linha plana de export */
function toExportRow(tx: Transaction) {
  return {
    "ID Transação": tx.id,
    "Data Criação": tx.createdAt ? new Date(tx.createdAt).toLocaleString("pt-BR") : "",
    "Data Aprovação": tx.approvedAt ? new Date(tx.approvedAt).toLocaleString("pt-BR") : "",
    "Data Falha": tx.failedAt ? new Date(tx.failedAt).toLocaleString("pt-BR") : "",
    "Cliente": tx.customer ?? "",
    "Email": tx.customerEmail ?? "",
    "País": tx.country ?? "",
    "Método de Pagamento": METHOD_LABEL_PT[tx.paymentMethod] ?? tx.paymentMethod ?? "",
    "Bandeira": tx.cardBrand ? tx.cardBrand.toUpperCase() : "",
    "Final do Cartão": tx.cardLast4 ?? "",
    "Valor Bruto (USD)": typeof tx.amountUSD === "number" ? tx.amountUSD : 0,
    "Taxa (USD)": typeof tx.fee === "number" ? tx.fee : 0,
    "Valor Líquido (USD)": typeof tx.netAmount === "number" ? tx.netAmount : 0,
    "Moeda Original": tx.currency ? tx.currency.toUpperCase() : "USD",
    "Status": STATUS_LABEL_PT[tx.status] ?? tx.status,
    "Provider": tx.provider ?? "",
    "ID Provider": tx.providerTransactionId ?? "",
    "Nível de Risco": tx.riskLevel ?? "",
    "Score de Risco": tx.riskScore ?? "",
    "IP": tx.ip ?? "",
  }
}

/** Escapa um valor para CSV (lida com vírgula, aspas e quebras de linha) */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (/[",\n\r;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Gera nome de arquivo com timestamp */
function makeFilename(ext: "csv" | "xlsx") {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
  return `transacoes_${stamp}.${ext}`
}

/** Dispara download de um Blob no navegador */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Exporta como CSV (sem dependências externas) */
function exportToCSV(transactions: Transaction[]) {
  if (transactions.length === 0) return

  const rows = transactions.map(toExportRow)
  const headers = Object.keys(rows[0])

  const csvLines = [
    headers.join(","),
    ...rows.map(row => headers.map(h => csvEscape((row as any)[h])).join(",")),
  ]

  // BOM para o Excel reconhecer UTF-8 (acentos)
  const csv = "\uFEFF" + csvLines.join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, makeFilename("csv"))
}

/** Exporta como XLSX (usa biblioteca xlsx via import dinâmico) */
async function exportToXLSX(transactions: Transaction[]) {
  if (transactions.length === 0) return

  const XLSX = await import("xlsx")

  const rows = transactions.map(toExportRow)
  const worksheet = XLSX.utils.json_to_sheet(rows)

  // Largura automática das colunas baseada no maior valor
  const colWidths = Object.keys(rows[0]).map(key => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...rows.map(r => String((r as any)[key] ?? "").length)
      ) + 2,
      50, // limite máximo
    ),
  }))
  worksheet["!cols"] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transações")

  XLSX.writeFile(workbook, makeFilename("xlsx"))
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [page,         setPage]         = useState(1)
  const [status,       setStatus]       = useState<PaymentStatus>("all")
  const [method,       setMethod]       = useState("all")
  const [search,       setSearch]       = useState("")
  const [searchInput,  setSearchInput]  = useState("")
  const [selectedTx,   setSelectedTx]   = useState<Transaction | null>(null)
  const [sheetOpen,    setSheetOpen]    = useState(false)
  const [exporting,    setExporting]    = useState<"csv" | "xlsx" | null>(null)

  const { data, isLoading } = useTransactions({ page, pageSize: 20, status, method, search })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const openDetail = (tx: Transaction) => {
    setSelectedTx(tx)
    setSheetOpen(true)
  }

  const handleExport = async (
    format: "csv" | "xlsx",
    scope: "current" | "all",
  ) => {
    try {
      setExporting(format)

      let transactions: Transaction[] = []

      if (scope === "current") {
        transactions = data?.data ?? []
      } else {
        // Busca todas as transações respeitando os filtros atuais.
        // Ajuste a URL/parâmetros conforme a sua API.
        const params = new URLSearchParams({
          pageSize: "10000",
          status,
          method,
          search,
        })
        const res = await fetch(`/api/transactions?${params.toString()}`)
        if (!res.ok) throw new Error("Falha ao buscar transações")
        const json = await res.json()
        transactions = json.data ?? []
      }

      if (transactions.length === 0) {
        alert("Nenhuma transação para exportar")
        return
      }

      if (format === "csv") {
        exportToCSV(transactions)
      } else {
        await exportToXLSX(transactions)
      }
    } catch (err) {
      console.error("Erro ao exportar:", err)
      alert("Erro ao exportar transações. Veja o console para detalhes.")
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Histórico completo de transações</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={!!exporting || isLoading}>
              {exporting
                ? <Loader2 className="size-4 animate-spin" />
                : <Download className="size-4" />
              }
              {exporting ? "Exportando..." : "Exportar"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-xs">
              Página atual ({data?.data?.length ?? 0})
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport("xlsx", "current")}>
              <FileSpreadsheet className="size-4 mr-2 text-success" />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv", "current")}>
              <FileText className="size-4 mr-2 text-primary" />
              CSV (.csv)
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs">
              Todas com filtros ({data?.total ?? 0})
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport("xlsx", "all")}>
              <FileSpreadsheet className="size-4 mr-2 text-success" />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv", "all")}>
              <FileText className="size-4 mr-2 text-primary" />
              CSV (.csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Informativo — liberação por envio do pedido */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Truck className="size-4 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-foreground">A liberação do saldo depende do envio do pedido</p>
          <p className="text-muted-foreground mt-0.5">
            O valor de cada venda é liberado somente após o pedido ser enviado e ter um código de rastreio.
            Pedidos ainda não enviados aparecem como <span className="font-medium text-warning">Aguardando envio</span> e o
            saldo permanece pendente até a postagem.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="px-4 py-3">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ID, cliente, email..."
                className="pl-9"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v:any) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
                <SelectItem value="chargeback">Chargeback</SelectItem>
              </SelectContent>
            </Select>
            <Select value={method} onValueChange={v => { setMethod(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Métodos</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="mbway">MB Way</SelectItem>
                <SelectItem value="multibanco">Multibanco</SelectItem>
                <SelectItem value="apple_pay">Apple Pay</SelectItem>
                <SelectItem value="google_pay">Google Pay</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="sepa">SEPA</SelectItem>
                <SelectItem value="ideal">iDEAL</SelectItem>
                <SelectItem value="klarna">Klarna</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline" className="gap-2">
              <Filter className="size-4" />Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            {isLoading
              ? <Skeleton className="h-4 w-40" />
              : `${data?.total ?? 0} transações encontradas`
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="text-right">Data</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : (data?.data ?? []).map(tx => {
                    const s     = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.pending
                    const SIcon = s.icon
                    return (
                      <TableRow
                        key={tx.id}
                        className="group cursor-pointer hover:bg-muted/40"
                        onClick={() => openDetail(tx)}
                      >
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {tx.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell className="font-medium">{tx.customer ?? "—"}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{renderCountryFlag(tx.country) ?? "🌍"}</span>
                            <span className="text-xs text-muted-foreground">{tx.country}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <MethodBadge method={tx.paymentMethod} />
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(tx.amount, tx.currency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1 font-medium", s.className)}>
                            <SIcon className="size-3" />{s.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <OrderBadge shipped={tx.orderShipped} />
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 text-white group-hover:opacity-100 transition-opacity"
                            onClick={e => { e.stopPropagation(); openDetail(tx) }}
                          >
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
              }
            </TableBody>
          </Table>

          {/* Paginação */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {data.page} de {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <TransactionSheet
        tx={selectedTx}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}