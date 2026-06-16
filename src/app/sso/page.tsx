"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth.context"

// Handoff SSO vindo do checkout (botão "Gerenciar no Koopfy Pay").
// URL: /sso?token=<JWT curto>&return=<url>&next=<path>
//
// Em vez de salvar o token e dar um hard reload cego (que cai no /login se o
// /auth/me falhar por qualquer motivo), aqui validamos a sessão pelo AuthContext
// e só então navegamos via SPA. O destino (ex.: /dashboard) reroteia por status
// — aprovado abre o dash; onboarding incompleto vai pro passo certo.
export default function SsoPage() {
  const router = useRouter()
  const { adoptSession } = useAuth()
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const token = p.get("token")
    const ret = p.get("return")
    const next = p.get("next") || "/dashboard"

    if (ret) sessionStorage.setItem("koopfy_return_url", ret)

    if (!token) {
      router.replace("/login")
      return
    }

    // Tira o token da URL (histórico/referrer) sem recarregar.
    window.history.replaceState({}, "", "/sso")

    adoptSession(token).then((ok) => {
      // Navegação client-side: preserva o estado de auth recém-carregado.
      // No destino, o AuthContext decide aprovado→dashboard / pendente→onboarding.
      if (ok) router.replace(next.startsWith("/") ? next : "/dashboard")
      else setFailed(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <p className="max-w-sm text-sm text-muted-foreground">
          Não foi possível conectar sua conta Koopfy Pay automaticamente. Faça login
          manualmente para continuar.
        </p>
        <button
          onClick={() => router.replace("/login")}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Ir para o login
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Conectando sua conta Koopfy Pay…</p>
    </div>
  )
}
