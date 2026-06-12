// app/crm/sellers/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// SPA do CRM tradicional. Sub-views controladas por ?view= no URL.
//
// IMPORTANTE: Este arquivo PRECISA ter um `export default` (default export)
// para o Next.js App Router reconhecer como uma página.
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "../layout"

import {
  DashboardView,
  SellersListView,
  SellerDetailView,
  ManagersView,
} from "@/components/koopfy-crm"

type View = "dashboard" | "pending" | "mine" | "all" | "managers"

// ─── Componente interno (com hooks de search params) ─────────────────────

function SellersPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { manager, stats } = useAuth()

  const view = (searchParams.get("view") as View) || "dashboard"
  const sellerId = searchParams.get("seller")

  const setSellerId = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set("seller", id)
    else params.delete("seller")
    const qs = params.toString()
    router.push(`/crm/sellers${qs ? "?" + qs : ""}`)
  }

  // Detail view tem prioridade sobre outras views
  if (sellerId) {
    return <SellerDetailView sellerId={sellerId} onBack={() => setSellerId(null)} />
  }

  if (view === "dashboard") {
    return <DashboardView stats={stats} />
  }

  if (view === "managers") {
    if (!["admin", "supervisor"].includes(manager.role)) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-bold text-white">Acesso negado</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Você precisa ser supervisor ou admin para acessar esta página.
          </p>
        </div>
      )
    }
    return <ManagersView />
  }

  if (view === "pending" || view === "mine" || view === "all") {
    return <SellersListView filter={view} onSelect={setSellerId} />
  }

  // Fallback
  return <DashboardView stats={stats} />
}

// ─── DEFAULT EXPORT (obrigatório pelo Next.js App Router) ─────────────────

export default function SellersPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="h-8 w-48 bg-zinc-800/30 rounded animate-pulse" />
      </div>
    }>
      <SellersPageInner />
    </Suspense>
  )
}