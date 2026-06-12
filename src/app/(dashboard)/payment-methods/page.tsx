"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  CreditCard, Wallet, Building2, Zap, Search,
  TrendingUp, BarChart3, DollarSign, CheckCircle2,
  Globe, AlertCircle, ChevronRight, ShieldCheck,
  Clock, Percent, Receipt, Lock, Send,
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { cn } from "@/lib/utils"
import { usePaymentMethods, usePaymentMethodPerformance } from "@/hooks"
import type { PaymentMethodConfig } from "@/types/api.types"

// ─── Formatadores ─────────────────────────────────────────────────────────────
const fmt  = (v: number) => new Intl.NumberFormat("pt-BR", { style:"currency", currency:"USD", minimumFractionDigits:0 }).format(v).replace("US$","US$ ")
const fmtN = (v: number) => new Intl.NumberFormat("pt-BR").format(v)

// ─── Catálogo completo da plataforma ─────────────────────────────────────────

type PlatformMethod = { id: string; name: string; category: string; region: string; color: string; bg: string }

export const PLATFORM_METHODS: PlatformMethod[] = [
  { id:"credit_card",       name:"Cartão de Crédito", category:"card",    region:"Global",   color:"#FFFFFF", bg:"#1A1F71" },
  { id:"apple_pay",         name:"Apple Pay",         category:"wallet",  region:"Global",   color:"#FFFFFF", bg:"#000000" },
  { id:"google_pay",        name:"Google Pay",        category:"wallet",  region:"Global",   color:"#000000", bg:"#FFFFFF" },
  { id:"ideal",             name:"iDEAL",             category:"instant", region:"Holanda",  color:"#FFFFFF", bg:"#CC0066" },
  { id:"bizum",             name:"Bizum",             category:"instant", region:"Espanha",  color:"#FFFFFF", bg:"#00B6E3" },
  { id:"mbway",             name:"MB Way",            category:"instant", region:"Portugal", color:"#FFFFFF", bg:"#D4002A" },
  { id:"blik",              name:"Blik",              category:"instant", region:"Polônia",  color:"#FFFFFF", bg:"#E2001A" },
  { id:"ach",               name:"ACH",               category:"bank",    region:"EUA",      color:"#FFFFFF", bg:"#1A4480" },
  { id:"venmo",             name:"Venmo",             category:"wallet",  region:"EUA",      color:"#FFFFFF", bg:"#3D95CE" },
  { id:"cash_app",          name:"Cash App",          category:"wallet",  region:"EUA",      color:"#FFFFFF", bg:"#00D632" },
  { id:"zelle",             name:"Zelle",             category:"instant", region:"EUA",      color:"#FFFFFF", bg:"#6D1ED4" },
  { id:"interac_debit",     name:"Interac Debit",     category:"card",    region:"Canadá",   color:"#FFFFFF", bg:"#231F20" },
  { id:"interac_etransfer", name:"e-Transfer",        category:"instant", region:"Canadá",   color:"#000000", bg:"#FFB81C" },
]

// ─── Logo component ───────────────────────────────────────────────────────────

function MethodLogo({ pm, size = "md" }: { pm: PlatformMethod; size?: "sm" | "md" }) {
  const sz     = size === "sm" ? "size-9" : "size-12"
  const textSz = size === "sm" ? "text-[9px]" : "text-[11px]"

  // SVGs customizados para os principais
  if (pm.id === "visa" || pm.id === "credit_card" || pm.id === "debit_card") {
    return (
      <div className={cn("flex items-center justify-center rounded-xl", sz)} style={{ backgroundColor: pm.bg }}>
        <svg viewBox="0 0 48 32" className="h-4 w-6">
          <path d="M19.5 21H16L18.5 11H22L19.5 21Z" fill="white"/>
          <path d="M32 11L29 18L28.5 15.5L27 12C27 12 26.7 11 25 11H20v.2C20 11.2 22.5 11.7 25 13.5L28 21H32L36 11H32Z" fill="white"/>
        </svg>
      </div>
    )
  }

  if (pm.id === "pix") {
    return (
      <div className={cn("flex items-center justify-center rounded-xl", sz)} style={{ backgroundColor: pm.bg }}>
        <svg viewBox="0 0 24 24" className={size === "sm" ? "size-4" : "size-5"} fill="white">
          <path d="M17.06 16.94a4.07 4.07 0 01-2.89-1.2l-2.59-2.59a.49.49 0 00-.69 0l-2.6 2.6a4.07 4.07 0 01-2.89 1.19h-.51l3.28 3.28a3.77 3.77 0 005.33 0l3.29-3.28zm-10.12-9.88a4.07 4.07 0 012.89 1.2l2.6 2.6a.49.49 0 00.69 0l2.59-2.59a4.07 4.07 0 012.89-1.2h.38L15.69 3.8a3.77 3.77 0 00-5.33 0L7.07 7.06zm13.74 3.57l-2.07-2.07h-.61a2.81 2.81 0 00-2 .82l-2.59 2.59a1.74 1.74 0 01-2.46 0l-2.6-2.6a2.81 2.81 0 00-2-.82h-.74L3.32 10.6a3.77 3.77 0 000 5.33l2.07 2.07h.74a2.81 2.81 0 002-.82l2.6-2.6a1.78 1.78 0 012.46 0l2.59 2.59a2.81 2.81 0 002 .82h.61l2.07-2.07a3.77 3.77 0 00.22-5.29z"/>
        </svg>
      </div>
    )
  }

  if (pm.id === "apple_pay") {
    return (
      <div className={cn("flex items-center justify-center rounded-xl bg-black", sz)}>
        <svg viewBox="0 0 24 24" className={cn(size === "sm" ? "size-4" : "size-5", "text-white")} fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      </div>
    )
  }

  if (pm.id === "google_pay") {
    return (
      <div className={cn("flex items-center justify-center rounded-xl bg-white border-2 border-border/50", sz)}>
        <svg viewBox="0 0 24 24" className={size === "sm" ? "size-4" : "size-5"}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      </div>
    )
  }

  // Fallback colorido com iniciais
  const abbr = pm.id === "mbway"    ? "MB"  :
               pm.id === "multibanco" ? "ATM" :
               pm.id === "sepa"     ? "SEPA" :
               pm.id === "boleto"   ? "BOL"  :
               pm.name.slice(0, 3).toUpperCase()

  return (
    <div
      className={cn("flex items-center justify-center rounded-xl font-bold", sz, textSz)}
      style={{ backgroundColor: pm.bg, color: pm.color }}
    >
      {abbr}
    </div>
  )
}

// ─── Categoria config ─────────────────────────────────────────────────────────

const CAT: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  card:    { icon: CreditCard, label: "Cartão",                color: "text-primary"  },
  wallet:  { icon: Wallet,     label: "Carteira Digital",       color: "text-chart-2"  },
  bank:    { icon: Building2,  label: "Transferência Bancária", color: "text-chart-3"  },
  instant: { icon: Zap,        label: "Pagamento Instantâneo",  color: "text-chart-4"  },
}

// ─── Request Activation Dialog ────────────────────────────────────────────────

function RequestDialog({ pm, open, onOpenChange }: {
  pm: PlatformMethod | null; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const [msg,  setMsg]     = useState("")
  const [sent, setSent]    = useState(false)
  const [load, setLoad]    = useState(false)

  if (!pm) return null

  const reset = () => { setSent(false); setMsg(""); onOpenChange(false) }

  const send = async () => {
    setLoad(true)
    await new Promise(r => setTimeout(r, 700))
    // TODO: POST /settings/request-method { methodId: pm.id, message: msg }
    setSent(true); setLoad(false)
  }

  const CatIcon = CAT[pm.category]?.icon ?? CreditCard

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); else onOpenChange(v) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <MethodLogo pm={pm} size="sm"/>
            Solicitar — {pm.name}
          </DialogTitle>
          <DialogDescription>
            A ativação requer aprovação. Retornaremos em até 48h úteis.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="size-8 text-success"/>
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Solicitação enviada!</p>
              <p className="text-sm text-muted-foreground mt-1">Nossa equipe analisará em até 48h úteis.</p>
            </div>
            <Button className="w-full" onClick={reset}>Fechar</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Método</span><span className="font-medium">{pm.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Região</span><span className="font-medium">{pm.region}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoria</span>
                  <div className={cn("flex items-center gap-1 text-xs font-medium", CAT[pm.category]?.color)}>
                    <CatIcon className="size-3"/>{CAT[pm.category]?.label}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensagem (opcional)</Label>
                <Textarea
                  placeholder="Descreva o caso de uso ou volume esperado..."
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-muted-foreground flex gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-primary"/>
                <span>A ativação é analisada individualmente. Métodos regionais podem requerer documentação adicional.</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button disabled={load} onClick={send} className="gap-2">
                {load ? <><div className="size-4 mr-1 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"/>Enviando...</> : <><Send className="size-4"/>Solicitar Ativação</>}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

function DetailSheet({ method, open, onOpenChange, onRequest }: {
  method: PaymentMethodConfig | null; open: boolean
  onOpenChange: (v: boolean) => void; onRequest: (pm: PlatformMethod) => void
}) {
  const { data: perf } = usePaymentMethodPerformance(open && method ? method.id : null)
  if (!method) return null

  const pm     = PLATFORM_METHODS.find(m => m.id === method.id) ?? { id: method.id, name: method.name, category: method.category, region: "Global", color: "#FFFFFF", bg: "#334155" }
  const catCfg = CAT[method.category] ?? CAT.card
  const CatIcon = catCfg.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-4">
            <MethodLogo pm={pm}/>
            <div className="space-y-1">
              <SheetTitle className="text-xl">{method.name}</SheetTitle>
              <div className={cn("flex items-center gap-1.5 text-sm", catCfg.color)}>
                <CatIcon className="size-4"/>{catCfg.label} · {pm.region}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-6">
          {/* Status */}
          <Card className={cn("transition-colors", method.enabled ? "border-success/20 bg-success/5" : "border-muted bg-muted/20")}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {method.enabled ? <CheckCircle2 className="size-5 text-success"/> : <Lock className="size-5 text-muted-foreground"/>}
                <div>
                  <p className="font-medium">{method.enabled ? "Método Ativo" : "Requer Ativação"}</p>
                  <p className="text-sm text-muted-foreground">
                    {method.enabled ? "Seus clientes podem pagar com este método" : "Solicite a ativação para usar este método"}
                  </p>
                </div>
              </div>
              {!method.enabled && (
                <Button size="sm" className="gap-2 shrink-0" onClick={() => onRequest(pm)}>
                  <Send className="size-3.5"/>Solicitar
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Performance */}
          {method.enabled && perf && perf.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Performance Semanal</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={perf} margin={{ top:10, right:10, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:"hsl(var(--muted-foreground))", fontSize:11 }}/>
                      <YAxis axisLine={false} tickLine={false} tick={{ fill:"hsl(var(--muted-foreground))", fontSize:11 }}/>
                      <Tooltip contentStyle={{ backgroundColor:"hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:"8px" }}/>
                      <Area type="monotone" dataKey="transactions" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#pg)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métricas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Métricas</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:DollarSign, label:"Volume Total",   value: method.volume > 0 ? fmt(method.volume) : "—",             color:"" },
                { icon:BarChart3,  label:"Transações",     value: method.transactions > 0 ? fmtN(method.transactions) : "—", color:"" },
                { icon:TrendingUp, label:"Taxa Aprovação", value: method.enabled ? `${method.approvalRate}%` : "—",          color:"text-success" },
                { icon:Receipt,    label:"Ticket Médio",   value: method.avgTicket > 0 ? fmt(method.avgTicket) : "—",        color:"" },
              ].map(m => (
                <Card key={m.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <m.icon className="size-4"/><span className="text-xs font-medium">{m.label}</span>
                    </div>
                    <p className={cn("mt-2 text-xl font-bold", m.color)}>{m.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Config */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Configuração</h3>
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {[
                { icon:Building2,  label:"Provedor",    sub:"Processador",   value: <Badge variant="secondary">{method.provider || "—"}</Badge> },
                { icon:Percent,    label:"Taxa",         sub:"Por contrato",  value: <span className="font-mono text-sm">{method.fees || "—"}</span> },
                { icon:Globe,      label:"Região",       sub:"Disponível em", value: <span className="text-sm">{pm.region}</span> },
                { icon:Clock,      label:"Liquidação",   sub:"Prazo",         value: <span className="text-sm">D+{method.settlementDays || 1}</span> },
                { icon:ShieldCheck,label:"Segurança",    sub:"Antifraude",    value: <Badge className="bg-success/10 text-success border-0">Ativo</Badge> },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <row.icon className="size-4 text-muted-foreground"/>
                    </div>
                    <div><p className="text-sm font-medium">{row.label}</p><p className="text-xs text-muted-foreground">{row.sub}</p></div>
                  </div>
                  {row.value}
                </div>
              ))}
            </div>
          </div>

          {!method.enabled && (
            <Button className="w-full gap-2" onClick={() => { onOpenChange(false); onRequest(pm) }}>
              <Send className="size-4"/>Solicitar Ativação deste Método
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PaymentMethodsPage() {
  const [search,   setSearch]   = useState("")
  const [tab,      setTab]      = useState("all")
  const [catF,     setCatF]     = useState("all")
  const [selected, setSelected] = useState<PaymentMethodConfig | null>(null)
  const [sheetOpen,setSheetOpen]= useState(false)
  const [reqPm,    setReqPm]    = useState<PlatformMethod | null>(null)
  const [reqOpen,  setReqOpen]  = useState(false)

  const { data: backendMethods, isLoading } = usePaymentMethods()

  // Mescla catálogo completo com dados do backend (enabled vem do servidor)
  const allMethods: PaymentMethodConfig[] = PLATFORM_METHODS.map(pm => {
    const b = backendMethods?.find(b => b.id === pm.id)
    return b ?? {
      id: pm.id, name: pm.name, icon: pm.id, category: pm.category as any,
      provider: "—", fees: "—", countries: [pm.region], enabled: false,
      volume: 0, transactions: 0, approvalRate: 0, avgTicket: 0, settlementDays: 1,
    }
  })

  const filtered = allMethods.filter(m => {
    const ms = m.name.toLowerCase().includes(search.toLowerCase())
    const mc = catF === "all" || m.category === catF
    if (tab === "active")    return ms && mc && m.enabled
    if (tab === "available") return ms && mc && !m.enabled
    return ms && mc
  })

  const activeCount = allMethods.filter(m => m.enabled).length

  const openReq = (pm: PlatformMethod) => { setReqPm(pm); setReqOpen(true) }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Métodos de Pagamento</h1>
        <p className="text-muted-foreground">Catálogo completo. Métodos ativos foram aprovados para sua conta.</p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-success"/>
          <span className="text-sm font-medium">{activeCount} ativos</span>
        </div>
        <div className="h-4 w-px bg-border"/>
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-muted-foreground"/>
          <span className="text-sm font-medium">{allMethods.length - activeCount} disponíveis para solicitar</span>
        </div>
        <div className="h-4 w-px bg-border"/>
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-muted-foreground"/>
          <span className="text-sm text-muted-foreground">{PLATFORM_METHODS.length} métodos no catálogo</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-10">
              <TabsTrigger value="all" className="gap-2 px-4">
                Todos <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{allMethods.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-2 px-4">
                Ativos <Badge variant="secondary" className="ml-1 h-5 bg-success/10 text-success px-1.5 text-xs">{activeCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="available" className="gap-2 px-4">
                Solicitar <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{allMethods.length - activeCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { k:"all",     l:"Todos" },
              { k:"card",    l:"Cartão" },
              { k:"wallet",  l:"Wallet" },
              { k:"instant", l:"Instantâneo" },
              { k:"bank",    l:"Bancário" },
            ].map(c => (
              <button key={c.k} onClick={() => setCatF(c.k)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  catF === c.k ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                {c.l}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
          <Input placeholder="Buscar método..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10"/>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3"><Skeleton className="size-9 rounded-xl"/><div className="space-y-1.5"><Skeleton className="h-4 w-20"/><Skeleton className="h-3 w-14"/></div></div>
              <Skeleton className="h-10 w-full rounded-lg"/>
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(method => {
            const pm     = PLATFORM_METHODS.find(m => m.id === method.id) ?? { id:method.id, name:method.name, category:method.category, region:"Global", color:"#FFF", bg:"#334155" }
            const catCfg = CAT[method.category] ?? CAT.card
            const CatIcon = catCfg.icon

            return (
              <Card key={method.id}
                className={cn(
                  "group relative cursor-pointer transition-all duration-200",
                  "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                  method.enabled ? "border-border" : "border-dashed border-border/40 bg-muted/5"
                )}
                onClick={() => { setSelected(method); setSheetOpen(true) }}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <MethodLogo pm={pm} size="sm"/>
                      <div>
                        <h3 className={cn("text-sm font-semibold leading-tight", !method.enabled && "text-muted-foreground")}>
                          {method.name}
                        </h3>
                        <div className={cn("flex items-center gap-1 text-[10px] mt-0.5", catCfg.color)}>
                          <CatIcon className="size-3"/>{catCfg.label}
                        </div>
                      </div>
                    </div>
                    {method.enabled
                      ? <div className="flex size-6 items-center justify-center rounded-full bg-success/15 shrink-0"><CheckCircle2 className="size-3.5 text-success"/></div>
                      : <div className="flex size-6 items-center justify-center rounded-full bg-muted/80 shrink-0"><Lock className="size-3 text-muted-foreground"/></div>
                    }
                  </div>

                  {/* Info */}
                  {method.enabled && method.volume > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Volume</p>
                        <p className="text-xs font-semibold mt-0.5">US$ {(method.volume/1000).toFixed(0)}K</p>
                      </div>
                      <div className="rounded-lg bg-success/5 p-2">
                        <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Aprovação</p>
                        <p className="text-xs font-semibold text-success mt-0.5">{method.approvalRate}%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-2.5 py-1.5">
                      <Globe className="size-3 text-muted-foreground shrink-0"/>
                      <span className="text-[10px] text-muted-foreground truncate">{pm.region}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                    {method.enabled ? (
                      <Badge variant="outline" className="text-[10px] bg-success/5 text-success border-success/20">Ativo</Badge>
                    ) : (
                      <Button variant="ghost" size="sm"
                        className="h-6 text-[10px] px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={e => { e.stopPropagation(); openReq(pm) }}>
                        <Send className="size-2.5"/>Solicitar
                      </Button>
                    )}
                    <Button variant="ghost" size="sm"
                      className="h-6 gap-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 px-2"
                      onClick={e => { e.stopPropagation(); setSelected(method); setSheetOpen(true) }}>
                      Detalhes <ChevronRight className="size-3"/>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Search className="size-6 text-muted-foreground"/>
            </div>
            <h3 className="mt-4 font-semibold">Nenhum método encontrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tente ajustar os filtros</p>
          </CardContent>
        </Card>
      )}

      <DetailSheet method={selected} open={sheetOpen} onOpenChange={setSheetOpen} onRequest={openReq}/>
      <RequestDialog pm={reqPm} open={reqOpen} onOpenChange={setReqOpen}/>
    </div>
  )
}