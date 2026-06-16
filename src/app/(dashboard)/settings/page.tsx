"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Building2, Shield, Key, Plug, Save, Camera,
  Eye, EyeOff, Copy, RefreshCw, CheckCircle2,
  AlertCircle, Globe, Smartphone, Mail, Lock,
  ExternalLink, User, Instagram, Phone,
  Plus, Link as LinkIcon, Clock, AlertTriangle,
  Skull, Trash2, FileText, MapPin, Zap, X,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useSettings, useUpdateSettings } from "@/hooks"
import { ApiError, getToken } from "@/lib/api"
import { useAuth } from "@/context/auth.context"
import { toast } from "sonner"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("")
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button variant="outline" size="icon" onClick={() => {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }}>
      {copied ? <CheckCircle2 className="size-4 text-success" /> : <Copy className="size-4" />}
    </Button>
  )
}

// ─── Risk / Offer configs ─────────────────────────────────────────────────────

const RISK_CONFIG = {
  WHITE: { label: "White", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Shield },
  GRAY: { label: "Gray", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
  BLACK: { label: "Black", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", icon: Skull },
}

const OFFER_STATUS = {
  pending_review: { label: "Análise pendente", cls: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Aprovada", cls: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejeitada", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  suspended: { label: "Suspensa", cls: "bg-muted text-muted-foreground" },
}

const WEBHOOK_EVENTS = [
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "payout.created",
  "payout.completed",
  "dispute.created",
]


const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007'

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data?.message ?? "Erro inesperado")
  return data
}

// ─── Add Offer Dialog ─────────────────────────────────────────────────────────

function AddOfferDialog({ open, onOpenChange, onAdd }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (o: { name: string; salesPageUrl: string; riskLevel: "WHITE" | "GRAY" | "BLACK" }) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [risk, setRisk] = useState<"WHITE" | "GRAY" | "BLACK">("WHITE")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setName(""); setUrl(""); setRisk("WHITE"); setError(null) }

  const submit = async () => {
    if (!name.trim() || !url.trim()) return
    setLoading(true); setError(null)
    try {
      await onAdd({ name, salesPageUrl: url, riskLevel: risk })
      reset(); onOpenChange(false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao adicionar oferta")
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Oferta</DialogTitle>
          <DialogDescription>A oferta ficará em análise pendente até ser aprovada.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          <div className="space-y-2">
            <Label>Nome da oferta</Label>
            <Input placeholder="Ex: Curso Master em Vendas" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Link da página de vendas</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nível de risco</Label>
            <div className="flex gap-2">
              {(["WHITE", "GRAY", "BLACK"] as const).map(r => {
                const cfg = RISK_CONFIG[r]; const Icon = cfg.icon
                return (
                  <button key={r} type="button" onClick={() => setRisk(r)}
                    className={cn("flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-medium transition-all",
                      risk === r ? cn(cfg.bg, "ring-1 ring-offset-1 ring-primary") : "border-border hover:bg-muted")}>
                    <Icon className={cn("size-3.5", cfg.color)} />
                    <span className={risk === r ? cfg.color : ""}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning flex gap-2">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>A oferta ficará em <strong>análise pendente</strong> até aprovação da equipe.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>Cancelar</Button>
          <Button disabled={!name.trim() || !url.trim() || loading} onClick={submit}>
            {loading ? <><div className="size-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />Adicionando...</> : <><Plus className="size-4 mr-2" />Adicionar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Waylinx Config Dialog ────────────────────────────────────────────────────

function WaylinxDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [webhookUrl, setWebhookUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [saved, setSaved] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 ring-1 ring-violet-500/30">
              <Zap className="size-4 text-violet-500" />
            </div>
            Configurar Waylinx
          </DialogTitle>
          <DialogDescription>
            Configure a integração com a Waylinx para automatizar seus fluxos de pagamento.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {saved && (
            <div className="p-3 rounded-lg bg-success/10 text-success text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4" />Integração salva com sucesso!
            </div>
          )}
          <div className="space-y-2">
            <Label>API Key da Waylinx</Label>
            <Input
              placeholder="wlx_live_xxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>URL de Webhook (opcional)</Label>
            <Input
              placeholder="https://waylinx.com/webhooks/seu-endpoint"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">URL que a Waylinx usará para notificar eventos</p>
          </div>
          <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Como obter sua API Key:</p>
            <p>1. Acesse o painel da Waylinx</p>
            <p>2. Vá em Configurações → Integrações</p>
            <p>3. Gere uma nova API Key e cole acima</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!apiKey.trim()} onClick={() => {
            // TODO: chamar endpoint de salvar integração
            setSaved(true)
            setTimeout(() => { setSaved(false); onOpenChange(false) }, 1500)
          }}>
            <Save className="size-4 mr-2" />Salvar Integração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { data: settings, isLoading, mutate } = useSettings()
  const { update, isLoading: saving } = useUpdateSettings()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Profile ──
  const [profileForm, setProfileForm] = useState({ name: "", instagram: "", whatsapp: "", email: "" })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  // ── Password ──
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" })
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // ── Security ──
  const [secForm, setSecForm] = useState<Record<string, any>>({})
  const [securitySaved, setSecuritySaved] = useState(false)

  // ── API Keys ──
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [keysLoaded, setKeysLoaded] = useState(false)
  const [keysLoading, setKeysLoading] = useState(false)
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null)   // mostrado só uma vez
  const [newKeyPublic, setNewKeyPublic] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)
  const [creatingKey, setCreatingKey] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [showKeySecret, setShowKeySecret] = useState<Record<string, boolean>>({})

  // ── Webhook ──
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookEvents, setWebhookEvents] = useState<Record<string, boolean>>({})
  const [webhookSaved, setWebhookSaved] = useState(false)
  const [webhookDirty, setWebhookDirty] = useState(false)

  // ── Offers ──
  const [offers, setOffers] = useState<any[]>([])
  const [offersLoaded, setOffersLoaded] = useState(false)
  const [addOfferOpen, setAddOfferOpen] = useState(false)

  // ── Integrations ──
  const [waylinxOpen, setWaylinxOpen] = useState(false)
  const [waylinxConnected, setWaylinxConnected] = useState(false)

  const [avatarFile, setAvatarFile] = useState<string | null>(null)

  // ── Sync settings → forms ─────────────────────────────────────────────────
  useEffect(() => {
    if (!settings) return

    setProfileForm({
      name: settings.company.name || user?.name || "",
      email: settings.company.email || user?.email || "",
      instagram: settings.company.instagram || (user as any)?.instagram || "",
      whatsapp: settings.company.whatsapp || (user as any)?.whatsapp || "",
    })

    // Webhook: só inicializa se ainda não foi editado pelo usuário
    if (!webhookDirty) {
      setWebhookUrl(settings.webhooks.url || "")
      const evtInit: Record<string, boolean> = {}
      WEBHOOK_EVENTS.forEach(e => {
        evtInit[e] = settings.webhooks.events?.[e] ?? true
      })
      setWebhookEvents(evtInit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])


  // ── Load API Keys ─────────────────────────────────────────────────────────
  const loadApiKeys = async () => {
    if (keysLoaded) return
    setKeysLoading(true)
    try {
      const data = await apiFetch<any[]>("/credentials")
      setApiKeys(data)
      setKeysLoaded(true)
    } catch { setApiKeys([]) }
    finally { setKeysLoading(false) }
  }

  // ── Load Offers ───────────────────────────────────────────────────────────
  const loadOffers = async () => {
    if (offersLoaded) return
    try {
      const data = await apiFetch<any[]>("/settings/offers")
      setOffers(data)
    } catch { setOffers([]) }
    setOffersLoaded(true)
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    await update({
      section: "company",
      data: {
        ...profileForm,
        ...(avatarFile ? { avatarBase64: avatarFile } : {}), // 🔥
      } as any
    })
    setAvatarFile(null)
    await refreshUser()
    toast.success("Dados salvos com sucesso!")
    mutate()
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  // ── Change password ───────────────────────────────────────────────────────
  const changePassword = async () => {
    setPwError(null); setPwSuccess(false)
    if (pwForm.next !== pwForm.confirm) { setPwError("As senhas não coincidem"); return }
    if (pwForm.next.length < 8) { setPwError("Mínimo 8 caracteres"); return }
    setPwLoading(true)
    try {
      await apiFetch("/settings/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      setPwSuccess(true)
      setPwForm({ current: "", next: "", confirm: "" })
    } catch (e) {
      setPwError(e instanceof ApiError ? e.message : "Erro ao alterar senha")
    } finally { setPwLoading(false) }
  }

  // ── Save security ─────────────────────────────────────────────────────────
  const saveSecurity = async () => {
    const merged = { ...(settings?.security ?? {}), ...secForm }
    await update({ section: "security", data: merged as any })
    mutate()
    setSecuritySaved(true)
    setTimeout(() => setSecuritySaved(false), 3000)
  }

  // ── Create API key ────────────────────────────────────────────────────────
  const createApiKey = async () => {
    setCreatingKey(true)
    try {
      const res = await apiFetch<{ publishableKey: string; secretKey: string }>("/credentials", {
        method: "POST",
        body: JSON.stringify({ name: "Default key" }),
      })
      setNewKeySecret(res.secretKey)
      setNewKeyPublic(res.publishableKey)
      setShowNewKey(true)
      // Recarrega a lista
      const updated = await apiFetch<any[]>("/credentials")
      setApiKeys(updated)
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Erro ao gerar chave")
    } finally { setCreatingKey(false) }
  }

  // ── Revoke API key ────────────────────────────────────────────────────────
  const revokeApiKey = async (id: string) => {
    await apiFetch(`/credentials/${id}`, { method: "DELETE" })
    setApiKeys(prev => prev.filter(k => k.id !== id))
    setRevokeTarget(null)
  }

  // ── Rotate API key ────────────────────────────────────────────────────────
  const rotateApiKey = async (id: string) => {
    const res = await apiFetch<{ publishableKey: string; secretKey: string }>(
      `/credentials/${id}/rotate`, { method: "POST" }
    )
    setNewKeySecret(res.secretKey)
    setNewKeyPublic(res.publishableKey)
    setShowNewKey(true)
    const updated = await apiFetch<any[]>("/credentials")
    setApiKeys(updated)
  }

  // ── Save webhook ──────────────────────────────────────────────────────────
  const saveWebhook = async () => {
    await update({ section: "webhooks", data: { url: webhookUrl, events: webhookEvents } as any })
    mutate()
    setWebhookDirty(false)
    setWebhookSaved(true)
    setTimeout(() => setWebhookSaved(false), 3000)
  }

  // ── Add offer ─────────────────────────────────────────────────────────────
  const addOffer = async (offer: any) => {
    await apiFetch("/settings/offers", {
      method: "POST",
      body: JSON.stringify(offer),
    })
    setOffers(prev => [
      ...prev,
      {
        ...offer, id: Date.now().toString(), sales_page_url: offer.salesPageUrl,
        risk_level: offer.riskLevel, status: "pending_review", created_at: new Date().toISOString()
      }
    ])
  }

  const [webhookSecret, setWebhookSecret] = useState<string>("")
  const [loadingSecret, setLoadingSecret] = useState(false)

  const revealWebhookSecret = async () => {
    setLoadingSecret(true)
    try {
      const data = await apiFetch<any>("/settings/webhook/secret")
      console.log("[webhook secret] resposta crua:", data)
      console.log("[webhook secret] tipo:", typeof data)
      console.log("[webhook secret] keys:", Object.keys(data || {}))

      // Tenta vários formatos comuns
      const secret =
        data?.secret ??
        data?.webhook_secret ??
        data?.webhookSecret ??
        data?.data?.secret ??
        (typeof data === "string" ? data : null)

      if (!secret) {
        console.error("[webhook secret] nenhum campo conhecido encontrado")
        toast.error("Resposta do backend em formato inesperado")
        return
      }

      setWebhookSecret(secret)
    } catch (err) {
      console.error("[webhook secret] erro:", err)
      toast.error("Erro ao buscar secret")
    } finally {
      setLoadingSecret(false)
    }
  }

  const initials = user?.name ? getInitials(user.name) : "??"

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua conta e do gateway</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-background"><User className="size-4" />Perfil</TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-background"><Shield className="size-4" />Segurança</TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2 data-[state=active]:bg-background" onClick={loadApiKeys}><Key className="size-4" />Credenciais</TabsTrigger>
          <TabsTrigger value="offers" className="gap-2 data-[state=active]:bg-background" onClick={loadOffers}><FileText className="size-4" />Ofertas</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-background"><Plug className="size-4" />Integrações</TabsTrigger>
        </TabsList>

        {/* ── PERFIL ─────────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados Pessoais</CardTitle>
              <CardDescription>Seu perfil público e informações de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : (
                <>
                  {profileSaved && (
                    <div className="p-3 rounded-lg bg-success/10 text-success text-sm flex items-center gap-2">
                      <CheckCircle2 className="size-4" />Perfil atualizado com sucesso!
                    </div>
                  )}
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="size-20 rounded-xl ring-2 ring-primary/20">
                        {(avatarPreview || user?.avatarUrl) && (
                          <AvatarImage src={avatarPreview ?? user?.avatarUrl ?? ""} className="object-cover" />
                        )}
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <button onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                        <Camera className="size-4" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (!f || f.size > 3 * 1024 * 1024) return
                          const r = new FileReader()
                          r.onloadend = () => {
                            const base64 = r.result as string
                            setAvatarPreview(base64)
                            setAvatarFile(base64)
                          }
                          r.readAsDataURL(f)
                        }} />
                    </div>
                    <div>
                      <h4 className="font-medium">{user?.name ?? "—"}</h4>
                      <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG · máx. 3MB</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-5 md:grid-cols-2">
                    {[
                      { key: "name", label: "Nome completo", icon: User, type: "text", ph: "Seu nome" },
                      { key: "email", label: "Email", icon: Mail, type: "email", ph: "seu@email.com" },
                      { key: "instagram", label: "Instagram", icon: Instagram, type: "text", ph: "@seuarroba" },
                      { key: "whatsapp", label: "WhatsApp", icon: Phone, type: "tel", ph: "(00) 00000-0000" },
                    ].map(f => {
                      const Icon = f.icon
                      return (
                        <div key={f.key} className="space-y-2">
                          <Label>{f.label}</Label>
                          <div className="relative">
                            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              type={f.type}
                              placeholder={f.ph}
                              className="pl-10"
                              value={profileForm[f.key as keyof typeof profileForm]}
                              onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-end">
                    <Button className="gap-2" disabled={saving} onClick={saveProfile}>
                      <Save className="size-4" />{saving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* KYC read-only */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados de Identidade (KYC)</CardTitle>
              <CardDescription>Informações do processo de verificação — somente leitura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : !settings?.kyc ? (
                <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground text-center">
                  KYC não completado ainda.
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome completo</Label>
                      <Input value={settings.kyc.fullName} readOnly className="bg-muted/30" />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input value={settings.kyc.cpfMasked} readOnly className="bg-muted/30 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de nascimento</Label>
                      <Input value={settings.kyc.birthDate} readOnly className="bg-muted/30" />
                    </div>
                    <div className="space-y-2">
                      <Label>Status KYC</Label>
                      <div className="flex items-center h-10">
                        <Badge variant="outline" className={
                          settings.kyc.status === "approved" ? "bg-success/10 text-success border-success/20"
                            : settings.kyc.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-warning/10 text-warning border-warning/20"
                        }>
                          {settings.kyc.status === "approved" ? "Aprovado" : settings.kyc.status === "rejected" ? "Rejeitado" : "Em análise"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Endereço</Label>
                      <Input
                        value={`${settings.kyc.street}, ${settings.kyc.number}${settings.kyc.complement ? ` - ${settings.kyc.complement}` : ""}, ${settings.kyc.neighborhood} - ${settings.kyc.city}/${settings.kyc.state} · CEP ${settings.kyc.cep}`}
                        readOnly className="bg-muted/30" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Para alterar dados de identidade, entre em contato com o suporte.</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Alterar senha */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha de acesso periodicamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {pwError && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{pwError}</div>}
              {pwSuccess && <div className="p-3 rounded-lg bg-success/10 text-success text-sm flex items-center gap-2"><CheckCircle2 className="size-4" />Senha alterada com sucesso!</div>}
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  { key: "current", label: "Senha Atual" },
                  { key: "next", label: "Nova Senha" },
                  { key: "confirm", label: "Confirmar Nova Senha" },
                ].map(f => (
                  <div key={f.key} className="space-y-2">
                    <Label>{f.label}</Label>
                    <Input type="password"
                      value={pwForm[f.key as keyof typeof pwForm]}
                      onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" className="gap-2" disabled={pwLoading} onClick={changePassword}>
                  <Lock className="size-4" />{pwLoading ? "Alterando..." : "Alterar Senha"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SEGURANÇA ──────────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Autenticação</CardTitle>
              <CardDescription>Configure as opções de segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "twoFactorEnabled", Icon: Smartphone, label: "Autenticação de Dois Fatores (2FA)", sub: "Proteja sua conta com um código adicional", iconCls: "bg-success/10", icon2Cls: "text-success" },
                { key: "emailAlerts", Icon: Mail, label: "Alertas por Email", sub: "Receba notificações de atividades suspeitas", iconCls: "bg-muted", icon2Cls: "text-muted-foreground" },
                { key: "ipRestriction", Icon: Globe, label: "Restrição por IP", sub: "Permitir acesso apenas de IPs autorizados", iconCls: "bg-muted", icon2Cls: "text-muted-foreground" },
              ].map(item => {
                const val = secForm[item.key] ?? settings?.security?.[item.key as keyof typeof settings.security] ?? false
                return (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex size-10 items-center justify-center rounded-lg ${item.iconCls}`}>
                        <item.Icon className={`size-5 ${item.icon2Cls}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.label}</h4>
                        <p className="text-sm text-muted-foreground">{item.sub}</p>
                      </div>
                    </div>
                    <Switch checked={!!val} onCheckedChange={v => setSecForm(p => ({ ...p, [item.key]: v }))} />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regras de Fraude</CardTitle>
              <CardDescription>Configure regras automáticas de prevenção de fraude</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "require3DS", label: "3D Secure Obrigatório", sub: "Exigir autenticação 3DS para todas as transações" },
                { key: "velocityCheck", label: "Verificação de Velocidade", sub: "Bloquear transações com alta frequência do mesmo IP" },
                { key: "geoCheck", label: "Verificação de Geolocalização", sub: "Alertar quando país do IP difere do país do cartão" },
                { key: "cardTestingBlock", label: "Bloqueio de Card Testing", sub: "Detectar e bloquear tentativas de teste de cartões" },
              ].map((item, i, arr) => {
                const val = secForm[item.key] ?? settings?.security?.[item.key as keyof typeof settings.security] ?? false
                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.sub}</p>
                      </div>
                      <Switch checked={!!val} onCheckedChange={v => setSecForm(p => ({ ...p, [item.key]: v }))} />
                    </div>
                    {i < arr.length - 1 && <Separator className="mt-4" />}
                  </div>
                )
              })}
              <Separator />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Limite de Transação Máximo</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number"
                      value={secForm.maxTransactionAmount ?? settings?.security?.maxTransactionAmount ?? 10000}
                      onChange={e => setSecForm(p => ({ ...p, maxTransactionAmount: Number(e.target.value) }))} />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">USD</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Risk Score Limite</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number"
                      value={secForm.riskScoreLimit ?? settings?.security?.riskScoreLimit ?? 85}
                      onChange={e => setSecForm(p => ({ ...p, riskScoreLimit: Number(e.target.value) }))} />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/ 100</span>
                  </div>
                </div>
              </div>
              {securitySaved && (
                <div className="p-3 rounded-lg bg-success/10 text-success text-sm flex items-center gap-2">
                  <CheckCircle2 className="size-4" />Configurações de segurança salvas!
                </div>
              )}
              <div className="flex justify-end">
                <Button className="gap-2" disabled={saving} onClick={saveSecurity}>
                  <Save className="size-4" />{saving ? "Salvando..." : "Guardar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CREDENCIAIS ────────────────────────────────────────────────── */}
        <TabsContent value="credentials" className="space-y-6">

          {/* New key revealed banner */}
          {showNewKey && newKeySecret && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-success" />
                  <p className="font-semibold text-success">Chave gerada com sucesso!</p>
                </div>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowNewKey(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning flex gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span><strong>Atenção:</strong> a Secret Key só é exibida uma vez. Copie e guarde agora — não será possível recuperá-la depois.</span>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Publishable Key</Label>
                <div className="flex gap-2">
                  <Input readOnly value={newKeyPublic ?? ""} className="font-mono text-sm bg-muted/30" />
                  <CopyButton value={newKeyPublic ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Secret Key (copie agora!)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={newKeySecret} className="font-mono text-sm bg-muted/30 border-success/40" />
                  <CopyButton value={newKeySecret} />
                </div>
              </div>
            </div>
          )}

          {/* API Keys list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Chaves da API</CardTitle>
                  <CardDescription>Gerencie suas credenciais de acesso à API</CardDescription>
                </div>
                <Button className="gap-2" disabled={creatingKey} onClick={createApiKey}>
                  {creatingKey
                    ? <><div className="size-4 mr-1 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />Gerando...</>
                    : <><Plus className="size-4" />Gerar Nova Chave</>
                  }
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {keysLoading ? (
                <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : apiKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                    <Key className="size-5 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Nenhuma chave gerada</p>
                    <p className="text-sm text-muted-foreground mt-1">Gere sua primeira chave para integrar com a API</p>
                  </div>
                  <Button className="gap-2 mt-1" disabled={creatingKey} onClick={createApiKey}>
                    <Plus className="size-4" />Gerar Chave
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map(key => (
                    <div key={key.id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Key className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{key.name}</p>
                          <Badge variant="outline" className={key.is_active
                            ? "bg-success/10 text-success border-success/20 text-xs"
                            : "bg-muted text-muted-foreground text-xs"
                          }>
                            {key.is_active ? "Ativa" : "Revogada"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <code className="text-xs text-muted-foreground font-mono">
                            pk: {key.publishable_key?.slice(0, 24)}…
                          </code>
                          <code className="text-xs text-muted-foreground font-mono">
                            sk: {key.key_prefix}••••••••••••
                          </code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Criada em {new Date(key.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {key.is_active && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 shrink-0">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => rotateApiKey(key.id)}>
                              <RefreshCw className="size-4" />Rotacionar chave
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => setRevokeTarget(key.id)}>
                              <Trash2 className="size-4" />Revogar chave
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                A Secret Key só é exibida no momento da criação. Guarde-a em um local seguro.
              </p>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Webhooks</CardTitle>
              <CardDescription>Configure endpoints para receber eventos em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {webhookSaved && (
                <div className="p-3 rounded-lg bg-success/10 text-success text-sm flex items-center gap-2">
                  <CheckCircle2 className="size-4" />Webhook salvo com sucesso!
                </div>
              )}
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://seu-site.com/api/webhooks"
                    value={webhookUrl}
                    onChange={e => { setWebhookUrl(e.target.value); setWebhookDirty(true) }}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <div className="flex gap-2">
                  <Input
                    type={showKeySecret["webhook"] ? "text" : "password"}
                    readOnly
                    value={webhookSecret || "••••••••••••••••••••••••"}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline" size="icon"
                    onClick={async () => {
                      if (!webhookSecret) await revealWebhookSecret()
                      setShowKeySecret(p => ({ ...p, webhook: !p["webhook"] }))
                    }}
                    disabled={loadingSecret}
                  >
                    {loadingSecret
                      ? <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                      : showKeySecret["webhook"] ? <EyeOff className="size-4" /> : <Eye className="size-4" />
                    }
                  </Button>
                  <CopyButton value={webhookSecret} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique no olho para revelar o secret e copiar.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Eventos Ativos</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {WEBHOOK_EVENTS.map(event => (
                    <div key={event} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <code className="text-xs">{event}</code>
                      <Switch
                        checked={webhookEvents[event] ?? true}
                        onCheckedChange={v => { setWebhookEvents(p => ({ ...p, [event]: v })); setWebhookDirty(true) }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2" disabled={saving} onClick={saveWebhook}>
                  <Save className="size-4" />{saving ? "Salvando..." : "Guardar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── OFERTAS ────────────────────────────────────────────────────── */}
        <TabsContent value="offers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Suas Ofertas</CardTitle>
                  <CardDescription>Novas ofertas ficam em análise pendente até aprovação.</CardDescription>
                </div>
                <Button className="gap-2" onClick={() => setAddOfferOpen(true)}>
                  <Plus className="size-4" />Adicionar Oferta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!offersLoaded ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
              ) : offers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Nenhuma oferta cadastrada</p>
                    <p className="text-sm text-muted-foreground mt-1">Adicione sua primeira oferta para começar a operar</p>
                  </div>
                  <Button className="gap-2 mt-2" onClick={() => setAddOfferOpen(true)}>
                    <Plus className="size-4" />Adicionar Oferta
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {offers.map(offer => {
                    const risk = RISK_CONFIG[offer.risk_level as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.WHITE
                    const status = OFFER_STATUS[offer.status as keyof typeof OFFER_STATUS] ?? OFFER_STATUS.pending_review
                    const RIcon = risk.icon
                    return (
                      <div key={offer.id} className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors">
                        <div className={cn("flex size-10 items-center justify-center rounded-lg shrink-0", risk.bg.split(" ")[0])}>
                          <RIcon className={cn("size-5", risk.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{offer.name}</p>
                          <a href={offer.sales_page_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 w-fit">
                            {offer.sales_page_url}
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={cn("text-xs", risk.bg)}>
                            <RIcon className={cn("size-3 mr-1", risk.color)} /><span className={risk.color}>{risk.label}</span>
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", status.cls)}>
                            {offer.status === "pending_review" && <Clock className="size-3 mr-1" />}
                            {offer.status === "approved" && <CheckCircle2 className="size-3 mr-1" />}
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="mt-4 rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground flex gap-3">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-primary" />
                <span>Toda nova oferta passará por análise antes de ser aprovada. Ofertas <strong>GRAY</strong> ou <strong>BLACK</strong> podem requerer documentação adicional.</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INTEGRAÇÕES ────────────────────────────────────────────────── */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integrações Disponíveis</CardTitle>
              <CardDescription>Conecte sua conta com ferramentas externas</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Waylinx */}
              <div className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 ring-1 ring-violet-500/30">
                    <Zap className="size-5 text-violet-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Waylinx</h4>
                    <p className="text-sm text-muted-foreground">
                      Checkout Global de alta conversão
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">Multi Moedas</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">Multi Regiões</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">+50% de conversão</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {waylinxConnected && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <CheckCircle2 className="size-3 mr-1" />Conectado
                    </Badge>
                  )}
                  <Button
                    variant={waylinxConnected ? "outline" : "default"}
                    size="sm"
                    className="gap-2"
                    onClick={() => waylinxConnected
                      ? setWaylinxOpen(true)
                      : window.open("https://app.waylinx.com.br/login", "_blank")
                    }
                  >
                    <ExternalLink className="size-4" />
                    {waylinxConnected ? "Configurar" : "Conectar"}
                  </Button>
                </div>
              </div>

              {/* Aviso de mais integrações */}
              <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm flex gap-3">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-primary" />
                <span className="text-muted-foreground">
                  Mais integrações em breve. Entre em contato com o suporte para solicitar uma integração específica.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddOfferDialog open={addOfferOpen} onOpenChange={setAddOfferOpen} onAdd={addOffer} />
      <WaylinxDialog open={waylinxOpen} onOpenChange={v => { setWaylinxOpen(v); if (!v) setWaylinxConnected(true) }} />

      {/* Revoke confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={v => { if (!v) setRevokeTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar chave de API?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A chave será invalidada imediatamente e qualquer integração que a utilize parará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90"
              onClick={() => revokeTarget && revokeApiKey(revokeTarget)}>
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}