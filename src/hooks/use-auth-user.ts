"use client"

// hooks/use-auth-user.ts
// Hooks derivados do AuthContext para uso nos componentes do dashboard.

import { useAuth } from "@/context/auth.context"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

// ─── useAuthUser ──────────────────────────────────────────────────────────────
// Acesso direto ao usuário autenticado — lança erro se usado fora de contexto autenticado.

export function useAuthUser() {
  const { user, isAuthenticated, isLoading } = useAuth()
  return { user, isAuthenticated, isLoading }
}

// ─── useLogout ────────────────────────────────────────────────────────────────
// Logout com confirmação opcional.

export function useLogout() {
  const { logout } = useAuth()
  return logout
}

// ─── useRequireOnboarding ─────────────────────────────────────────────────────
// Usado nas páginas de onboarding para verificar o passo atual
// e impedir que o usuário pule etapas.

export function useRequireOnboarding(step: "kyc" | "operation") {
  const { user, isLoading, refreshUser } = useAuth()
  const router = useRouter()

  const checkStep = useCallback(() => {
    if (isLoading || !user) return

    if (step === "operation" && !user.kycCompleted) {
      // Tentando acessar operação sem ter feito KYC
      router.replace("/onboarding/kyc")
      return
    }

    if (user.onboardingCompleted) {
      // Onboarding já completo → vai pro dashboard
      router.replace("/dashboard")
    }
  }, [user, isLoading, step, router])

  return { user, isLoading, checkStep, refreshUser }
}

// ─── useOnboardingComplete ────────────────────────────────────────────────────
// Chamado ao final do onboarding para atualizar o contexto e redirecionar.

export function useOnboardingComplete() {
  const { refreshUser } = useAuth()
  const router = useRouter()

  const complete = useCallback(async () => {
    // Recarrega o usuário do backend (agora onboarding_completed = true)
    await refreshUser()
    router.replace("/dashboard")
  }, [refreshUser, router])

  return complete
}

