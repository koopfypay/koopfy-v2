"use client"

// Landing de SSO: recebe um token curto emitido pelo backend pay (via checkout),
// autentica o seller no dash-pay sem relogar, guarda o return_url e segue pro
// passo do onboarding. Tudo client-side (lê window.location p/ evitar Suspense).

import * as React from "react"
import { Loader2 } from "lucide-react"
import { saveToken } from "@/lib/api"

export default function SsoPage() {
  React.useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search)
      const token = p.get("token")
      const ret = p.get("return")
      const next = p.get("next") || "/onboarding/kyc"

      if (token) saveToken(token)
      if (ret) sessionStorage.setItem("koopfy_return_url", ret)

      // replace (não push) p/ não deixar o token no histórico
      window.location.replace(next)
    } catch {
      window.location.replace("/onboarding/kyc")
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Conectando sua conta Koopfy Pay…</p>
    </div>
  )
}
