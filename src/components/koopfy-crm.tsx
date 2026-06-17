// components/crm/koopfy-crm.tsx
// ═══════════════════════════════════════════════════════════════════════════
// CRM principal (sellers / dashboard / gerentes).
//
// MUDANÇAS vs versão antiga:
//   • Removido CrmApp (default export) — agora a page é app/crm/sellers/page.tsx
//   • Removido Sidebar interno — agora vive em components/crm-sidebar.tsx
//   • Removido AuthCtx local — usa o useAuth() do app/crm/layout.tsx
//   • Removido bloco crmFetch / redirectToLogin / UnauthorizedError local
//   • Importa tudo de @/lib/crm-auth
//   • Exporta DashboardView, SellersListView, SellerDetailView, ManagersView
//     para serem usados em app/crm/sellers/page.tsx
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
    Users, Search, CheckCircle2, XCircle,
    Clock, AlertTriangle, Shield, MessageSquare,
    Phone, Mail, ChevronRight, ArrowLeft, Pin,
    Trash2, Edit3, UserPlus, UserMinus, RefreshCw,
    Activity, Lock, Wallet, Send, Plus,
    AlertCircle, ExternalLink,
    FileText, Building2, IdCard, Home, Eye, Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Auth compartilhado ───────────────────────────────────────────────────
import { crmFetch, UnauthorizedError } from "@/lib/crm-auth"
import { useAuth } from "@/app/(crm)/crm/layout"

// ─── Types ────────────────────────────────────────────────────────────────

interface SellerRow {
    seller_id: string; name: string; email: string; status: string
    risk_level: string; instagram: string; whatsapp: string; avatar_url?: string
    kyc_name: string; kyc_status: string; city: string; state: string
    manager_id?: string; manager_name?: string; assigned_at?: string
    offers_total: number; offers_approved: number; offers_pending: number
    created_at: string
    provider_default?: string | null
}

interface SellerDetail {
    seller: SellerRow & { enabled_methods: string[]; rejection_reason?: string; provider_default?: string | null; provider_mid?: string | null }
    offers: any[]; fees: any; notes: any[]; log: any[]; kyc: any; documents: any
}

const PROVIDER_CFG: Record<string, { label: string; color: string; bg: string }> = {
    stripe: { label: "Stripe", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    viva: { label: "Viva", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    sibs: { label: "SIBS", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    stripe_crypto: { label: "Stripe Crypto", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    onramp: { label: "Onramp", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
    setinel_gate: { label: "Sentinel Gate", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    approvebly: { label: "Approvebly", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    simulator: { label: "Simulator (teste)", color: "text-zinc-300", bg: "bg-zinc-500/10 border-zinc-500/20" },
}

const PROVIDER_OPTIONS: { id: string | null; label: string }[] = [
    { id: null, label: "Não definido" },
    { id: "stripe", label: "Stripe" },
    { id: "viva", label: "Viva" },
    { id: "sibs", label: "SIBS" },
    { id: "stripe_crypto", label: "Stripe Crypto" },
    { id: "onramp", label: "Onramp" },
    { id: "setinel_gate", label: "Sentinel Gate" },
    { id: "approvebly", label: "Approvebly" },
    { id: "simulator", label: "Simulator (teste)" },
]

// MID só faz sentido pro Sentinel Gate.
const MID_PROVIDERS = new Set(["setinel_gate"])

// ─── Formatadores ─────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; className: string; icon: any }> = {
    pending_review: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
    active: { label: "Ativo", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
    suspended: { label: "Suspenso", className: "bg-muted text-muted-foreground", icon: Lock },
}

const RISK_CFG: Record<string, { label: string; color: string; bg: string; icon: any; fees: string }> = {
    WHITE: { label: "White", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Shield, fees: "9.99% + $0.59" },
    GRAY: { label: "Gray", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle, fees: "14.99% + $0.59" },
}

const ALL_METHODS = [
    { id: "credit_card", name: "Cartão de Crédito" },
    { id: "apple_pay", name: "Apple Pay" }, { id: "google_pay", name: "Google Pay" },
    { id: "ideal", name: "iDEAL" }, { id: "bizum", name: "Bizum" },
    { id: "mbway", name: "MB Way" }, { id: "blik", name: "Blik" },
    { id: "ach", name: "ACH" }, { id: "venmo", name: "Venmo" },
    { id: "cash_app", name: "Cash App" }, { id: "zelle", name: "Zelle" },
    { id: "interac_debit", name: "Interac Debit" }, { id: "interac_etransfer", name: "e-Transfer" },
]

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function initials(name: string) {
    return (name ?? "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("")
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export function DashboardView({ stats }: { stats: any }) {
    const cards = [
        { label: "Pendentes", value: stats?.pending ?? 0, color: "text-warning", bg: "bg-warning/10", icon: Clock },
        { label: "Sem gerente", value: stats?.unassigned ?? 0, color: "text-primary", bg: "bg-primary/10", icon: UserPlus },
        { label: "Meus sellers", value: stats?.myAssignments ?? 0, color: "text-blue-400", bg: "bg-blue-500/10", icon: Users },
        { label: "Ativos", value: stats?.active ?? 0, color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
        { label: "Rejeitados", value: stats?.rejected ?? 0, color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
        { label: "Suspensos", value: stats?.suspended ?? 0, color: "text-zinc-400", bg: "bg-zinc-800", icon: Lock },
    ]

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map(c => {
                    const Icon = c.icon
                    return (
                        <div key={c.label} className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{c.label}</p>
                                    <p className={cn("text-3xl font-bold mt-1", c.color)}>{c.value}</p>
                                </div>
                                <div className={cn("flex size-11 items-center justify-center rounded-xl", c.bg)}>
                                    <Icon className={cn("size-5", c.color)} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// SELLERS LIST
// ═══════════════════════════════════════════════════════════════════════════

export function SellersListView({ filter, onSelect }: {
    filter: "pending" | "mine" | "all"
    onSelect: (id: string) => void
}) {
    const [data, setData] = useState<{ data: SellerRow[]; total: number; totalPages: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (search) params.set("search", search)
            if (filter === "pending") params.set("status", "pending_review")
            if (filter === "mine") params.set("assignedToMe", "true")
            const res = await crmFetch<any>(`/sellers?${params}`)
            setData(res)
        } catch (e: any) {
            if (!(e instanceof UnauthorizedError)) {
                setError(e.message ?? "Erro ao carregar sellers")
            }
        } finally { setLoading(false) }
    }, [filter, page, search])

    useEffect(() => { load() }, [load])

    const titles: Record<string, string> = {
        pending: "Pendentes de Revisão",
        mine: "Meus Sellers",
        all: "Todos os Sellers",
    }

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">{titles[filter]}</h1>
                <Button variant="ghost" size="icon" onClick={load} className="text-zinc-400 hover:text-white">
                    <RefreshCw className="size-4" />
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <Input
                    placeholder="Buscar por nome, email, Instagram, WhatsApp..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1) }}
                    className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
                />
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <Button variant="ghost" size="sm" onClick={load} className="h-7 text-xs">Tentar novamente</Button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-900/50 border-b border-zinc-800/50">
                        <tr>
                            {["Seller", "Status", "Risco", "Provider", "Gerente", "Ofertas", "Cadastro", ""].map(h => (
                                <th key={h} className="text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
                            ))
                        ) : (data?.data ?? []).map(seller => {
                            const s = STATUS_CFG[seller.status] ?? STATUS_CFG.pending_review
                            const r = RISK_CFG[seller.risk_level]
                            const SI = s.icon
                            const RI = r?.icon ?? Shield
                            return (
                                <tr key={seller.seller_id}
                                    className="hover:bg-zinc-900/50 cursor-pointer transition-colors group"
                                    onClick={() => onSelect(seller.seller_id)}>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8 rounded-lg shrink-0">
                                                {seller.avatar_url && <AvatarImage src={seller.avatar_url} />}
                                                <AvatarFallback className="rounded-lg bg-zinc-700 text-xs font-bold text-white">
                                                    {initials(seller.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-white">{seller.name}</p>
                                                <p className="text-[11px] text-zinc-500">{seller.instagram || seller.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className={cn("gap-1 text-xs", s.className)}>
                                            <SI className="size-3" />{s.label}
                                        </Badge>
                                    </td>

                                    <td className="px-4 py-3">
                                        {r ? (
                                            <Badge variant="outline" className={cn("gap-1 text-xs", r.bg)}>
                                                <RI className={cn("size-3", r.color)} />
                                                <span className={r.color}>{r.label}</span>
                                            </Badge>
                                        ) : <span className="text-zinc-600">—</span>}
                                    </td>

                                    <td className="px-4 py-3">
                                        {seller.provider_default ? (
                                            <Badge variant="outline" className={cn("text-xs", PROVIDER_CFG[seller.provider_default]?.bg)}>
                                                <span className={PROVIDER_CFG[seller.provider_default]?.color}>
                                                    {PROVIDER_CFG[seller.provider_default]?.label ?? seller.provider_default}
                                                </span>
                                            </Badge>
                                        ) : (
                                            <span className="text-zinc-600 text-xs italic">—</span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        {seller.manager_name
                                            ? <span className="text-zinc-300 text-xs">{seller.manager_name}</span>
                                            : <span className="text-zinc-600 text-xs italic">Sem gerente</span>
                                        }
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className="text-zinc-300 text-xs">
                                            {seller.offers_approved}/{seller.offers_total}
                                            {seller.offers_pending > 0 && <span className="ml-1 text-warning">({seller.offers_pending} pend.)</span>}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 text-zinc-500 text-xs">
                                        {new Date(seller.created_at).toLocaleDateString("pt-BR")}
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
                    <div className="py-16 text-center text-zinc-600">Nenhum seller encontrado</div>
                )}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">Página {page} de {data.totalPages} · {data.total} sellers</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                            className="border-zinc-800 text-zinc-400 hover:text-white">Anterior</Button>
                        <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
                            className="border-zinc-800 text-zinc-400 hover:text-white">Próxima</Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// SELLER DETAIL
// ═══════════════════════════════════════════════════════════════════════════

export function SellerDetailView({ sellerId, onBack }: { sellerId: string; onBack: () => void }) {
    const { manager } = useAuth()
    const [detail, setDetail] = useState<SellerDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState("overview")
    const [providerOpen, setProviderOpen] = useState(false)
    const [midOpen, setMidOpen] = useState(false)

    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [riskOpen, setRiskOpen] = useState(false)
    const [feesOpen, setFeesOpen] = useState(false)
    const [methodsOpen, setMethodsOpen] = useState(false)
    const [contactOpen, setContactOpen] = useState(false)
    const [noteOpen, setNoteOpen] = useState(false)
    const [suspendOpen, setSuspendOpen] = useState(false)
    const [working, setWorking] = useState(false)

    const load = useCallback(async () => {
        setLoading(true)
        setError(null)
        try { setDetail(await crmFetch<SellerDetail>(`/sellers/${sellerId}`)) }
        catch (e: any) {
            if (!(e instanceof UnauthorizedError)) {
                setError(e.message ?? "Erro ao carregar seller")
            }
        }
        finally { setLoading(false) }
    }, [sellerId])

    useEffect(() => { load() }, [load])

    const isAssignedToMe = detail?.seller.manager_id === manager.id
    const isAssigned = !!detail?.seller.manager_id

    const act = async (fn: () => Promise<any>) => {
        setWorking(true)
        try { await fn(); await load() }
        catch (e: any) {
            if (!(e instanceof UnauthorizedError)) alert(e.message)
        }
        finally { setWorking(false) }
    }

    if (loading) return (
        <div className="p-6 space-y-4">
            <div className="h-8 bg-zinc-800 rounded w-64 animate-pulse" />
            <div className="h-48 bg-zinc-800 rounded animate-pulse" />
        </div>
    )

    if (error) return (
        <div className="p-6 space-y-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-zinc-400">
                <ArrowLeft className="size-4" />Voltar
            </Button>
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <Button variant="ghost" size="sm" onClick={load} className="h-7 text-xs">Tentar novamente</Button>
            </div>
        </div>
    )

    if (!detail) return <div className="p-6 text-zinc-500">Seller não encontrado</div>

    const { seller, offers, fees, notes, log, kyc, documents } = detail
    const s = STATUS_CFG[seller.status] ?? STATUS_CFG.pending_review
    const r = RISK_CFG[seller.risk_level]
    const SI = s.icon
    const RI = r?.icon ?? Shield

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-zinc-400 hover:text-white mt-1">
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Avatar className="size-12 rounded-xl">
                            {seller.avatar_url && <AvatarImage src={seller.avatar_url} />}
                            <AvatarFallback className="rounded-xl bg-zinc-700 font-bold text-white">
                                {initials(seller.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-xl font-bold text-white">{seller.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <Badge variant="outline" className={cn("gap-1 text-xs", s.className)}>
                                    <SI className="size-3" />{s.label}
                                </Badge>
                                {r && (
                                    <Badge variant="outline" className={cn("gap-1 text-xs", r.bg)}>
                                        <RI className={cn("size-3", r.color)} /><span className={r.color}>{r.label}</span>
                                    </Badge>
                                )}
                                {seller.manager_id && (
                                    <span className="text-xs text-zinc-500">
                                        Gerente: <span className="text-zinc-300">{seller.manager_name}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                        {!isAssigned && (
                            <Button size="sm" disabled={working} className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                                onClick={() => act(() => crmFetch(`/sellers/${sellerId}/assign`, { method: "POST", body: "{}" }))}>
                                <UserPlus className="size-3.5" />Assumir Seller
                            </Button>
                        )}
                        {isAssignedToMe && (
                            <Button size="sm" variant="outline" disabled={working} className="gap-2 border-zinc-700 text-zinc-400 hover:text-white"
                                onClick={() => act(() => crmFetch(`/sellers/${sellerId}/release`, { method: "POST", body: "{}" }))}>
                                <UserMinus className="size-3.5" />Liberar
                            </Button>
                        )}
                        <Button size="sm" className="gap-2 bg-success/10 text-success hover:bg-success/20 border border-success/20"
                            onClick={() => setContactOpen(true)}>
                            <Phone className="size-3.5" />Registrar Contato
                        </Button>

                        <Button size="sm" variant="outline" className="gap-2 border-zinc-700 text-zinc-400 hover:text-white"
                            onClick={() => setProviderOpen(true)}>
                            <Wallet className="size-3.5" />Alterar Provider
                        </Button>

                        {MID_PROVIDERS.has(seller.provider_default ?? "") && (
                            <Button size="sm" variant="outline" className="gap-2 border-emerald-700/50 text-emerald-400 hover:text-emerald-300"
                                onClick={() => setMidOpen(true)}>
                                <Wallet className="size-3.5" />MID Sentinel
                            </Button>
                        )}

                        {seller.status === "pending_review" && isAssignedToMe && (
                            <>
                                <Button size="sm" className="gap-2" onClick={() => setApproveOpen(true)}>
                                    <CheckCircle2 className="size-3.5" />Aprovar
                                </Button>
                                <Button size="sm" variant="outline" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                                    onClick={() => setRejectOpen(true)}>
                                    <XCircle className="size-3.5" />Rejeitar
                                </Button>
                            </>
                        )}
                        {seller.status === "active" && (
                            <Button size="sm" variant="outline" className="gap-2 border-zinc-700 text-zinc-400"
                                onClick={() => setSuspendOpen(true)}>
                                <Lock className="size-3.5" />Suspender
                            </Button>
                        )}
                        {seller.status === "suspended" && (
                            <Button size="sm" disabled={working} className="gap-2 bg-success/10 text-success border border-success/20"
                                onClick={() => act(() => crmFetch(`/sellers/${sellerId}/activate`, { method: "POST", body: "{}" }))}>
                                <CheckCircle2 className="size-3.5" />Reativar
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white">Visão Geral</TabsTrigger>
                    <TabsTrigger value="kyc" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white">KYC</TabsTrigger>
                    <TabsTrigger value="documents" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white">Documentos</TabsTrigger>
                    <TabsTrigger value="offers" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white">
                        Ofertas {offers.filter(o => o.status === "pending_review").length > 0 && <span className="ml-1 text-warning text-[10px]">●</span>}
                    </TabsTrigger>
                    <TabsTrigger value="fees" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white">Taxas</TabsTrigger>
                    <TabsTrigger value="methods" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white">Métodos</TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white">Notas</TabsTrigger>
                    <TabsTrigger value="log" className="data-[state=active]:bg-zinc-700 text-zinc-400 data-[state=active]:text-white">Histórico</TabsTrigger>
                </TabsList>

                {/* OVERVIEW */}
                <TabsContent value="overview">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5 space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-300">Dados de Contato</h3>
                            {[
                                { label: "Email", value: seller.email },
                                { label: "Instagram", value: seller.instagram },
                                { label: "WhatsApp", value: seller.whatsapp },
                                { label: "Cidade", value: seller.city ? `${seller.city}/${seller.state}` : "—" },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between text-sm">
                                    <span className="text-zinc-500">{row.label}</span>
                                    <span className="text-zinc-200 font-medium">{row.value || "—"}</span>
                                </div>
                            ))}
                            {seller.whatsapp && (
                                <a href={`https://wa.me/${seller.whatsapp.replace(/\D/g, "")}`} target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 mt-3 w-full justify-center rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] py-2 text-sm font-medium hover:bg-[#25D366]/20 transition-colors">
                                    <MessageSquare className="size-4" />Abrir WhatsApp
                                </a>
                            )}
                        </div>

                        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5 space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-300">Resumo da Operação</h3>
                            {[
                                { label: "Status", value: s.label },
                                { label: "Risco", value: r?.label ?? "Não definido" },
                                { label: "Taxas", value: r ? `${r.fees} · D+3` : "—" },
                                { label: "Ofertas", value: `${seller.offers_total} total · ${seller.offers_approved} aprovadas` },
                                { label: "Métodos ativos", value: seller.enabled_methods?.length > 0 ? `${seller.enabled_methods.length} método(s)` : "Nenhum" },
                                { label: "Cadastrado em", value: fmtDate(seller.created_at) },
                                {
                                    label: "Provider",
                                    value: seller.provider_default
                                        ? (PROVIDER_CFG[seller.provider_default]?.label ?? seller.provider_default)
                                        : "Não definido"
                                },
                                ...(MID_PROVIDERS.has(seller.provider_default ?? "")
                                    ? [{ label: "MID Sentinel", value: seller.provider_mid || "Default (env)" }]
                                    : []),
                            ].map(row => (
                                <div key={row.label} className="flex justify-between text-sm">
                                    <span className="text-zinc-500">{row.label}</span>
                                    <span className="text-zinc-200 font-medium">{row.value}</span>
                                </div>
                            ))}
                            {seller.rejection_reason && (
                                <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                                    <span className="font-semibold">Motivo:</span> {seller.rejection_reason}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* KYC */}
                <TabsContent value="kyc">
                    {!kyc ? (
                        <div className="py-12 text-center text-zinc-600">KYC não enviado ainda</div>
                    ) : (
                        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { label: "Nome completo", value: kyc.full_name },
                                    { label: "CPF", value: `•••.${kyc.cpf?.slice(3, 6)}.•••-••` },
                                    { label: "Nascimento", value: kyc.birth_date },
                                    { label: "Status KYC", value: kyc.review_status },
                                    { label: "Rua", value: `${kyc.street}, ${kyc.number}${kyc.complement ? ` - ${kyc.complement}` : ""}` },
                                    { label: "Bairro", value: kyc.neighborhood },
                                    { label: "Cidade/Estado", value: `${kyc.city}/${kyc.state}` },
                                    { label: "CEP", value: kyc.cep },
                                ].map(row => (
                                    <div key={row.label} className="space-y-0.5">
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">{row.label}</p>
                                        <p className="text-sm text-zinc-200 font-medium">{row.value || "—"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* DOCUMENTS */}
                <TabsContent value="documents">
                    {!documents ? (
                        <div className="py-12 text-center text-zinc-600">Documentos não enviados ainda</div>
                    ) : (
                        <div className="space-y-4">
                            {/* Tipo de empresa + status */}
                            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5 flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                                        <Building2 className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Tipo de empresa</p>
                                        <p className="text-sm font-semibold text-white">
                                            {(documents.company_type ?? documents.companyType) === "US"
                                                ? "Empresa Americana (LLC)"
                                                : (documents.company_type ?? documents.companyType) === "BR"
                                                    ? "Empresa Brasileira"
                                                    : "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {(documents.review_status) && (
                                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300 capitalize">
                                            {documents.review_status}
                                        </Badge>
                                    )}
                                    {(documents.submitted_at) && (
                                        <span className="text-xs text-zinc-500">Enviado em {fmtDate(documents.submitted_at)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Documentos da empresa */}
                            <div>
                                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Documentos da empresa</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {(documents.company_type ?? documents.companyType) === "US" ? (
                                        <DocumentCard icon={<FileText className="size-5" />} label="Documento EIN"
                                            url={documents.ein_document_url ?? documents.einDocumentUrl} />
                                    ) : (
                                        <>
                                            <DocumentCard icon={<FileText className="size-5" />} label="Contrato Social"
                                                url={documents.contrato_social_url ?? documents.contratoSocialUrl} />
                                            <DocumentCard icon={<FileText className="size-5" />} label="Cartão CNPJ"
                                                url={documents.cartao_cnpj_url ?? documents.cartaoCnpjUrl} />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Documentos pessoais */}
                            <div>
                                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Documentos pessoais</p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <DocumentCard icon={<IdCard className="size-5" />} label="Documento de identidade (CNH/Passaporte)"
                                        url={documents.identity_document_url ?? documents.identityDocumentUrl} />
                                    <DocumentCard icon={<Home className="size-5" />} label="Comprovante de residência"
                                        url={documents.proof_of_residence_url ?? documents.proofOfResidenceUrl} />
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* OFFERS */}
                <TabsContent value="offers">
                    <div className="space-y-3">
                        {offers.length === 0 && <div className="py-12 text-center text-zinc-600">Nenhuma oferta cadastrada</div>}
                        {offers.map(offer => {
                            const os = offer.status === "approved" ? "text-success" : offer.status === "rejected" ? "text-destructive" : "text-warning"
                            return (
                                <div key={offer.id} className="flex items-center gap-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-white text-sm">{offer.name}</p>
                                            <Badge variant="outline" className={cn("text-[10px]", os)}>
                                                {offer.status === "approved" ? "Aprovada" : offer.status === "rejected" ? "Rejeitada" : "Pendente"}
                                            </Badge>
                                            <Badge variant="outline" className={cn("text-[10px]", RISK_CFG[offer.risk_level]?.color)}>
                                                {offer.risk_level}
                                            </Badge>
                                        </div>
                                        <a href={offer.sales_page_url} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-zinc-500 hover:text-primary flex items-center gap-1 mt-1">
                                            {offer.sales_page_url} <ExternalLink className="size-3" />
                                        </a>
                                        {offer.review_notes && <p className="text-xs text-zinc-500 mt-1 italic">&quot;{offer.review_notes}&quot;</p>}
                                    </div>
                                    {offer.status === "pending_review" && (
                                        <div className="flex gap-2 shrink-0">
                                            <Button size="sm" className="gap-1 bg-success/10 text-success hover:bg-success/20 border border-success/20 h-7 text-xs"
                                                onClick={() => act(() => crmFetch(`/sellers/${sellerId}/offers/${offer.id}/approve`, { method: "POST", body: "{}" }))}>
                                                <CheckCircle2 className="size-3" />Aprovar
                                            </Button>
                                            <Button size="sm" variant="outline" className="gap-1 border-destructive/30 text-destructive h-7 text-xs"
                                                onClick={async () => {
                                                    const reason = prompt("Motivo da rejeição:")
                                                    if (reason) await act(() => crmFetch(`/sellers/${sellerId}/offers/${offer.id}/reject`, {
                                                        method: "POST", body: JSON.stringify({ reason }),
                                                    }))
                                                }}>
                                                <XCircle className="size-3" />Rejeitar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </TabsContent>

                {/* FEES */}
                <TabsContent value="fees">
                    <div className="space-y-4">
                        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-zinc-300">Nível de Risco</h3>
                                <Button size="sm" variant="outline" className="gap-2 border-zinc-700 text-zinc-400 h-7 text-xs"
                                    onClick={() => setRiskOpen(true)}>
                                    <Edit3 className="size-3" />Alterar Risco
                                </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {["WHITE", "GRAY"].map(level => {
                                    const rc = RISK_CFG[level]
                                    const RCI = rc.icon
                                    const active = seller.risk_level === level
                                    return (
                                        <div key={level} className={cn("rounded-lg border p-3 transition-all",
                                            active ? cn(rc.bg, "ring-1 ring-current") : "border-zinc-800 opacity-40"
                                        )}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <RCI className={cn("size-4", rc.color)} />
                                                <span className={cn("font-semibold text-sm", rc.color)}>{rc.label}</span>
                                                {active && <CheckCircle2 className="size-3.5 text-primary ml-auto" />}
                                            </div>
                                            <p className="text-xs text-zinc-400">{rc.fees}</p>
                                            <p className="text-[10px] text-zinc-500 mt-1">D+3 · {level === "WHITE" ? "Reserva 5%" : "Sem reserva"}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {fees && (
                            <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-zinc-300">Taxas Configuradas</h3>
                                    <Button size="sm" variant="outline" className="gap-2 border-zinc-700 text-zinc-400 h-7 text-xs"
                                        onClick={() => setFeesOpen(true)}>
                                        <Edit3 className="size-3" />Override Manual
                                    </Button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    {[
                                        { label: "Taxa %", value: `${fees.fee_percentage}%` },
                                        { label: "Taxa Fixa", value: `$${fees.fee_fixed_usd}` },
                                        { label: "Liquidação", value: `D+${fees.settlement_days}` },
                                        { label: "Reserva", value: `${fees.reserve_percentage}%` },
                                        { label: "Período Reserva", value: `${fees.reserve_hold_days}d` },
                                        { label: "Antecipação D+0", value: `${fees.anticipation_fee_pct}%` },
                                    ].map(row => (
                                        <div key={row.label} className="rounded-lg bg-zinc-800/50 p-3">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{row.label}</p>
                                            <p className="text-sm font-bold text-white mt-1">{row.value}</p>
                                        </div>
                                    ))}
                                </div>
                                {fees.override_notes && (
                                    <p className="text-xs text-zinc-500 mt-3 italic">Override: &quot;{fees.override_notes}&quot;</p>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* METHODS */}
                <TabsContent value="methods">
                    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-zinc-300">Métodos Ativos</h3>
                            <Button size="sm" variant="outline" className="gap-2 border-zinc-700 text-zinc-400 h-7 text-xs"
                                onClick={() => setMethodsOpen(true)}>
                                <Edit3 className="size-3" />Editar Métodos
                            </Button>
                        </div>
                        {seller.enabled_methods?.length === 0 ? (
                            <p className="text-zinc-600 text-sm">Nenhum método ativo.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {seller.enabled_methods?.map(m => {
                                    const cfg = ALL_METHODS.find(am => am.id === m)
                                    return (
                                        <Badge key={m} variant="outline" className="bg-success/5 text-success border-success/20 text-xs">
                                            <CheckCircle2 className="size-3 mr-1" />{cfg?.name ?? m}
                                        </Badge>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* NOTES */}
                <TabsContent value="notes">
                    <div className="space-y-3">
                        <Button size="sm" className="gap-2 w-full" onClick={() => setNoteOpen(true)}>
                            <Plus className="size-4" />Adicionar Nota
                        </Button>
                        {notes.length === 0 && <div className="py-8 text-center text-zinc-600 text-sm">Nenhuma nota ainda</div>}
                        {notes.map(note => (
                            <div key={note.id} className={cn("rounded-xl border p-4",
                                note.is_pinned ? "border-primary/30 bg-primary/5" : "border-zinc-800/50 bg-zinc-900/30"
                            )}>
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm text-zinc-200 flex-1">{note.content}</p>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {note.is_pinned && <Pin className="size-3.5 text-primary" />}
                                        {note.manager_id === manager.id && (
                                            <button onClick={() => act(() => crmFetch(`/notes/${note.id}`, { method: "DELETE" }))}
                                                className="text-zinc-600 hover:text-destructive transition-colors">
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-[11px] text-zinc-600">{note.crm_managers?.name ?? "—"}</p>
                                    <span className="text-zinc-700">·</span>
                                    <p className="text-[11px] text-zinc-600">{fmtDate(note.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>

                {/* LOG */}
                <TabsContent value="log">
                    <div className="space-y-2">
                        {log.length === 0 && <div className="py-8 text-center text-zinc-600 text-sm">Nenhuma ação registrada</div>}
                        {log.map(entry => (
                            <div key={entry.id} className="flex gap-3 rounded-xl border border-zinc-800/30 bg-zinc-900/20 p-3">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 mt-0.5">
                                    <Activity className="size-3.5 text-zinc-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-zinc-200">{entry.action.replace(/_/g, " ")}</p>
                                        <span className="text-[10px] text-zinc-600">{fmtDate(entry.created_at)}</span>
                                    </div>
                                    {entry.crm_managers?.name && <p className="text-xs text-zinc-500">por {entry.crm_managers.name}</p>}
                                    {entry.payload?.notes && <p className="text-xs text-zinc-500 italic mt-1">&quot;{entry.payload.notes}&quot;</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <ApproveDialog open={approveOpen} onOpenChange={setApproveOpen}
                currentRisk={seller.risk_level} enabledMethods={seller.enabled_methods ?? []}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/approve`, { method: "POST", body: JSON.stringify(dto) }))} />

            <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/reject`, { method: "POST", body: JSON.stringify(dto) }))} />

            <RiskDialog open={riskOpen} onOpenChange={setRiskOpen} current={seller.risk_level}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/risk`, { method: "PATCH", body: JSON.stringify(dto) }))} />

            <FeesOverrideDialog open={feesOpen} onOpenChange={setFeesOpen} fees={fees}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/fees`, { method: "PATCH", body: JSON.stringify(dto) }))} />

            <MethodsDialog open={methodsOpen} onOpenChange={setMethodsOpen} active={seller.enabled_methods ?? []}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/methods`, { method: "PATCH", body: JSON.stringify(dto) }))} />

            <ContactDialog open={contactOpen} onOpenChange={setContactOpen}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/contact`, { method: "POST", body: JSON.stringify(dto) }))} />

            <NoteDialog open={noteOpen} onOpenChange={setNoteOpen}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/notes`, { method: "POST", body: JSON.stringify(dto) }))} />

            <SuspendDialog open={suspendOpen} onOpenChange={setSuspendOpen}
                onConfirm={(dto: any) =>
                    act(() => crmFetch(`/sellers/${sellerId}/suspend`, {
                        method: "POST", body: JSON.stringify(dto),
                    }))
                } />

            <ProviderDialog
                open={providerOpen}
                onOpenChange={setProviderOpen}
                current={seller.provider_default ?? null}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/provider`, {
                    method: "PATCH", body: JSON.stringify(dto),
                }))}
            />

            <MidDialog
                open={midOpen}
                onOpenChange={setMidOpen}
                current={seller.provider_mid ?? null}
                onConfirm={(dto: any) => act(() => crmFetch(`/sellers/${sellerId}/mid`, {
                    method: "PATCH", body: JSON.stringify(dto),
                }))}
            />
        </div>
    )
}

// ─── Card de documento (privado) ───────────────────────────────────────────

function DocumentCard({ icon, label, url }: { icon: React.ReactNode; label: string; url?: string | null }) {
    return (
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 flex items-center gap-3">
            <div className={cn("flex size-10 items-center justify-center rounded-lg shrink-0",
                url ? "bg-primary/10 text-primary" : "bg-zinc-800 text-zinc-500")}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{label}</p>
                {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                        <Eye className="size-3" />Ver documento
                    </a>
                ) : (
                    <p className="text-xs text-zinc-600 italic mt-0.5">Não enviado</p>
                )}
            </div>
            {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" download
                    className="text-zinc-500 hover:text-white transition-colors shrink-0">
                    <Download className="size-4" />
                </a>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// MANAGERS VIEW (supervisor/admin)
// ═══════════════════════════════════════════════════════════════════════════

export function ManagersView() {
    const [managers, setManagers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [addOpen, setAddOpen] = useState(false)
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" })
    const [saving, setSaving] = useState(false)

    const load = async () => {
        setLoading(true)
        setError(null)
        try { setManagers(await crmFetch<any[]>("/managers")) }
        catch (e: any) {
            if (!(e instanceof UnauthorizedError)) {
                setError(e.message ?? "Erro ao carregar gerentes")
            }
        }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const create = async () => {
        setSaving(true)
        try {
            await crmFetch("/managers", { method: "POST", body: JSON.stringify(form) })
            await load(); setAddOpen(false)
            setForm({ name: "", email: "", password: "", role: "manager" })
        } catch (e: any) {
            if (!(e instanceof UnauthorizedError)) alert(e.message)
        }
        finally { setSaving(false) }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">Gerentes</h1>
                <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
                    <Plus className="size-4" />Novo Gerente
                </Button>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <Button variant="ghost" size="sm" onClick={load} className="h-7 text-xs">Tentar novamente</Button>
                </div>
            )}

            {loading ? (
                <div className="grid gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 bg-zinc-900/30 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3">
                    {managers.map(m => (
                        <div key={m.id} className="flex items-center gap-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4">
                            <Avatar className="size-10 rounded-xl">
                                <AvatarFallback className="rounded-xl bg-zinc-700 font-bold text-white">{initials(m.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-medium text-white">{m.name}</p>
                                <p className="text-sm text-zinc-500">{m.email}</p>
                            </div>
                            <Badge variant="outline" className={cn("capitalize text-xs",
                                m.role === "admin" ? "border-primary/30 text-primary" :
                                    m.role === "supervisor" ? "border-amber-500/30 text-amber-400" :
                                        "border-zinc-700 text-zinc-400"
                            )}>{m.role}</Badge>
                            <div className={cn("size-2 rounded-full", m.is_active ? "bg-success" : "bg-zinc-600")} />
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                    <DialogHeader><DialogTitle className="text-white">Novo Gerente</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                        {["name", "email", "password"].map(f => (
                            <div key={f} className="space-y-1.5">
                                <Label className="text-zinc-400 text-xs capitalize">{f === "name" ? "Nome" : f === "email" ? "Email" : "Senha"}</Label>
                                <Input type={f === "password" ? "password" : "text"}
                                    value={(form as any)[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                                    className="bg-zinc-900 border-zinc-800 text-white" />
                            </div>
                        ))}
                        <div className="space-y-1.5">
                            <Label className="text-zinc-400 text-xs">Função</Label>
                            <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="manager">Gerente</SelectItem>
                                    <SelectItem value="supervisor">Supervisor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => setAddOpen(false)}>Cancelar</Button>
                        <Button disabled={saving} onClick={create}>Criar Gerente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// DIALOGS (privados — não exportados)
// ═══════════════════════════════════════════════════════════════════════════

function ApproveDialog({ open, onOpenChange, currentRisk, enabledMethods, onConfirm }: any) {
    const [risk, setRisk] = useState<string>(currentRisk ?? "WHITE")
    const [methods, setMethods] = useState<string[]>(enabledMethods ?? [])
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    const toggle = (id: string) => setMethods(p => p.includes(id) ? p.filter(m => m !== id) : [...p, id])

    const submit = async () => {
        if (!methods.length) { alert("Selecione ao menos um método"); return }
        setLoading(true)
        try { await onConfirm({ riskLevel: risk, enabledMethods: methods, notes }); onOpenChange(false) }
        catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <CheckCircle2 className="size-5 text-success" />Aprovar Seller
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Defina o nível de risco, as taxas serão aplicadas automaticamente, e quais métodos ficam ativos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="space-y-3">
                        <Label className="text-zinc-300">Nível de Risco</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {["WHITE", "GRAY"].map(level => {
                                const rc = RISK_CFG[level]; const RCI = rc.icon
                                return (
                                    <button key={level} type="button" onClick={() => setRisk(level)}
                                        className={cn("rounded-lg border-2 p-3 text-left transition-all",
                                            risk === level ? cn(rc.bg, "ring-1 ring-primary") : "border-zinc-800 hover:border-zinc-600"
                                        )}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <RCI className={cn("size-4", rc.color)} />
                                            <span className={cn("font-semibold text-sm", rc.color)}>{rc.label}</span>
                                        </div>
                                        <p className="text-[10px] text-zinc-500">{rc.fees}</p>
                                        <p className="text-[10px] text-zinc-600">{level === "WHITE" ? "Reserva 5%" : "Sem reserva"}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-zinc-300">Métodos a Ativar ({methods.length} selecionados)</Label>
                        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                            {ALL_METHODS.map(m => {
                                const on = methods.includes(m.id)
                                return (
                                    <button key={m.id} type="button" onClick={() => toggle(m.id)}
                                        className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-left transition-all",
                                            on ? "border-primary/40 bg-primary/10 text-primary" : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                                        )}>
                                        {on ? <CheckCircle2 className="size-3 shrink-0" /> : <div className="size-3 rounded-full border border-zinc-600 shrink-0" />}
                                        {m.name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Notas internas (opcional)</Label>
                        <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={2}
                            placeholder="Observações sobre a aprovação..." />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading || !methods.length} onClick={submit} className="gap-2 bg-success hover:bg-success/90">
                        {loading ? <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <CheckCircle2 className="size-4" />}
                        Aprovar Seller
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function RejectDialog({ open, onOpenChange, onConfirm }: any) {
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!reason.trim()) { alert("Informe o motivo"); return }
        setLoading(true)
        try { await onConfirm({ reason }); onOpenChange(false); setReason("") }
        catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2"><XCircle className="size-5 text-destructive" />Rejeitar Seller</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Label className="text-zinc-300">Motivo da rejeição</Label>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={4}
                        placeholder="Descreva o motivo para o seller..." />
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading || !reason.trim()} onClick={submit} className="gap-2 bg-destructive hover:bg-destructive/90">
                        <XCircle className="size-4" />Rejeitar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function RiskDialog({ open, onOpenChange, current, onConfirm }: any) {
    const [risk, setRisk] = useState(current)
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        setLoading(true)
        try { await onConfirm({ riskLevel: risk, reason }); onOpenChange(false); setReason("") }
        catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader><DialogTitle className="text-white">Alterar Nível de Risco</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {["WHITE", "GRAY"].map(level => {
                            const rc = RISK_CFG[level]; const RCI = rc.icon
                            return (
                                <button key={level} type="button" onClick={() => setRisk(level)}
                                    className={cn("rounded-lg border-2 p-3 text-center transition-all",
                                        risk === level ? cn(rc.bg, "ring-1 ring-primary") : "border-zinc-800 hover:border-zinc-600"
                                    )}>
                                    <RCI className={cn("size-5 mx-auto mb-1", rc.color)} />
                                    <p className={cn("text-sm font-semibold", rc.color)}>{rc.label}</p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">{rc.fees}</p>
                                </button>
                            )
                        })}
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning flex gap-2">
                        <AlertTriangle className="size-4 shrink-0" />
                        Alterar o risco atualizará as taxas automaticamente para o padrão do novo nível.
                    </div>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={2}
                        placeholder="Motivo da alteração..." />
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading} onClick={submit}>Confirmar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function FeesOverrideDialog({ open, onOpenChange, fees, onConfirm }: any) {
    const [form, setForm] = useState({
        fee_percentage: fees?.fee_percentage,
        fee_fixed_usd: fees?.fee_fixed_usd,
        settlement_days: fees?.settlement_days,
        reserve_percentage: fees?.reserve_percentage,
        anticipation_fee_pct: fees?.anticipation_fee_pct,
        notes: "",
    })
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        setLoading(true)
        try { await onConfirm(form); onOpenChange(false) }
        catch { } finally { setLoading(false) }
    }

    const fields = [
        { key: "fee_percentage", label: "Taxa %", suffix: "%" },
        { key: "fee_fixed_usd", label: "Taxa Fixa", suffix: "USD" },
        { key: "settlement_days", label: "Liquidação", suffix: "dias" },
        { key: "reserve_percentage", label: "Reserva", suffix: "%" },
        { key: "anticipation_fee_pct", label: "Antecipação D+0", suffix: "%" },
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white">Override Manual de Taxas</DialogTitle>
                    <DialogDescription className="text-zinc-500">Ajuste individual das taxas para este seller.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {fields.map(f => (
                        <div key={f.key} className="flex items-center gap-3">
                            <Label className="text-zinc-400 text-xs w-36 shrink-0">{f.label}</Label>
                            <div className="flex items-center gap-2 flex-1">
                                <Input type="number" value={(form as any)[f.key]} step="0.01"
                                    onChange={e => setForm(p => ({ ...p, [f.key]: parseFloat(e.target.value) }))}
                                    className="bg-zinc-900 border-zinc-800 text-white h-9" />
                                <span className="text-xs text-zinc-500 w-8">{f.suffix}</span>
                            </div>
                        </div>
                    ))}
                    <Textarea placeholder="Motivo do override (obrigatório)" value={form.notes}
                        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={2} />
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading || !form.notes.trim()} onClick={submit}>Salvar Taxas</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MethodsDialog({ open, onOpenChange, active, onConfirm }: any) {
    const [methods, setMethods] = useState<string[]>(active)
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const toggle = (id: string) => setMethods(p => p.includes(id) ? p.filter(m => m !== id) : [...p, id])

    const submit = async () => {
        setLoading(true)
        try { await onConfirm({ enabledMethods: methods, notes }); onOpenChange(false) }
        catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-white">Editar Métodos Ativos</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-1.5">
                        {ALL_METHODS.map(m => {
                            const on = methods.includes(m.id)
                            return (
                                <button key={m.id} type="button" onClick={() => toggle(m.id)}
                                    className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-left transition-all",
                                        on ? "border-primary/40 bg-primary/10 text-primary" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                                    )}>
                                    {on ? <CheckCircle2 className="size-3 shrink-0" /> : <div className="size-3 rounded-full border border-zinc-700 shrink-0" />}
                                    {m.name}
                                </button>
                            )
                        })}
                    </div>
                    <Textarea placeholder="Observações (opcional)" value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={2} />
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading} onClick={submit}>Salvar Métodos</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ContactDialog({ open, onOpenChange, onConfirm }: any) {
    const [type, setType] = useState("whatsapp")
    const [notes, setNotes] = useState("")
    const [outcome, setOutcome] = useState("in_progress")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        setLoading(true)
        try { await onConfirm({ type, notes, outcome }); onOpenChange(false); setNotes("") }
        catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader><DialogTitle className="text-white">Registrar Contato</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                            { id: "call", label: "Ligação", icon: Phone },
                            { id: "email", label: "Email", icon: Mail },
                            { id: "meeting", label: "Reunião", icon: Users },
                        ].map(t => {
                            const TI = t.icon
                            return (
                                <button key={t.id} type="button" onClick={() => setType(t.id)}
                                    className={cn("flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                                        type === t.id ? "border-primary bg-primary/10 text-primary" : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                                    )}>
                                    <TI className="size-4" />{t.label}
                                </button>
                            )
                        })}
                    </div>
                    <div>
                        <Label className="text-zinc-400 text-xs mb-2">Resultado</Label>
                        <Select value={outcome} onValueChange={setOutcome}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                                <SelectItem value="no_answer">Sem resposta</SelectItem>
                                <SelectItem value="in_progress">Em andamento</SelectItem>
                                <SelectItem value="scheduled">Agendado</SelectItem>
                                <SelectItem value="completed">Concluído</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Textarea placeholder="Notas do contato..." value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={3} />
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading || !notes.trim()} onClick={submit} className="gap-2">
                        <Send className="size-4" />Registrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function NoteDialog({ open, onOpenChange, onConfirm }: any) {
    const [content, setContent] = useState("")
    const [isPinned, setIsPinned] = useState(false)
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        setLoading(true)
        try { await onConfirm({ content, isPinned }); onOpenChange(false); setContent(""); setIsPinned(false) }
        catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader><DialogTitle className="text-white">Adicionar Nota</DialogTitle></DialogHeader>
                <div className="space-y-4">
                    <Textarea placeholder="Nota sobre o seller..." value={content}
                        onChange={e => setContent(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={4} />
                    <div className="flex items-center gap-2">
                        <Switch checked={isPinned} onCheckedChange={setIsPinned} />
                        <Label className="text-zinc-400 text-sm">Fixar nota</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading || !content.trim()} onClick={submit}>Salvar Nota</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SuspendDialog({ open, onOpenChange, onConfirm }: any) {
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        setLoading(true)
        try { await onConfirm({ reason }); onOpenChange(false); setReason("") }
        catch { } finally { setLoading(false) }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2"><Lock className="size-5 text-warning" />Suspender Seller</DialogTitle>
                </DialogHeader>
                <Textarea placeholder="Motivo da suspensão..." value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={3} />
                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button disabled={loading || !reason.trim()} onClick={submit}
                        className="bg-warning hover:bg-warning/90 text-black">Suspender</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ProviderDialog({ open, onOpenChange, current, onConfirm }: any) {
    const [provider, setProvider] = useState<string | null>(current ?? null)
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => { setProvider(current ?? null) }, [current, open])

    const submit = async () => {
        setLoading(true)
        try {
            await onConfirm({ provider, notes: notes.trim() || undefined })
            onOpenChange(false)
            setNotes("")
        } catch { } finally { setLoading(false) }
    }

    const changed = provider !== (current ?? null)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Wallet className="size-5 text-primary" />Alterar Provider
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Define qual gateway será usado por padrão nas transações deste seller.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        {PROVIDER_OPTIONS.map(opt => {
                            const active = provider === opt.id
                            const cfg = opt.id ? PROVIDER_CFG[opt.id] : null
                            return (
                                <button key={String(opt.id)} type="button" onClick={() => setProvider(opt.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                                        active
                                            ? cfg
                                                ? cn(cfg.bg, "ring-1 ring-primary")
                                                : "border-primary bg-primary/10"
                                            : "border-zinc-800 hover:border-zinc-600"
                                    )}>
                                    <div className={cn(
                                        "size-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                        active ? "border-primary" : "border-zinc-600"
                                    )}>
                                        {active && <div className="size-2 rounded-full bg-primary" />}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        active && cfg ? cfg.color : active ? "text-primary" : "text-zinc-300"
                                    )}>
                                        {opt.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <Textarea placeholder="Motivo da alteração (opcional)" value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={2} />
                </div>

                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button disabled={loading || !changed} onClick={submit}>
                        {loading ? "Salvando..." : "Salvar Provider"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MidDialog({ open, onOpenChange, current, onConfirm }: any) {
    const [mids, setMids] = useState<{ mid: string; label?: string | null; status?: string }[]>([])
    const [mid, setMid] = useState<string | null>(current ?? null)
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    useEffect(() => { setMid(current ?? null) }, [current, open])

    useEffect(() => {
        if (!open) return
        setFetching(true)
        crmFetch<any[]>(`/sentinel-mids`)
            .then(rows => setMids(rows ?? []))
            .catch(() => setMids([]))
            .finally(() => setFetching(false))
    }, [open])

    const submit = async () => {
        setLoading(true)
        try {
            await onConfirm({ mid, notes: notes.trim() || undefined })
            onOpenChange(false)
            setNotes("")
        } catch { } finally { setLoading(false) }
    }

    const changed = mid !== (current ?? null)
    const options: { mid: string | null; label: string }[] = [
        { mid: null, label: "Default (env)" },
        ...mids
            .filter(m => m.status !== "inactive")
            .map(m => ({ mid: m.mid, label: m.label ? `${m.label} · ${m.mid}` : m.mid })),
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <Wallet className="size-5 text-emerald-400" />MID Sentinel
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Define qual MID do Sentinel (e suas credenciais) este seller usa.
                        &quot;Default&quot; usa as credenciais do ambiente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {fetching ? (
                        <p className="text-sm text-zinc-500">Carregando MIDs…</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-auto">
                            {options.map(opt => {
                                const active = mid === opt.mid
                                return (
                                    <button key={String(opt.mid)} type="button" onClick={() => setMid(opt.mid)}
                                        className={cn(
                                            "w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                                            active ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 hover:border-zinc-600"
                                        )}>
                                        <div className={cn(
                                            "size-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                            active ? "border-emerald-500" : "border-zinc-600"
                                        )}>
                                            {active && <div className="size-2 rounded-full bg-emerald-500" />}
                                        </div>
                                        <span className={cn("text-sm font-medium", active ? "text-emerald-400" : "text-zinc-300")}>
                                            {opt.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    <Textarea placeholder="Motivo da alteração (opcional)" value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-white resize-none" rows={2} />
                </div>

                <DialogFooter>
                    <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button disabled={loading || !changed} onClick={submit}>
                        {loading ? "Salvando..." : "Salvar MID"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}