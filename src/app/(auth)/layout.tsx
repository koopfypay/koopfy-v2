// app/(auth)/layout.tsx
// Layout para rotas públicas E onboarding.
// Não redireciona — o AuthContext cuida de tudo.

"use client"

import { useAuth } from "@/context/auth.context"
import { AuthLoading } from "@/components/auth-loading"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth()

  // Mostra loading apenas enquanto o token está sendo verificado
  if (isLoading) return <AuthLoading />

  // Renderiza sempre — o AuthContext decide se redireciona ou não
  return <>{children}</>
}