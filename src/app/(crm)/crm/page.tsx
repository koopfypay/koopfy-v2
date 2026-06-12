// app/crm/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// Rota raiz /crm — redireciona para a home da role do usuário.
// Se não tiver sessão, o CrmLayout já manda pra /crm/login automaticamente.
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./layout"
import { homeForRole } from "@/lib/crm-auth"

export default function CrmRootPage() {
  const router = useRouter()
  const { manager } = useAuth()

  useEffect(() => {
    router.replace(homeForRole(manager.role))
  }, [router, manager.role])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="size-6 animate-spin rounded-full border-2 border-zinc-700 border-t-primary" />
    </div>
  )
}