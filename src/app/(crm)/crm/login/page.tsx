// app/crm/login/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// Tela de login do CRM.
//
// Fluxo de redirect após login bem-sucedido:
//   1. Tem ?next= válido? → vai pra lá (se permitido pela role)
//   2. Senão (ou rota negada): vai pra home da role
//      - admin       → /crm/admin/overview
//      - supervisor  → /crm/sellers?view=pending
//      - manager     → /crm/sellers?view=mine
//
// Também: se já está logado, redireciona imediatamente (evita re-login).
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { canAccessRoute, getStoredManager, homeForRole, Manager, sanitizeNextUrl } from "@/lib/crm-auth"


const CRM_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3007"

function CrmLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRaw = searchParams.get("next")
  const nextUrl = sanitizeNextUrl(nextRaw)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Se já está logado, redireciona imediatamente ──────────────────────
  useEffect(() => {
    const stored = getStoredManager()
    const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null

    if (stored && token) {
      const target = pickRedirectTarget(stored, nextUrl)
      router.replace(target)
      return
    }
    setCheckingSession(false)
  }, [router, nextUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${CRM_BASE}/crm/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message ?? "Credenciais inválidas")

      localStorage.setItem("crm_token", data.accessToken)
      localStorage.setItem("crm_manager", JSON.stringify(data.manager))

      const target = pickRedirectTarget(data.manager, nextUrl)
      router.replace(target)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Loading enquanto verifica sessão existente
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 mb-4">
            <Shield className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Koopfy CRM</h1>
          <p className="text-sm text-zinc-500 mt-1">Acesso exclusivo para a equipe interna</p>
        </div>

        {nextUrl && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-zinc-400 text-center">
            Faça login para continuar para <code className="text-primary">{nextUrl}</code>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-sm">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white h-12 focus:border-primary/50"
              placeholder="gerente@koopfypayments.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-sm">Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white h-12"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-12 font-semibold mt-2"
          >
            {loading ? "Entrando..." : "Entrar no CRM"}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-700 mt-8">
          Este painel é restrito à equipe Koopfy.<br />
          Acesso não autorizado é monitorado e registrado.
        </p>
      </div>
    </div>
  )
}

// ─── Helper de roteamento pós-login ──────────────────────────────────────
// Regras:
//   1. Tem ?next= sanitizado E a role pode acessar → vai pra lá
//   2. Tem ?next= mas a role não pode acessar → vai pra home da role
//   3. Sem ?next= → vai pra home da role
function pickRedirectTarget(manager: Manager, nextUrl: string | null): string {
  if (nextUrl && canAccessRoute(manager.role, nextUrl)) {
    return nextUrl
  }
  return homeForRole(manager.role)
}

// useSearchParams precisa de Suspense boundary
export default function CrmLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary" />
      </div>
    }>
      <CrmLoginInner />
    </Suspense>
  )
}