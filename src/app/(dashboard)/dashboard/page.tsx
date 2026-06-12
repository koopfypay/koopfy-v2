"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  ArrowUpRight, ArrowDownRight, Bell, Globe, RefreshCw,
  Search, TrendingUp, Wallet, ShieldCheck, Zap, ArrowRight,
  Clock, Crown, Medal, Star, Trophy, CreditCard,
  Activity, BarChart3,
} from "lucide-react"
import {
  Bar, BarChart, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { WorldMap } from "@/components/dashboard/world-map"
import { useDashboard } from "@/hooks"
import { TopPlayer } from "@/types/api.types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Period = "today" | "yesterday" | "7d" | "30d" | "90d"


// ─── Formatadores ─────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value).replace("US$", "US$ ")
}

function fmtNum(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value)
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
}

const PERIOD_COMPARE: Record<Period, string> = {
  today: "vs ontem",
  yesterday: "vs anteontem",
  "7d": "vs 7 dias anteriores",
  "30d": "vs 30 dias anteriores",
  "90d": "vs 90 dias anteriores",
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  title, icon: Icon, value, formattedValue, change, isPositive, period,
}: {
  title: string
  icon: React.ElementType
  value: number
  formattedValue: string
  change: number
  isPositive: boolean
  period: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!value) return
    const steps = 60, duration = 1500
    const step = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  const animatedFormatted = formattedValue.startsWith("US$")
    ? fmt(display)
    : formattedValue.endsWith("%")
      ? `${display.toFixed(1)}%`
      : fmtNum(display)

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm transition-all duration-500 border-primary/15 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 card-hover shine-effect">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute top-0 right-0 size-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
      <CardContent className="relative px-5 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
              <Icon className="size-4 text-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
          </div>
          <p className="text-[1.6rem] font-bold tracking-tight text-foreground tabular-nums">{animatedFormatted}</p>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}>
              {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(change)}%
            </div>
            <span className="text-[11px] text-muted-foreground">{period}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="border-border/50 bg-gradient-to-br from-card via-card to-card/80">
          <CardContent className="px-5 py-5 space-y-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PaymentMethodIcon({ type }: { type: string }) {
  switch (type) {
    case "visa":
      return (
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1f71] to-[#0d1354] ring-1 ring-white/10">
          <span className="text-[9px] font-bold text-white tracking-tight italic">VISA</span>
        </div>
      )
    case "mastercard":
      return (
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] ring-1 ring-white/10">
          <div className="flex -space-x-1.5">
            <div className="size-4 rounded-full bg-[#eb001b]" />
            <div className="size-4 rounded-full bg-[#f79e1b] opacity-90" />
          </div>
        </div>
      )
    case "pix":
      return (
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#32bcad] to-[#1a9e8f] ring-1 ring-white/10">
          <svg viewBox="0 0 24 24" className="size-5 fill-white">
            <path d="M17.66 10.84l-2.12-2.12a1 1 0 00-1.41 0l-2.12 2.12a1 1 0 000 1.41l2.12 2.12a1 1 0 001.41 0l2.12-2.12a1 1 0 000-1.41zM6.34 13.16l2.12 2.12a1 1 0 001.41 0l2.12-2.12a1 1 0 000-1.41l-2.12-2.12a1 1 0 00-1.41 0l-2.12 2.12a1 1 0 000 1.41z" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 ring-1 ring-primary/30">
          <RefreshCw className="size-4 text-primary" />
        </div>
      )
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    approved: { label: "Aprovado", className: "bg-primary/15 text-primary border-primary/30" },
    completed: { label: "Concluído", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    pending: { label: "Em análise", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  }
  const s = map[status] ?? map.pending
  return (
    <Badge variant="outline" className={`${s.className} text-[10px] font-semibold px-2 py-0.5 border rounded-md`}>
      {s.label}
    </Badge>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="relative flex size-8 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 animate-pulse opacity-50" />
      <div className="relative flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 shadow-lg shadow-amber-500/30">
        <Crown className="size-3.5 text-amber-900" />
      </div>
    </div>
  )
  if (rank === 2) return (
    <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 via-slate-200 to-slate-400 shadow-md">
      <Medal className="size-3.5 text-slate-700" />
    </div>
  )
  if (rank === 3) return (
    <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700 shadow-md">
      <Medal className="size-3.5 text-amber-900" />
    </div>
  )
  return (
    <div className="flex size-7 items-center justify-center rounded-full bg-muted/50 border border-border/50">
      <span className="text-xs font-bold text-muted-foreground">{rank}</span>
    </div>
  )
}

function PlayerBadge({ badge }: { badge: string }) {
  switch (badge) {
    case "diamond":
      return (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
          <svg viewBox="0 0 24 24" className="size-3 fill-cyan-400"><path d="M12 2L2 9l10 13 10-13-10-7zM5.5 8.5L12 4.5l6.5 4L12 19 5.5 8.5z" /></svg>
          <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wide">Diamond</span>
        </div>
      )
    case "gold":
      return (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wide">Gold</span>
        </div>
      )
    case "silver":
      return (
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-400/10 border border-slate-400/20">
          <Star className="size-3 fill-slate-400 text-slate-400" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Silver</span>
        </div>
      )
    default: return null
  }
}

const FLAGS: Record<string, string> = {
  BR: "🇧🇷", US: "🇺🇸", UK: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", PT: "🇵🇹",
}

function EmptyActivity() {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted/50">
        <Activity className="size-5 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">Nenhuma atividade recente</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">As transações aparecerão aqui</p>
      </div>
    </div>
  )
}

function EmptyVolumeChart() {
  const emptyData = Array.from({ length: 30 }, (_, i) => ({ day: String(i + 1).padStart(2, "0"), volume: 0 }))
  return (
    <div className="relative h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={emptyData} barCategoryGap="20%">
          <defs>
            <linearGradient id="barGradEmpty" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} interval={4} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={() => "0"} width={40} />
          <Bar dataKey="volume" fill="url(#barGradEmpty)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50">
            <BarChart3 className="size-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Sem dados para o período</p>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("30d")
  const [methodView, setMethodView] = useState<"percent" | "abs">("percent")
  const [topPeriod, setTopPeriod] = useState<"daily" | "monthly">("monthly")

  // 🔥 Passa o período direto para o hook — backend agora aceita today/yesterday
  const { data, isLoading, error, mutate } = useDashboard(period)

  const kpis = data?.kpis
  const isDay = period === "today" || period === "yesterday"

  const sourcePlayers =
    topPeriod === 'daily'
      ? data?.topPlayers?.dailyTop
      : data?.topPlayers?.monthlyTop;

  const sortedPlayers = sourcePlayers
    ? [...sourcePlayers].sort((a, b) =>
      topPeriod === 'daily'
        ? (b.volume ?? 0) - (a.volume ?? 0)
        : (b.volume ?? 0) - (a.volume ?? 0),
    )
    : [];

  const playersToShow: (TopPlayer & {
    isEmpty?: boolean;
  })[] =
    sortedPlayers.length > 0
      ? sortedPlayers.slice(0, 7)
      : Array.from({ length: 7 }, (_, i) => ({
        sellerId: `empty-${i}`,

        rank: i + 1,

        name: '—',

        avatar: '',

        avatarUrl: null,

        instagram: null,

        volume: 0,

        transactions: 0,

        growth: 0,

        badge:
          i === 0
            ? 'diamond'
            : i < 3
              ? 'gold'
              : 'silver',

        country: 'BR',

        isEmpty: true,
      }));

  return (
    <div className="min-h-screen noise-overlay">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
              {/* 🔥 Badge "Ao vivo" só aparece em hoje */}
              {period === "today" && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-semibold gap-1.5 px-2 hidden sm:flex">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  Ao vivo
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Visão geral do seu gateway global</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transações, usuários, locais..."
                className="w-80 border-border/50 bg-muted/30 pl-10 h-10 text-sm rounded-xl focus-visible:ring-primary/30 focus-visible:border-primary/50"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative size-10 rounded-xl hover:bg-accent" onClick={() => mutate()}>
              <RefreshCw className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="relative size-10 rounded-xl hover:bg-accent">
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary ring-2 ring-background" />
              </span>
            </Button>

            {/* 🔥 Seletor — bolinha verde só em "Hoje" */}
            <Select value={period} onValueChange={v => setPeriod(v as Period)}>
              <SelectTrigger className="w-36 h-10 border-border/50 bg-muted/30 rounded-xl gap-2">
                <Globe className="size-4 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">
                  <div className="flex items-center gap-2">
                    {/* 🔥 bolinha só aparece quando "today" está selecionado */}
                    <span className={`size-1.5 rounded-full bg-primary transition-opacity ${period === "today" ? "opacity-100 animate-pulse" : "opacity-0"}`} />
                    Hoje
                  </div>
                </SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 🔥 Tabs rápidas de período */}
        <div className="px-6 pb-3 flex items-center gap-1">
          {(["today", "yesterday", "7d", "30d", "90d"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${period === p
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
            >
              {/* 🔥 bolinha só na tab "Hoje" quando está selecionada */}
              {p === "today" && period === "today" && (
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              )}
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 space-y-6">

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        {isLoading ? <KPISkeleton /> : error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex items-center justify-between">
            <span>Erro ao carregar dados.</span>
            <Button variant="link" className="p-0 h-auto text-destructive" onClick={() => mutate()}>Tentar novamente</Button>
          </div>
        ) : data && kpis && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              title="Volume Total" icon={TrendingUp}
              value={kpis.volume.value}
              formattedValue={fmt(kpis.volume.value)}
              change={kpis.volume.change} isPositive={kpis.volume.isPositive}
              period={PERIOD_COMPARE[period]}
            />
            <KPICard
              title="Transações" icon={Zap}
              value={kpis.transactions.value}
              formattedValue={fmtNum(kpis.transactions.value)}
              change={kpis.transactions.change} isPositive={kpis.transactions.isPositive}
              period={PERIOD_COMPARE[period]}
            />
            <KPICard
              title="Taxa Aprovação" icon={ShieldCheck}
              value={kpis.approvalRate.value}
              formattedValue={`${kpis.approvalRate.value}%`}
              change={kpis.approvalRate.change} isPositive={kpis.approvalRate.isPositive}
              period={PERIOD_COMPARE[period]}
            />
            <KPICard
              title={
                period === "today" ? "Liquidado Hoje" :
                  period === "yesterday" ? "Liquidado Ontem" : "Liquidado"
              }
              icon={Wallet}
              value={kpis.settled.value}
              formattedValue={fmt(kpis.settled.value)}
              change={kpis.settled.change} isPositive={kpis.settled.isPositive}
              period={PERIOD_COMPARE[period]}
            />
          </div>
        )}

        {/* ── Globe + Coluna lateral ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-6">
          <Card className="xl:col-span-4 border-border/50 bg-card/50 overflow-hidden backdrop-blur-sm border-primary/15">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/30">
              <div>
                <CardTitle className="text-base font-bold">Operação Global</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Pagamentos em tempo real, sem fronteiras</p>
              </div>
            </CardHeader>
            <CardContent className="relative h-[600px]">
              <WorldMap />
            </CardContent>
          </Card>

          <div className="xl:col-span-2 space-y-6">
            <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/30">
                <CardTitle className="text-base font-bold">Volume por Método</CardTitle>
                <Tabs value={methodView} onValueChange={v => setMethodView(v as any)}>
                  <TabsList className="h-7 bg-muted/50 p-0.5 rounded-md">
                    <TabsTrigger value="percent" className="text-[10px] h-6 px-2 rounded font-semibold">%</TabsTrigger>
                    <TabsTrigger value="abs" className="text-[10px] h-6 px-2 rounded font-semibold">$$</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-32 w-full" /> :
                  !data || data.methodsDistribution.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50">
                        <CreditCard className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Sem dados de métodos</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="relative size-32 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={data.methodsDistribution} cx="50%" cy="50%" innerRadius={36} outerRadius={52} paddingAngle={3} dataKey="value" strokeWidth={0}>
                              {data.methodsDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-sm font-bold text-foreground">
                            {fmt(data.methodsDistribution.reduce((s, m) => s + m.amount, 0))}
                          </span>
                          <span className="text-[10px] text-muted-foreground">Total</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2.5">
                        {data.methodsDistribution.map(m => (
                          <div key={m.name} className="flex items-center gap-2.5">
                            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                            <span className="text-xs font-medium text-foreground flex-1">{m.name}</span>
                            <span className="text-xs font-bold text-foreground tabular-nums">
                              {methodView === "percent" ? `${m.value}%` : fmt(m.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-primary/15 flex flex-col max-h-[500px]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 shrink-0">
                <CardTitle className="text-base font-bold">Atividade Recente</CardTitle>
                <Link href="/transactions" className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group">
                  Ver todas <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto px-3">
                {isLoading ? (
                  <div className="space-y-3 py-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
                ) : !data || data.recentActivity.length === 0 ? <EmptyActivity /> : (
                  <div className="space-y-1">
                    {data.recentActivity.map((activity, index) => (
                      <div key={activity.id} className="group relative flex items-center gap-3 rounded-xl p-3 transition-all duration-300 hover:bg-accent/80 cursor-pointer" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-primary rounded-r-full transition-all duration-300 group-hover:h-8" />
                        <PaymentMethodIcon type={activity.icon} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{activity.company}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground tabular-nums">{fmt(activity.amount)}</p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="size-2.5" />{activity.time}
                            </span>
                            <StatusBadge status={activity.status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Volume Chart + Top Players ───────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* 🔥 Gráfico só para 7d/30d/90d — hoje/ontem mostram mensagem */}
          <Card className="xl:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm border-primary/15">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base font-bold">Volume de Pagamentos</CardTitle>
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/50">
                  {PERIOD_LABELS[period]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? <Skeleton className="h-[220px] w-full" /> :
                isDay ? (
                  // 🔥 Para hoje/ontem mostra KPI resumido em vez do gráfico
                  <div className="flex flex-col items-center justify-center h-[220px] gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                      <BarChart3 className="size-7 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        Gráfico disponível para períodos de 7, 30 ou 90 dias
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Selecione um período maior para ver a evolução do volume
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(["7d", "30d", "90d"] as Period[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border/50 hover:border-primary/30 transition-all"
                        >
                          {PERIOD_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : !data || data.volumeChart.length === 0 ? <EmptyVolumeChart /> : (
                  <>
                    <div className="flex items-center gap-6 mb-6">
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Pico do período</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                          {fmt(Math.max(...data.volumeChart.map(d => d.volume)))}
                        </p>
                      </div>
                      <div className="h-10 w-px bg-border/50" />
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Média diária</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                          {fmt(data.volumeChart.reduce((s, d) => s + d.volume, 0) / data.volumeChart.length)}
                        </p>
                      </div>
                    </div>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.volumeChart} barCategoryGap="20%">
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                              <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} tickMargin={12} interval={2} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={45} />
                          <Tooltip
                            cursor={{ fill: "rgba(16, 185, 129, 0.08)", radius: 4 }}
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.4)", padding: "12px 16px" }}
                            labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", fontWeight: 500 }}
                            formatter={(v: number) => [fmt(v), "Volume"]}
                          />
                          <Bar dataKey="volume" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          {/* Top Players */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-primary/15 flex flex-col max-h-[500px]">
            <CardHeader className="border-b border-border/30 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-1 ring-amber-500/30">
                    <Trophy className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Top Players</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Ranking por faturamento</p>
                  </div>
                </div>
                <Tabs value={topPeriod} onValueChange={v => setTopPeriod(v as any)}>
                  <TabsList className="h-7 bg-muted/50 p-0.5 rounded-md">
                    <TabsTrigger value="daily" className="text-[10px] h-6 px-2 rounded font-semibold">Dia</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-[10px] h-6 px-2 rounded font-semibold">Mês</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto px-3 py-2">
              {isLoading ? (
                <div className="space-y-2 py-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
              ) : (
                <div className="space-y-1.5 py-1">
                  {playersToShow.map((player, index) => {
                    const displayVolume =
                      topPeriod === 'daily'
                        ? player.volume
                        : player.volume;

                    const displayTransactions =
                      topPeriod === 'daily'
                        ? player.transactions
                        : player.transactions;
                    return (
                      <div key={player.rank} className={`group relative flex items-center gap-2.5 rounded-xl p-2.5 transition-all duration-300 cursor-pointer ${(player as any).isEmpty
                        ? "opacity-30"
                        : index === 0
                          ? "bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 hover:border-amber-500/20"
                          : "hover:bg-accent/80"
                        }`}>
                        <RankBadge rank={player.rank} />
                        <Avatar className="size-9 rounded-full ring-1 ring-primary/20 shrink-0">
                          {(player as any).avatarUrl && <AvatarImage src={(player as any).avatarUrl} alt={player.name} />}
                          <AvatarFallback className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold text-primary">
                            {player.avatar || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold truncate text-foreground">
                              {(player as any).isEmpty ? "—" : player.name}
                            </p>
                            {!(player as any).isEmpty && <span className="text-sm">{FLAGS[player.country] ?? "🌍"}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(player as any).instagram && (
                              <span className="text-[10px] text-muted-foreground">{(player as any).instagram}</span>
                            )}
                            {!(player as any).isEmpty && <PlayerBadge badge={player.badge} />}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-foreground tabular-nums">
                            {(player as any).isEmpty ? "—" : fmt(displayVolume)}
                          </p>
                          {!(player as any).isEmpty && player.growth > 0 && (
                            <div className="flex items-center justify-end gap-0.5">
                              <ArrowUpRight className="size-2.5 text-primary" />
                              <span className="text-[10px] font-semibold text-primary">{player.growth.toFixed(1)}%</span>
                            </div>
                          )}
                          {!(player as any).isEmpty && player.growth === 0 && (
                            <span className="text-[10px] text-muted-foreground hidden">{fmtNum(displayTransactions)} txns</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}