"use client"

// ═══════════════════════════════════════════════════════════════════════════
// KOOPFY ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════
// Painel admin completo para Koopfy Payments.
// Acesso restrito a managers com role === "admin" (ou "supervisor" read-only).
//
// Integração com CRM existente:
//   1) Importar AdminPanel e adicionar como view condicional no CrmApp root
//   2) Adicionar items na sidebar dentro do bloco "supervisor/admin"
//   3) Usar a mesma função crmFetch + UnauthorizedError do arquivo CRM
//
// Endpoints backend esperados (ver admin-types.ts para contratos completos):
//   GET    /crm/admin/overview?range=
//   GET    /crm/admin/withdrawals?status=&page=&search=
//   POST   /crm/admin/withdrawals/:id/approve
//   POST   /crm/admin/withdrawals/:id/reject
//   POST   /crm/admin/withdrawals/:id/mark-completed
//   POST   /crm/admin/withdrawals/:id/mark-failed
//   GET    /crm/admin/balances?search=&sort=
//   GET    /crm/admin/transactions?...
//   POST   /crm/admin/transactions/:id/refund
//   GET    /crm/admin/chargebacks?status=
//   POST   /crm/admin/chargebacks/:id/accept
//   POST   /crm/admin/chargebacks/:id/contest
//   GET    /crm/admin/audit?...
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Search, CheckCircle2, XCircle, Clock, AlertTriangle, Shield, Skull,
    TrendingUp, TrendingDown, Activity, RefreshCw, Wallet, BarChart3,
    DollarSign, ArrowDownToLine, ArrowUpRight, ArrowDownRight,
    Banknote, AlertCircle, ExternalLink, Eye, FileText, Hash,
    CreditCard, Building2, Copy, Filter, Download, Zap,
    ScrollText, ShieldAlert, FileWarning, Loader2, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── API helper compartilhado ─────────────────────────────────────────────
import { crmFetch, UnauthorizedError } from "@/lib/crm-auth"

// ─── Formatters ──────────────────────────────────────────────────────────────

const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n ?? 0)

const fmtCompactUSD = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
    return fmtUSD(n)
}

const fmtPct = (n: number, digits = 1) => `${(n ?? 0).toFixed(digits)}%`

const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

const initials = (name: string) =>
    (name ?? "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("")

const delta = (curr: number, prev: number) => {
    if (!prev) return 0
    return ((curr - prev) / prev) * 100
}

// ─── Config ──────────────────────────────────────────────────────────────────

const RISK_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    WHITE: { label: "White", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Shield },
    GRAY: { label: "Gray", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
    BLACK: { label: "Black", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: Skull },
}

const WITHDRAWAL_STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending_review: { label: "Aguardando", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Clock },
    approved: { label: "Aprovado", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: CheckCircle2 },
    processing: { label: "Processando", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", icon: Loader2 },
    completed: { label: "Concluído", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircle },
    failed: { label: "Falhou", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: AlertCircle },
    cancelled: { label: "Cancelado", color: "text-zinc-400", bg: "bg-zinc-700/30 border-zinc-700", icon: XCircle },
}

const METHOD_LABEL: Record<string, string> = {
    pix: "PIX",
    sepa: "SEPA",
    wire: "Wire Transfer",
    ach: "ACH",
    crypto: "Crypto",
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════

export type AdminView =
    | "admin-overview"
    | "admin-withdrawals"
    | "admin-balances"
    | "admin-transactions"
    | "admin-chargebacks"
    | "admin-audit"

interface AdminPanelProps {
    view: AdminView
    onNavigate?: (view: AdminView) => void
}

export function AdminPanel({ view }: AdminPanelProps) {
    switch (view) {
        case "admin-overview": return <OverviewView />
        case "admin-withdrawals": return <WithdrawalsView />
        case "admin-balances": return <BalancesView />
        case "admin-transactions": return <TransactionsView />
        case "admin-chargebacks": return <ChargebacksView />
        case "admin-audit": return <AuditView />
        default: return <OverviewView />
    }
}

// Items para adicionar na sidebar do CRM (só renderizar se role === "admin")
export const ADMIN_NAV_ITEMS = [
    { id: "admin-overview" as const, label: "Visão Geral", icon: BarChart3 },
    { id: "admin-withdrawals" as const, label: "Saques", icon: ArrowDownToLine, badgeKey: "pendingWithdrawals" },
    { id: "admin-balances" as const, label: "Saldos", icon: Wallet },
    { id: "admin-transactions" as const, label: "Transações", icon: CreditCard },
    { id: "admin-chargebacks" as const, label: "Chargebacks", icon: ShieldAlert, badgeKey: "openChargebacks" },
    { id: "admin-audit" as const, label: "Auditoria", icon: ScrollText },
]

// ═══════════════════════════════════════════════════════════════════════════
// 1. OVERVIEW — métricas financeiras + gráfico + top sellers
// ═══════════════════════════════════════════════════════════════════════════

function OverviewView() {
    const [range, setRange] = useState("30d")
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true); setError(null)
        try { setData(await crmFetch<any>(`/admin/overview?range=${range}`)) }
        catch (e: any) {
            if (!(e instanceof UnauthorizedError)) setError(e.message ?? "Erro ao carregar")
        } finally { setLoading(false) }
    }, [range])

    useEffect(() => { load() }, [load])

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="size-5 text-primary" />
                        Visão Geral da Plataforma
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Métricas operacionais e financeiras</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={range} onValueChange={setRange}>
                        <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-white h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="today">Hoje</SelectItem>
                            <SelectItem value="7d">Últimos 7 dias</SelectItem>
                            <SelectItem value="30d">Últimos 30 dias</SelectItem>
                            <SelectItem value="90d">Últimos 90 dias</SelectItem>
                            <SelectItem value="mtd">Mês atual</SelectItem>
                            <SelectItem value="ytd">Ano atual</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={load} className="text-zinc-400 hover:text-white h-9 w-9">
                        <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={load} />}

            {/* KPI Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label="Volume Total (GMV)"
                    value={loading ? null : fmtCompactUSD(data?.gmv?.total_usd ?? 0)}
                    delta={data ? delta(data.gmv.total_usd, data.gmv.prev_total_usd) : null}
                    icon={DollarSign}
                    accent="primary"
                    sub={data && `${data.gmv.approved_count} transações aprovadas`}
                />
                <KpiCard
                    label="Receita da Plataforma"
                    value={loading ? null : fmtCompactUSD(data?.revenue?.total_usd ?? 0)}
                    delta={data ? delta(data.revenue.total_usd, data.revenue.prev_total_usd) : null}
                    icon={TrendingUp}
                    accent="success"
                    sub={data && `Taxa efetiva: ${fmtPct((data.revenue.total_usd / Math.max(data.gmv.total_usd, 1)) * 100)}`}
                />
                <KpiCard
                    label="Saques Pendentes"
                    value={loading ? null : String(data?.withdrawals?.pending_count ?? 0)}
                    icon={ArrowDownToLine}
                    accent="warning"
                    sub={data && fmtCompactUSD(data.withdrawals.pending_usd)}
                    flash={!!(data?.withdrawals?.pending_count)}
                />
                <KpiCard
                    label="Float da Plataforma"
                    value={loading ? null : fmtCompactUSD(data?.balances?.platform_float_usd ?? 0)}
                    icon={Wallet}
                    accent="cyan"
                    sub={data && `${fmtCompactUSD(data.balances.total_available_usd)} disponível p/ sellers`}
                />
            </div>

            {/* Secondary metrics */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SmallMetric
                    label="Sellers ativos"
                    value={data?.sellers?.active}
                    sub={data && `+${data.sellers.new_this_period} novos`}
                    loading={loading}
                />
                <SmallMetric
                    label="Reembolsos"
                    value={data?.gmv?.refunded_count}
                    sub={data && `${fmtPct((data.gmv.refunded_count / Math.max(data.gmv.approved_count, 1)) * 100, 2)} taxa`}
                    loading={loading}
                />
                <SmallMetric
                    label="Chargebacks"
                    value={data?.gmv?.chargeback_count}
                    sub={data && `${fmtPct((data.gmv.chargeback_count / Math.max(data.gmv.approved_count, 1)) * 100, 2)} taxa`}
                    loading={loading}
                    tone="danger"
                />
                <SmallMetric
                    label="Saques hoje"
                    value={data && fmtCompactUSD(data.withdrawals.processed_today_usd)}
                    sub={data?.withdrawals?.failed_count ? `${data.withdrawals.failed_count} falharam` : "Sem falhas"}
                    loading={loading}
                />
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-200">Volume e Receita</h3>
                        <p className="text-xs text-zinc-500">Comparativo no período selecionado</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <Legend color="bg-primary" label="GMV" />
                        <Legend color="bg-emerald-500" label="Receita" />
                    </div>
                </div>
                {loading ? (
                    <div className="h-56 bg-zinc-800/30 rounded-lg animate-pulse" />
                ) : (
                    <TimeSeriesChart data={data?.timeseries ?? []} />
                )}
            </div>

            {/* Top sellers */}
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden">
                <div className="p-5 border-b border-zinc-800/50">
                    <h3 className="text-sm font-semibold text-zinc-200">Top Sellers por Volume</h3>
                    <p className="text-xs text-zinc-500">Maiores GMVs no período</p>
                </div>
                <div className="divide-y divide-zinc-800/30">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-4"><div className="h-8 bg-zinc-800/30 rounded animate-pulse" /></div>
                        ))
                    ) : (data?.top_sellers ?? []).length === 0 ? (
                        <div className="p-8 text-center text-zinc-600 text-sm">Sem dados no período</div>
                    ) : (data?.top_sellers ?? []).map((s: any, i: number) => {
                        const r = RISK_CFG[s.risk_level]
                        const RI = r?.icon ?? Shield
                        return (
                            <div key={s.seller_id} className="flex items-center gap-3 p-4 hover:bg-zinc-900/50 transition-colors">
                                <span className="text-xs text-zinc-600 font-mono w-6">#{i + 1}</span>
                                <Avatar className="size-8 rounded-lg">
                                    {s.avatar_url && <AvatarImage src={s.avatar_url} />}
                                    <AvatarFallback className="rounded-lg bg-zinc-700 text-xs font-bold text-white">
                                        {initials(s.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{s.name}</p>
                                    <p className="text-[11px] text-zinc-500">{s.tx_count} transações</p>
                                </div>
                                {r && (
                                    <Badge variant="outline" className={cn("gap-1 text-[10px]", r.bg)}>
                                        <RI className={cn("size-2.5", r.color)} />
                                        <span className={r.color}>{r.label}</span>
                                    </Badge>
                                )}
                                <p className="text-sm font-bold text-white tabular-nums">{fmtCompactUSD(s.gmv_usd)}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, delta: deltaVal, icon: Icon, accent, sub, flash }: {
    label: string; value: string | null; delta?: number | null; icon: any
    accent: "primary" | "success" | "warning" | "danger" | "cyan"
    sub?: string | null | false; flash?: boolean
}) {
    const accents: Record<string, { ring: string; iconBg: string; iconColor: string }> = {
        primary: { ring: "ring-primary/10", iconBg: "bg-primary/10", iconColor: "text-primary" },
        success: { ring: "ring-emerald-500/10", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
        warning: { ring: "ring-amber-500/10", iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
        danger: { ring: "ring-red-500/10", iconBg: "bg-red-500/10", iconColor: "text-red-400" },
        cyan: { ring: "ring-cyan-500/10", iconBg: "bg-cyan-500/10", iconColor: "text-cyan-400" },
    }
    const a = accents[accent]
    const up = (deltaVal ?? 0) >= 0

    return (
        <div className={cn(
            "rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 transition-all",
            flash && "ring-1 ring-amber-500/30 shadow-[0_0_24px_-12px] shadow-amber-500/40"
        )}>
            <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
                <div className={cn("flex size-8 items-center justify-center rounded-lg", a.iconBg)}>
                    <Icon className={cn("size-4", a.iconColor)} />
                </div>
            </div>
            {value === null ? (
                <div className="h-7 w-24 bg-zinc-800/50 rounded animate-pulse" />
            ) : (
                <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                {deltaVal !== null && deltaVal !== undefined && value !== null && (
                    <span className={cn("flex items-center gap-0.5 font-medium", up ? "text-emerald-400" : "text-red-400")}>
                        {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                        {Math.abs(deltaVal).toFixed(1)}%
                    </span>
                )}
                {sub && <span className="text-zinc-500 truncate">{sub}</span>}
            </div>
        </div>
    )
}

function SmallMetric({ label, value, sub, loading, tone }: {
    label: string; value: any; sub?: any; loading: boolean; tone?: "danger"
}) {
    return (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-4">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
            {loading ? (
                <div className="h-6 w-16 bg-zinc-800/50 rounded animate-pulse mt-2" />
            ) : (
                <p className={cn("text-xl font-bold tabular-nums mt-1", tone === "danger" ? "text-red-400" : "text-white")}>
                    {value ?? "—"}
                </p>
            )}
            {sub && <p className="text-[11px] text-zinc-500 mt-0.5">{sub}</p>}
        </div>
    )
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={cn("size-2 rounded-full", color)} />
            <span className="text-zinc-400">{label}</span>
        </div>
    )
}

// SVG line chart (sem dependências externas)
function TimeSeriesChart({ data }: { data: { date: string; gmv_usd: number; revenue_usd: number }[] }) {
    if (!data.length) return <div className="h-56 flex items-center justify-center text-zinc-600 text-sm">Sem dados</div>

    const W = 800, H = 220, PAD = { t: 12, r: 12, b: 28, l: 48 }
    const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b

    const maxGmv = Math.max(...data.map(d => d.gmv_usd), 1)
    const maxRev = Math.max(...data.map(d => d.revenue_usd), 1)

    const x = (i: number) => PAD.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
    const yG = (v: number) => PAD.t + innerH - (v / maxGmv) * innerH
    const yR = (v: number) => PAD.t + innerH - (v / maxRev) * innerH

    const linePath = (key: "gmv_usd" | "revenue_usd", yFn: (v: number) => number) =>
        data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yFn(d[key]).toFixed(1)}`).join(" ")

    const areaPath = (key: "gmv_usd" | "revenue_usd", yFn: (v: number) => number) =>
        `${linePath(key, yFn)} L${x(data.length - 1).toFixed(1)},${(PAD.t + innerH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.t + innerH).toFixed(1)} Z`

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
        y: PAD.t + innerH - t * innerH,
        label: fmtCompactUSD(maxGmv * t),
    }))

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(168 85 247)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="rgb(168 85 247)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Y */}
                {yTicks.map((t, i) => (
                    <g key={i}>
                        <line x1={PAD.l} y1={t.y} x2={W - PAD.r} y2={t.y} stroke="rgb(39 39 42)" strokeDasharray="2 4" />
                        <text x={PAD.l - 6} y={t.y + 3} fill="rgb(113 113 122)" fontSize="9" textAnchor="end">{t.label}</text>
                    </g>
                ))}

                {/* X labels */}
                {data.map((d, i) => {
                    if (data.length > 12 && i % Math.ceil(data.length / 8) !== 0) return null
                    return (
                        <text key={i} x={x(i)} y={H - 10} fill="rgb(113 113 122)" fontSize="9" textAnchor="middle">
                            {new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </text>
                    )
                })}

                {/* Areas */}
                <path d={areaPath("gmv_usd", yG)} fill="url(#gmvGrad)" />
                <path d={areaPath("revenue_usd", yR)} fill="url(#revGrad)" />

                {/* Lines */}
                <path d={linePath("gmv_usd", yG)} stroke="rgb(168 85 247)" strokeWidth="2" fill="none" />
                <path d={linePath("revenue_usd", yR)} stroke="rgb(16 185 129)" strokeWidth="2" fill="none" />

                {/* Dots last */}
                <circle cx={x(data.length - 1)} cy={yG(data[data.length - 1].gmv_usd)} r="3" fill="rgb(168 85 247)" />
                <circle cx={x(data.length - 1)} cy={yR(data[data.length - 1].revenue_usd)} r="3" fill="rgb(16 185 129)" />
            </svg>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. WITHDRAWALS — gerenciamento completo de saques
// ═══════════════════════════════════════════════════════════════════════════

function WithdrawalsView() {
    const [statusFilter, setStatusFilter] = useState("pending_review")
    const [search, setSearch] = useState("")
    const [data, setData] = useState<{ data: any[]; total: number; totalPages: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const params = new URLSearchParams({ page: String(page), status: statusFilter })
            if (search) params.set("search", search)
            setData(await crmFetch<any>(`/admin/withdrawals?${params}`))
        } catch (e: any) {
            if (!(e instanceof UnauthorizedError)) setError(e.message ?? "Erro ao carregar saques")
        } finally { setLoading(false) }
    }, [statusFilter, search, page])

    useEffect(() => { load() }, [load])

    if (selectedId) return (
        <WithdrawalDetailView id={selectedId} onBack={() => setSelectedId(null)} onChange={load} />
    )

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <ArrowDownToLine className="size-5 text-primary" />
                        Solicitações de Saque
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Aprovação, rejeição e processamento</p>
                </div>
                <Button variant="ghost" size="icon" onClick={load} className="text-zinc-400 hover:text-white">
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { id: "pending_review", label: "Pendentes" },
                    { id: "approved", label: "Aprovados" },
                    { id: "processing", label: "Processando" },
                    { id: "completed", label: "Concluídos" },
                    { id: "rejected", label: "Rejeitados" },
                    { id: "failed", label: "Falharam" },
                ].map(f => (
                    <button key={f.id}
                        onClick={() => { setStatusFilter(f.id); setPage(1) }}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            statusFilter === f.id
                                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                : "bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        )}>
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <Input
                    placeholder="Buscar por seller, email, valor..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
            </div>

            {error && <ErrorBanner message={error} onRetry={load} />}

            <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800/50">
                        <tr>
                            {["Seller", "Valor", "Método", "Risco", "Solicitado", "Flags", "Status", ""].map(h => (
                                <th key={h} className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-zinc-800/30 rounded animate-pulse" /></td></tr>
                            ))
                        ) : (data?.data ?? []).map(w => {
                            const s = WITHDRAWAL_STATUS_CFG[w.status] ?? WITHDRAWAL_STATUS_CFG.pending_review
                            const r = RISK_CFG[w.seller_risk]
                            const SI = s.icon
                            const RI = r?.icon ?? Shield
                            const flagCount = Object.values(w.risk_flags ?? {}).filter(Boolean).length

                            return (
                                <tr key={w.id}
                                    className="hover:bg-zinc-900/50 cursor-pointer transition-colors group"
                                    onClick={() => setSelectedId(w.id)}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8 rounded-lg shrink-0">
                                                {w.seller_avatar && <AvatarImage src={w.seller_avatar} />}
                                                <AvatarFallback className="rounded-lg bg-zinc-700 text-xs font-bold text-white">
                                                    {initials(w.seller_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="font-medium text-white truncate">{w.seller_name}</p>
                                                <p className="text-[11px] text-zinc-500 truncate">{w.seller_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-white font-bold tabular-nums">{fmtUSD(w.amount_usd)}</p>
                                        <p className="text-[10px] text-zinc-500">Líquido: {fmtUSD(w.net_amount_usd)}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                                            {METHOD_LABEL[w.method] ?? w.method}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {r && (
                                            <Badge variant="outline" className={cn("gap-1 text-[10px]", r.bg)}>
                                                <RI className={cn("size-2.5", r.color)} />
                                                <span className={r.color}>{r.label}</span>
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400 text-xs">{fmtDateTime(w.requested_at)}</td>
                                    <td className="px-4 py-3">
                                        {flagCount > 0 ? (
                                            <Badge variant="outline" className="gap-1 text-[10px] bg-amber-500/10 border-amber-500/20 text-amber-400">
                                                <AlertTriangle className="size-2.5" />{flagCount}
                                            </Badge>
                                        ) : (
                                            <span className="text-zinc-700 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className={cn("gap-1 text-[10px]", s.bg)}>
                                            <SI className={cn("size-2.5", s.color, w.status === "processing" && "animate-spin")} />
                                            <span className={s.color}>{s.label}</span>
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <ChevronRight className="size-4 text-zinc-600 group-hover:text-white transition-colors" />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {!loading && !error && (data?.data?.length === 0) && (
                    <div className="py-16 text-center text-zinc-600 text-sm">Nenhum saque encontrado</div>
                )}
            </div>

            {data && data.totalPages > 1 && (
                <Pagination page={page} total={data.total} totalPages={data.totalPages} onChange={setPage} />
            )}
        </div>
    )
}

// ─── Withdrawal Detail ───────────────────────────────────────────────────────

function WithdrawalDetailView({ id, onBack, onChange }: {
    id: string; onBack: () => void; onChange: () => void
}) {
    const [w, setW] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [completeOpen, setCompleteOpen] = useState(false)
    const [failOpen, setFailOpen] = useState(false)
    const [working, setWorking] = useState(false)

    const load = useCallback(async () => {
        setLoading(true); setError(null)
        try { setW(await crmFetch<any>(`/admin/withdrawals/${id}`)) }
        catch (e: any) {
            if (!(e instanceof UnauthorizedError)) setError(e.message ?? "Erro ao carregar")
        } finally { setLoading(false) }
    }, [id])

    useEffect(() => { load() }, [load])

    const act = async (fn: () => Promise<any>) => {
        setWorking(true)
        try { await fn(); await load(); onChange() }
        catch (e: any) { if (!(e instanceof UnauthorizedError)) alert(e.message) }
        finally { setWorking(false) }
    }

    if (loading) return (
        <div className="p-6 space-y-4">
            <div className="h-8 bg-zinc-800/30 rounded w-48 animate-pulse" />
            <div className="h-64 bg-zinc-800/30 rounded animate-pulse" />
        </div>
    )

    if (error || !w) return (
        <div className="p-6 space-y-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-zinc-400">← Voltar</Button>
            <ErrorBanner message={error ?? "Saque não encontrado"} onRetry={load} />
        </div>
    )

    const s = WITHDRAWAL_STATUS_CFG[w.status] ?? WITHDRAWAL_STATUS_CFG.pending_review
    const r = RISK_CFG[w.seller_risk]
    const SI = s.icon
    const RI = r?.icon ?? Shield
    const flags = Object.entries(w.risk_flags ?? {}).filter(([, v]) => v)
    const isPending = w.status === "pending_review"
    const isApproved = w.status === "approved" || w.status === "processing"

    return (
        <div className="p-6 space-y-5">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-zinc-400 hover:text-white -ml-2">
                ← Voltar para saques
            </Button>

            {/* Header */}
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-14 rounded-xl">
                            {w.seller_avatar && <AvatarImage src={w.seller_avatar} />}
                            <AvatarFallback className="rounded-xl bg-zinc-700 font-bold text-white">{initials(w.seller_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-xl font-bold text-white">{w.seller_name}</h1>
                            <p className="text-xs text-zinc-500 mt-0.5">{w.seller_email}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className={cn("gap-1 text-xs", s.bg)}>
                                    <SI className={cn("size-3", s.color, w.status === "processing" && "animate-spin")} />
                                    <span className={s.color}>{s.label}</span>
                                </Badge>
                                {r && (
                                    <Badge variant="outline" className={cn("gap-1 text-xs", r.bg)}>
                                        <RI className={cn("size-3", r.color)} />
                                        <span className={r.color}>{r.label}</span>
                                    </Badge>
                                )}
                                <span className="text-[11px] text-zinc-500 font-mono">#{w.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Valor solicitado</p>
                        <p className="text-3xl font-bold text-white tabular-nums">{fmtUSD(w.amount_usd)}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Taxa {fmtUSD(w.fee_usd)} · Líquido <span className="text-emerald-400 font-medium">{fmtUSD(w.net_amount_usd)}</span>
                        </p>
                    </div>
                </div>

                {/* Action bar */}
                <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-zinc-800/50">
                    {isPending && (
                        <>
                            <Button size="sm" disabled={working}
                                onClick={() => setApproveOpen(true)}
                                className="gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
                                <CheckCircle2 className="size-3.5" />Aprovar Saque
                            </Button>
                            <Button size="sm" variant="outline" disabled={working}
                                onClick={() => setRejectOpen(true)}
                                className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
                                <XCircle className="size-3.5" />Rejeitar
                            </Button>
                        </>
                    )}
                    {isApproved && (
                        <>
                            <Button size="sm" disabled={working}
                                onClick={() => setCompleteOpen(true)}
                                className="gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
                                <CheckCircle2 className="size-3.5" />Marcar como Concluído
                            </Button>
                            <Button size="sm" variant="outline" disabled={working}
                                onClick={() => setFailOpen(true)}
                                className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
                                <AlertCircle className="size-3.5" />Marcar como Falhou
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Risk flags */}
            {flags.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="size-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-amber-400">Sinalizadores de risco</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {flags.map(([key]) => (
                            <Badge key={key} variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-300">
                                {key.replace(/_/g, " ")}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Destino */}
                <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Banknote className="size-4 text-zinc-400" />
                        <h3 className="text-sm font-semibold text-zinc-200">Destino do Saque</h3>
                    </div>
                    <div className="space-y-2.5 text-sm">
                        <Row label="Método" value={METHOD_LABEL[w.method] ?? w.method} />
                        {w.method === "pix" && (
                            <>
                                <CopyRow label="Chave PIX" value={w.destination?.pix_key} />
                                <Row label="Tipo" value={w.destination?.pix_key_type?.toUpperCase()} />
                            </>
                        )}
                        {(w.method === "sepa" || w.method === "wire") && (
                            <>
                                <CopyRow label="IBAN" value={w.destination?.iban} mono />
                                <CopyRow label="SWIFT/BIC" value={w.destination?.swift} mono />
                                <Row label="Banco" value={w.destination?.bank_name} />
                                <Row label="Titular" value={w.destination?.account_holder} />
                            </>
                        )}
                        {w.method === "crypto" && (
                            <>
                                <CopyRow label="Carteira" value={w.destination?.wallet_address} mono />
                                <Row label="Rede" value={w.destination?.network} />
                            </>
                        )}
                        <Row label="Moeda destino" value={w.currency} />
                        {w.fx_rate && <Row label="Taxa de câmbio" value={w.fx_rate.toFixed(4)} />}
                    </div>
                </div>

                {/* Snapshot do seller */}
                <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Eye className="size-4 text-zinc-400" />
                        <h3 className="text-sm font-semibold text-zinc-200">Contexto do Seller</h3>
                    </div>
                    <div className="space-y-2.5 text-sm">
                        <Row label="Saldo no momento" value={fmtUSD(w.seller_balance_at_request_usd)} highlight />
                        <Row label="GMV 30d" value={fmtUSD(w.seller_30d_gmv_usd)} />
                        <Row label="Taxa de CB" value={fmtPct(w.seller_chargeback_rate * 100, 2)}
                            tone={w.seller_chargeback_rate > 0.01 ? "danger" : undefined} />
                        <Row label="Solicitado em" value={fmtDateTime(w.requested_at)} />
                        {w.reviewed_at && (
                            <Row label="Revisado em" value={`${fmtDateTime(w.reviewed_at)} por ${w.reviewer_name ?? "—"}`} />
                        )}
                        {w.completed_at && <Row label="Concluído em" value={fmtDateTime(w.completed_at)} tone="success" />}
                    </div>
                </div>
            </div>

            {(w.rejection_reason || w.failure_reason || w.notes) && (
                <div className="space-y-2">
                    {w.rejection_reason && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                            <p className="text-xs font-semibold text-red-400 mb-1">Motivo da rejeição</p>
                            <p className="text-sm text-zinc-300">{w.rejection_reason}</p>
                        </div>
                    )}
                    {w.failure_reason && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                            <p className="text-xs font-semibold text-red-400 mb-1">Motivo da falha</p>
                            <p className="text-sm text-zinc-300">{w.failure_reason}</p>
                        </div>
                    )}
                    {w.notes && (
                        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
                            <p className="text-xs font-semibold text-zinc-400 mb-1">Notas internas</p>
                            <p className="text-sm text-zinc-300">{w.notes}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Dialogs */}
            <ApproveWithdrawalDialog open={approveOpen} onOpenChange={setApproveOpen}
                onConfirm={(dto: any) => act(() => crmFetch(`/admin/withdrawals/${id}/approve`, { method: "POST", body: JSON.stringify(dto) }))} />
            <SimpleReasonDialog open={rejectOpen} onOpenChange={setRejectOpen}
                title="Rejeitar Saque" icon={XCircle} accent="danger"
                placeholder="Motivo da rejeição (visível para o seller)..."
                confirmLabel="Rejeitar"
                onConfirm={(reason: string) => act(() => crmFetch(`/admin/withdrawals/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }))} />
            <CompleteWithdrawalDialog open={completeOpen} onOpenChange={setCompleteOpen}
                onConfirm={(dto: any) => act(() => crmFetch(`/admin/withdrawals/${id}/mark-completed`, { method: "POST", body: JSON.stringify(dto) }))} />
            <SimpleReasonDialog open={failOpen} onOpenChange={setFailOpen}
                title="Marcar como Falhou" icon={AlertCircle} accent="danger"
                placeholder="Motivo da falha (interno)..."
                confirmLabel="Confirmar Falha"
                onConfirm={(reason: string) => act(() => crmFetch(`/admin/withdrawals/${id}/mark-failed`, { method: "POST", body: JSON.stringify({ reason }) }))} />
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. BALANCES — saldos consolidados de sellers
// ═══════════════════════════════════════════════════════════════════════════

function BalancesView() {
    const [search, setSearch] = useState("")
    const [sort, setSort] = useState("available_desc")
    const [data, setData] = useState<any[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const params = new URLSearchParams({ sort })
            if (search) params.set("search", search)
            setData(await crmFetch<any[]>(`/admin/balances?${params}`))
        } catch (e: any) {
            if (!(e instanceof UnauthorizedError)) setError(e.message ?? "Erro")
        } finally { setLoading(false) }
    }, [search, sort])

    useEffect(() => { load() }, [load])

    const totals = useMemo(() => {
        if (!data) return null
        return data.reduce((acc, b) => ({
            available: acc.available + (b.available_usd ?? 0),
            pending: acc.pending + (b.pending_usd ?? 0),
            reserve: acc.reserve + (b.reserve_usd ?? 0),
            on_hold: acc.on_hold + (b.on_hold_usd ?? 0),
        }), { available: 0, pending: 0, reserve: 0, on_hold: 0 })
    }, [data])

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Wallet className="size-5 text-primary" />
                        Saldos dos Sellers
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Disponível, pendente, reserva e travado</p>
                </div>
                <Button variant="ghost" size="icon" onClick={load} className="text-zinc-400 hover:text-white">
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </Button>
            </div>

            {/* Totais */}
            {totals && (
                <div className="grid gap-3 sm:grid-cols-4">
                    <SmallMetric label="Total disponível" value={fmtCompactUSD(totals.available)} loading={loading} />
                    <SmallMetric label="Total pendente" value={fmtCompactUSD(totals.pending)} loading={loading} />
                    <SmallMetric label="Total em reserva" value={fmtCompactUSD(totals.reserve)} loading={loading} />
                    <SmallMetric label="Total travado" value={fmtCompactUSD(totals.on_hold)} loading={loading} tone={totals.on_hold > 0 ? "danger" : undefined} />
                </div>
            )}

            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar seller..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                    />
                </div>
                <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-52 bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="available_desc">Maior disponível</SelectItem>
                        <SelectItem value="pending_desc">Maior pendente</SelectItem>
                        <SelectItem value="gmv_desc">Maior GMV 30d</SelectItem>
                        <SelectItem value="on_hold_desc">Maior travado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {error && <ErrorBanner message={error} onRetry={load} />}

            <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800/50">
                        <tr>
                            {["Seller", "Disponível", "Pendente", "Reserva", "Travado", "GMV 30d", "CB 30d"].map(h => (
                                <th key={h} className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-zinc-800/30 rounded animate-pulse" /></td></tr>
                            ))
                        ) : (data ?? []).map(b => {
                            const r = RISK_CFG[b.risk_level]
                            const RI = r?.icon ?? Shield
                            return (
                                <tr key={b.seller_id} className="hover:bg-zinc-900/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8 rounded-lg">
                                                {b.avatar_url && <AvatarImage src={b.avatar_url} />}
                                                <AvatarFallback className="rounded-lg bg-zinc-700 text-xs font-bold text-white">{initials(b.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-white">{b.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {r && (
                                                        <Badge variant="outline" className={cn("gap-0.5 text-[9px] px-1 py-0", r.bg)}>
                                                            <RI className={cn("size-2", r.color)} />
                                                            <span className={r.color}>{r.label}</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-emerald-400 font-bold tabular-nums">{fmtUSD(b.available_usd)}</td>
                                    <td className="px-4 py-3 text-zinc-300 tabular-nums">{fmtUSD(b.pending_usd)}</td>
                                    <td className="px-4 py-3 text-zinc-400 tabular-nums">{fmtUSD(b.reserve_usd)}</td>
                                    <td className={cn("px-4 py-3 tabular-nums", b.on_hold_usd > 0 ? "text-red-400 font-medium" : "text-zinc-600")}>
                                        {b.on_hold_usd > 0 ? fmtUSD(b.on_hold_usd) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300 tabular-nums">{fmtCompactUSD(b.gmv_30d_usd)}</td>
                                    <td className="px-4 py-3">
                                        {b.chargebacks_30d_count > 0 ? (
                                            <Badge variant="outline" className="text-[10px] bg-red-500/10 border-red-500/20 text-red-400">
                                                {b.chargebacks_30d_count}
                                            </Badge>
                                        ) : (
                                            <span className="text-zinc-700">—</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {!loading && !error && (data?.length === 0) && (
                    <div className="py-16 text-center text-zinc-600 text-sm">Nenhum saldo encontrado</div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. TRANSACTIONS — listagem + reembolso
// ═══════════════════════════════════════════════════════════════════════════

function TransactionsView() {
    const [filters, setFilters] = useState({ status: "all", search: "", provider: "all" })
    const [data, setData] = useState<{ data: any[]; total: number; totalPages: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [refundOpen, setRefundOpen] = useState<any>(null)

    const load = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (filters.status !== "all") params.set("status", filters.status)
            if (filters.provider !== "all") params.set("provider", filters.provider)
            if (filters.search) params.set("search", filters.search)
            setData(await crmFetch<any>(`/admin/transactions?${params}`))
        } catch (e: any) {
            if (!(e instanceof UnauthorizedError)) setError(e.message ?? "Erro")
        } finally { setLoading(false) }
    }, [filters, page])

    useEffect(() => { load() }, [load])

    const txStatusCfg: Record<string, { label: string; color: string }> = {
        succeeded: { label: "Aprovada", color: "text-emerald-400" },
        pending: { label: "Pendente", color: "text-amber-400" },
        requires_action: { label: "Pendente", color: "text-amber-400" },
        failed: { label: "Falhou", color: "text-red-400" },
        refunded: { label: "Reembolsada", color: "text-zinc-400" },
        partial_refund: { label: "Reemb. parcial", color: "text-zinc-400" },
        chargeback: { label: "Chargeback", color: "text-red-400" },
        disputed: { label: "Disputada", color: "text-amber-400" },
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <CreditCard className="size-5 text-primary" />
                        Transações
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Todas as transações da plataforma</p>
                </div>
                <Button variant="ghost" size="icon" onClick={load} className="text-zinc-400 hover:text-white">
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar por ID, seller, customer..."
                        value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                    />
                </div>
                <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="all">Todos status</SelectItem>
                        <SelectItem value="succeeded">Aprovadas</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="failed">Falhadas</SelectItem>
                        <SelectItem value="refunded">Reembolsadas</SelectItem>
                        <SelectItem value="chargeback">Chargebacks</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.provider} onValueChange={v => setFilters(f => ({ ...f, provider: v }))}>
                    <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="all">Todos providers</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="viva">Viva</SelectItem>
                        <SelectItem value="sibs">SIBS</SelectItem>
                        <SelectItem value="stripe_crypto">Stripe Crypto</SelectItem>
                        <SelectItem value="onramp">Onramp</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {error && <ErrorBanner message={error} onRetry={load} />}

            <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800/50">
                        <tr>
                            {["Data", "ID", "Seller", "Customer", "Valor", "Método", "Provider", "Status", ""].map(h => (
                                <th key={h} className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-3 py-3">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i}><td colSpan={9} className="px-3 py-3"><div className="h-4 bg-zinc-800/30 rounded animate-pulse" /></td></tr>
                            ))
                        ) : (data?.data ?? []).map(tx => {
                            const sc = txStatusCfg[tx.status] ?? { label: tx.status, color: "text-zinc-400" }
                            const canRefund = tx.status === "succeeded"
                            return (
                                <tr key={tx.id} className="hover:bg-zinc-900/50 transition-colors">
                                    <td className="px-3 py-3 text-zinc-500 text-xs whitespace-nowrap">{fmtDateTime(tx.created_at)}</td>
                                    <td className="px-3 py-3">
                                        <span className="text-zinc-400 font-mono text-[11px]">{tx.id.slice(0, 8)}</span>
                                    </td>
                                    <td className="px-3 py-3 text-white text-xs truncate max-w-32">{tx.seller_name}</td>
                                    <td className="px-3 py-3 text-zinc-400 text-xs truncate max-w-40">{tx.customer_email}</td>
                                    <td className="px-3 py-3">
                                        <p className="text-white font-bold tabular-nums">{fmtUSD(tx.amount_usd)}</p>
                                        <p className="text-[10px] text-zinc-500">taxa {fmtUSD(tx.fee_usd)}</p>
                                    </td>
                                    <td className="px-3 py-3 text-zinc-400 text-xs">{tx.method}</td>
                                    <td className="px-3 py-3 text-zinc-400 text-xs">{tx.provider}</td>
                                    <td className="px-3 py-3">
                                        <span className={cn("text-xs font-medium", sc.color)}>{sc.label}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        {canRefund && (
                                            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-zinc-400 hover:text-white px-2"
                                                onClick={() => setRefundOpen(tx)}>
                                                Reembolsar
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {!loading && !error && (data?.data?.length === 0) && (
                    <div className="py-16 text-center text-zinc-600 text-sm">Nenhuma transação encontrada</div>
                )}
            </div>

            {data && data.totalPages > 1 && (
                <Pagination page={page} total={data.total} totalPages={data.totalPages} onChange={setPage} />
            )}

            {refundOpen && (
                <RefundDialog tx={refundOpen} onOpenChange={() => setRefundOpen(null)}
                    onConfirm={async (dto: any) => {
                        try {
                            await crmFetch(`/admin/transactions/${refundOpen.id}/refund`, { method: "POST", body: JSON.stringify(dto) })
                            setRefundOpen(null); await load()
                        } catch (e: any) { if (!(e instanceof UnauthorizedError)) alert(e.message) }
                    }} />
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CHARGEBACKS — gestão de disputas
// ═══════════════════════════════════════════════════════════════════════════

function ChargebacksView() {
    const [statusFilter, setStatusFilter] = useState("open")
    const [data, setData] = useState<any[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const params = new URLSearchParams({ status: statusFilter })
            setData(await crmFetch<any[]>(`/admin/chargebacks?${params}`))
        } catch (e: any) {
            if (!(e instanceof UnauthorizedError)) setError(e.message ?? "Erro")
        } finally { setLoading(false) }
    }, [statusFilter])

    useEffect(() => { load() }, [load])

    const cbStatusCfg: Record<string, { label: string; color: string; bg: string }> = {
        open: { label: "Aberto", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
        evidence_required: { label: "Aguardando evidência", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
        under_review: { label: "Em análise", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
        won: { label: "Vencido", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        lost: { label: "Perdido", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        accepted: { label: "Aceito", color: "text-zinc-400", bg: "bg-zinc-700/30 border-zinc-700" },
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="size-5 text-red-400" />
                        Chargebacks & Disputas
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Gerenciamento de contestações</p>
                </div>
                <Button variant="ghost" size="icon" onClick={load} className="text-zinc-400 hover:text-white">
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                {[
                    { id: "open", label: "Abertos" },
                    { id: "evidence_required", label: "Aguardando evidência" },
                    { id: "under_review", label: "Em análise" },
                    { id: "won", label: "Vencidos" },
                    { id: "lost", label: "Perdidos" },
                ].map(f => (
                    <button key={f.id} onClick={() => setStatusFilter(f.id)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            statusFilter === f.id
                                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                                : "bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        )}>{f.label}</button>
                ))}
            </div>

            {error && <ErrorBanner message={error} onRetry={load} />}

            <div className="space-y-2">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 bg-zinc-900/30 rounded-xl animate-pulse" />
                    ))
                ) : (data ?? []).length === 0 ? (
                    <div className="py-16 text-center text-zinc-600 text-sm">Nenhum chargeback nesse status</div>
                ) : (data ?? []).map(cb => {
                    const sc = cbStatusCfg[cb.status] ?? cbStatusCfg.open
                    const deadlineUrgent = cb.deadline_at && new Date(cb.deadline_at).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000

                    return (
                        <div key={cb.id} className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <Badge variant="outline" className={cn("text-[10px]", sc.bg)}>
                                            <span className={sc.color}>{sc.label}</span>
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                                            {cb.reason_code}
                                        </Badge>
                                        {deadlineUrgent && (
                                            <Badge variant="outline" className="gap-1 text-[10px] bg-red-500/10 border-red-500/20 text-red-400">
                                                <Clock className="size-2.5" />Deadline próximo
                                            </Badge>
                                        )}
                                        <span className="text-[10px] text-zinc-500 font-mono">#{cb.id.slice(0, 8)}</span>
                                    </div>
                                    <p className="font-medium text-white text-sm">{cb.seller_name}</p>
                                    <p className="text-xs text-zinc-500">{cb.customer_email}</p>
                                    <p className="text-xs text-zinc-400 mt-1">{cb.reason_description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xl font-bold text-red-400 tabular-nums">-{fmtUSD(cb.amount_usd)}</p>
                                    <p className="text-[10px] text-zinc-500">Aberto {fmtDate(cb.opened_at)}</p>
                                    {cb.deadline_at && (
                                        <p className={cn("text-[10px] mt-0.5", deadlineUrgent ? "text-red-400" : "text-zinc-500")}>
                                            Até {fmtDate(cb.deadline_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {(cb.status === "open" || cb.status === "evidence_required") && (
                                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/50">
                                    <Button size="sm" variant="outline" className="gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-7 text-xs">
                                        <FileWarning className="size-3" />Contestar
                                    </Button>
                                    <Button size="sm" variant="ghost" className="gap-1.5 text-zinc-500 hover:text-white h-7 text-xs">
                                        Aceitar perda
                                    </Button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════

function AuditView() {
    const [filters, setFilters] = useState({ action: "all", search: "" })
    const [data, setData] = useState<any[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const params = new URLSearchParams()
            if (filters.action !== "all") params.set("action", filters.action)
            if (filters.search) params.set("search", filters.search)
            setData(await crmFetch<any[]>(`/admin/audit?${params}`))
        } catch (e: any) {
            if (!(e instanceof UnauthorizedError)) setError(e.message ?? "Erro")
        } finally { setLoading(false) }
    }, [filters])

    useEffect(() => { load() }, [load])

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <ScrollText className="size-5 text-primary" />
                        Log de Auditoria
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">Todas as ações administrativas registradas</p>
                </div>
                <Button variant="ghost" size="icon" onClick={load} className="text-zinc-400 hover:text-white">
                    <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar por ator, recurso, ação..."
                        value={filters.search}
                        onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                    />
                </div>
                <Select value={filters.action} onValueChange={v => setFilters(f => ({ ...f, action: v }))}>
                    <SelectTrigger className="w-48 bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="all">Todas ações</SelectItem>
                        <SelectItem value="withdrawal">Saques</SelectItem>
                        <SelectItem value="seller">Sellers</SelectItem>
                        <SelectItem value="transaction">Transações</SelectItem>
                        <SelectItem value="chargeback">Chargebacks</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {error && <ErrorBanner message={error} onRetry={load} />}

            <div className="space-y-1.5">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-14 bg-zinc-900/30 rounded-lg animate-pulse" />
                    ))
                ) : (data ?? []).length === 0 ? (
                    <div className="py-16 text-center text-zinc-600 text-sm">Nenhum registro encontrado</div>
                ) : (data ?? []).map(e => (
                    <div key={e.id} className="flex items-center gap-3 rounded-lg border border-zinc-800/30 bg-zinc-900/20 px-4 py-2.5 hover:bg-zinc-900/40 transition-colors">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/50">
                            <Activity className="size-3.5 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-white">{e.action.replace(/\./g, " → ").replace(/_/g, " ")}</span>
                                <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 capitalize">{e.resource_type}</Badge>
                                <span className="text-[10px] text-zinc-600 font-mono">{e.resource_id?.slice(0, 8)}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                                <span className="text-zinc-400">{e.actor_name}</span> ({e.actor_role}) · {fmtDateTime(e.created_at)}
                                {e.ip_address && <> · <span className="font-mono">{e.ip_address}</span></>}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{message}</span>
            <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 text-xs hover:bg-red-500/10">Tentar novamente</Button>
        </div>
    )
}

function Pagination({ page, total, totalPages, onChange }: {
    page: number; total: number; totalPages: number; onChange: (p: number) => void
}) {
    return (
        <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Página {page} de {totalPages} · {total} registros</p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}
                    className="border-zinc-800 text-zinc-400 hover:text-white h-8 text-xs">Anterior</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onChange(page + 1)}
                    className="border-zinc-800 text-zinc-400 hover:text-white h-8 text-xs">Próxima</Button>
            </div>
        </div>
    )
}

function Row({ label, value, highlight, tone }: {
    label: string; value: any; highlight?: boolean; tone?: "danger" | "success"
}) {
    return (
        <div className="flex justify-between gap-3">
            <span className="text-zinc-500 text-xs">{label}</span>
            <span className={cn(
                "font-medium text-sm tabular-nums text-right",
                tone === "danger" ? "text-red-400" : tone === "success" ? "text-emerald-400" : highlight ? "text-white" : "text-zinc-200"
            )}>{value ?? "—"}</span>
        </div>
    )
}

function CopyRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        if (!value) return
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }
    return (
        <div className="flex justify-between items-center gap-3">
            <span className="text-zinc-500 text-xs shrink-0">{label}</span>
            <button onClick={copy} disabled={!value}
                className={cn(
                    "flex items-center gap-2 text-right group min-w-0",
                    !value && "cursor-default"
                )}>
                <span className={cn(
                    "text-sm truncate",
                    mono && "font-mono text-xs",
                    value ? "text-zinc-200 group-hover:text-white" : "text-zinc-600"
                )}>{value ?? "—"}</span>
                {value && (
                    copied
                        ? <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                        : <Copy className="size-3 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
                )}
            </button>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// DIALOGS
// ═══════════════════════════════════════════════════════════════════════════

function ApproveWithdrawalDialog({ open, onOpenChange, onConfirm }: any) {
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        setLoading(true)
        try { await onConfirm({ notes: notes.trim() || undefined }); onOpenChange(false); setNotes("") }
        catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-emerald-400" />Aprovar Saque
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        O saque será enviado para processamento no gateway. Esta ação é registrada na auditoria.
                    </DialogDescription>
                </DialogHeader>
                <Textarea placeholder="Notas internas (opcional)" value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={3} />
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading} onClick={submit}
                        className="gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        Aprovar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function CompleteWithdrawalDialog({ open, onOpenChange, onConfirm }: any) {
    const [providerTxId, setProviderTxId] = useState("")
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!providerTxId.trim()) { alert("Informe o ID da transação no provider"); return }
        setLoading(true)
        try {
            await onConfirm({ provider_tx_id: providerTxId.trim(), notes: notes.trim() || undefined })
            onOpenChange(false); setProviderTxId(""); setNotes("")
        } catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-emerald-400" />Marcar como Concluído
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Confirma que o dinheiro foi efetivamente enviado para o destino do seller.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs">ID da transação no provider *</Label>
                        <Input value={providerTxId} onChange={e => setProviderTxId(e.target.value)}
                            placeholder="Ex.: po_1234abc..."
                            className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs" />
                    </div>
                    <Textarea placeholder="Notas (opcional)" value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={2} />
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading || !providerTxId.trim()} onClick={submit}
                        className="gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        Confirmar Conclusão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SimpleReasonDialog({ open, onOpenChange, title, icon: Icon, accent, placeholder, confirmLabel, onConfirm }: any) {
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!reason.trim()) return
        setLoading(true)
        try { await onConfirm(reason.trim()); onOpenChange(false); setReason("") }
        catch { } finally { setLoading(false) }
    }

    const accentCls = accent === "danger"
        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
        : "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Icon className={cn("size-5", accent === "danger" ? "text-red-400" : "text-primary")} />
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <Textarea placeholder={placeholder} value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={4} />
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading || !reason.trim()} onClick={submit} className={cn("gap-2", accentCls)}>
                        {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function RefundDialog({ tx, onOpenChange, onConfirm }: any) {
    const [partial, setPartial] = useState(false)
    const [amount, setAmount] = useState<number>(tx.amount_usd)
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!reason.trim()) { alert("Motivo é obrigatório"); return }
        if (partial && (amount <= 0 || amount > tx.amount_usd)) { alert("Valor inválido"); return }
        setLoading(true)
        try {
            await onConfirm({
                amount_usd: partial ? amount : undefined,
                reason: reason.trim(),
            })
        } catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open onOpenChange={() => onOpenChange()}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white">Reembolsar Transação</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Transação {tx.id.slice(0, 8)} de {fmtUSD(tx.amount_usd)}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <button onClick={() => setPartial(false)}
                            className={cn("flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                                !partial ? "border-primary bg-primary/10 text-primary" : "border-zinc-800 text-zinc-400"
                            )}>Total ({fmtUSD(tx.amount_usd)})</button>
                        <button onClick={() => setPartial(true)}
                            className={cn("flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                                partial ? "border-primary bg-primary/10 text-primary" : "border-zinc-800 text-zinc-400"
                            )}>Parcial</button>
                    </div>
                    {partial && (
                        <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs">Valor a reembolsar (USD)</Label>
                            <Input type="number" value={amount} step="0.01" max={tx.amount_usd} min={0.01}
                                onChange={e => setAmount(parseFloat(e.target.value))}
                                className="bg-zinc-900 border-zinc-800 text-white" />
                        </div>
                    )}
                    <Textarea placeholder="Motivo do reembolso *" value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={3} />
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange()}>Cancelar</Button>
                    <Button disabled={loading || !reason.trim()} onClick={submit}>
                        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                        Reembolsar {partial ? fmtUSD(amount) : fmtUSD(tx.amount_usd)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}