// app/crm/layout.tsx
// ═══════════════════════════════════════════════════════════════════════════
// Layout compartilhado de TODO /crm/*.
//
// IMPORTANTE: /crm/login está dentro deste layout, mas NÃO deve ter sidebar
// nem validação de auth (senão entra em loop). Detectamos via pathname.
//
// Para rotas autenticadas: valida token, carrega manager, renderiza sidebar.
// Para /crm/login: renderiza children direto.
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { usePathname } from "next/navigation"
import { CrmSidebar } from "@/components/crm-sidebar"
import { crmFetch, getStoredManager, Manager, redirectToLogin, UnauthorizedError } from "@/lib/crm-auth"

// ─── Auth Context ────────────────────────────────────────────────────────

interface AuthCtxValue {
  manager: Manager
  stats: any | null
  refreshStats: () => Promise<void>
  logout: () => void
}

const AuthCtx = createContext<AuthCtxValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error("useAuth deve ser usado dentro do CrmLayout")
  return ctx
}

// ─── Rotas públicas (sem layout autenticado) ──────────────────────────────
function isPublicRoute(pathname: string): boolean {
  return pathname.startsWith("/crm/login") || pathname.startsWith("/crm/forgot-password")
}

// ─── Layout ──────────────────────────────────────────────────────────────

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const publicRoute = isPublicRoute(pathname)

  const [manager, setManager] = useState<Manager | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [booting, setBooting] = useState(!publicRoute)

  const loadStats = useCallback(async () => {
    try {
      const data = await crmFetch<any>("/dashboard")
      setStats(data)
    } catch (e) {
      if (!(e instanceof UnauthorizedError)) {
        console.error("Erro ao carregar stats:", e)
      }
    }
  }, [])

  // Boot — só para rotas autenticadas
  useEffect(() => {
    if (publicRoute) return

    const stored = getStoredManager()
    if (!stored) {
      redirectToLogin()
      return
    }

    crmFetch<any>("/dashboard")
      .then(data => {
        setManager(stored)
        setStats(data)
      })
      .catch(() => {
        setManager(stored)
      })
      .finally(() => setBooting(false))
  }, [publicRoute])

  // Refresh stats em cada mudança de rota
  useEffect(() => {
    if (!publicRoute && manager) loadStats()
  }, [pathname, manager, loadStats, publicRoute])

  const logout = useCallback(() => {
    redirectToLogin()
  }, [])

  // ── Rota pública: sem sidebar, sem auth ─────────────────────────────
  if (publicRoute) {
    return <>{children}</>
  }

  // ── Rota autenticada: loading enquanto valida ───────────────────────
  if (booting || !manager) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070709]">
        <div className="size-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary" />
      </div>
    )
  }

  // ── Rota autenticada: sidebar + content ─────────────────────────────
  return (
    <AuthCtx.Provider value={{ manager, stats, refreshStats: loadStats, logout }}>
      <div className="flex bg-[#070709] min-h-screen text-white">
        <CrmSidebar manager={manager} stats={stats} pathname={pathname} onLogout={logout} />
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </AuthCtx.Provider>
  )
}