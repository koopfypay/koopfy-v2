"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import { authApi, saveToken, getToken, clearToken } from "@/lib/api"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:                      string
  name:                    string
  email:                   string
  avatarUrl:               string | null
  instagram?:              string
  whatsapp?:               string
  kycCompleted:            boolean
  operationSetupCompleted: boolean
  onboardingCompleted:     boolean
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
  user:            AuthUser | null
  status:          AuthStatus
  pendingRedirect: string | null
}

interface AuthContextValue {
  user:                    AuthUser | null
  status:                  AuthStatus
  isLoading:               boolean
  isAuthenticated:         boolean
  operationSetupCompleted: boolean
  login:       (email: string, password: string) => Promise<void>
  logout:      () => void
  refreshUser: () => Promise<void>
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = [
  "/login",
  "/sign-up",
  "/sign-up-success",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/error",
  // SSO vindo do checkout: salva o token (da URL) e recarrega já autenticado.
  // Precisa ser "pública" senão o provider redireciona pro login ANTES do token
  // ser salvo. O próprio /sso controla a navegação seguinte.
  "/sso",
]

const SKIP_AUTH_REDIRECT = [
  "/sign-up-success",
  "/verify-email",
  "/reset-password",
  "/sso",
]

const ONBOARDING_ROUTES = [
  "/onboarding/kyc",
  "/onboarding/operation",
  "/onboarding/documents",
  "/onboarding/pending",
]

const DEFAULT_AFTER_LOGIN = "/dashboard"
const RESOLVE_MARKER      = "__resolve__"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(route + "/")
}

function inList(pathname: string, routes: string[]): boolean {
  return routes.some(r => matchRoute(pathname, r))
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const [state, setState] = useState<AuthState>({
    user:            null,
    status:          "loading",
    pendingRedirect: null,
  })

  const fetchingRef      = useRef(false)
  const lastNavDest      = useRef<string | null>(null)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Resolve destino ─────────────────────────────────────────────────────

  const resolveDestination = useCallback((u: AuthUser, hint?: string | null): string => {
    // Onboarding tem prioridade absoluta
    if (!u.kycCompleted)            return "/onboarding/kyc"
    if (!u.operationSetupCompleted) return "/onboarding/operation"
    if (!u.onboardingCompleted)     return "/onboarding/pending"

    // Hint só é usado se onboarding completo e não for o marcador interno
    if (hint && hint !== RESOLVE_MARKER && hint.startsWith("/") && !inList(hint, PUBLIC_ROUTES)) {
      return hint
    }

    return DEFAULT_AFTER_LOGIN
  }, [])

  // ─── Mapeia resposta da API ───────────────────────────────────────────────
  // Aceita tanto snake_case (vindo do /auth/me) quanto camelCase (vindo do /auth/login)

  function mapUser(data: any): AuthUser {
    return {
      id:                      data.id,
      name:                    data.name,
      email:                   data.email,
      avatarUrl:               data.avatar_url               ?? data.avatarUrl               ?? null,
      instagram:               data.instagram                ?? undefined,
      whatsapp:                data.whatsapp                 ?? undefined,
      kycCompleted:            data.kyc_completed            ?? data.kycCompleted            ?? false,
      operationSetupCompleted: data.operation_setup_completed ?? data.operationSetupCompleted ?? false,
      onboardingCompleted:     data.onboarding_completed      ?? data.onboardingCompleted      ?? false,
    }
  }

  // ─── Carrega sessão ───────────────────────────────────────────────────────

  const loadUser = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    const token = getToken()

    if (!token) {
      setState(s => ({ ...s, user: null, status: "unauthenticated" }))
      fetchingRef.current = false
      return
    }

    try {
      const data = await authApi.me()
      setState(s => ({ ...s, status: "authenticated", user: mapUser(data) }))
    } catch {
      clearToken()
      setState(s => ({ ...s, user: null, status: "unauthenticated" }))
    } finally {
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  // ─── Redirect ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const { status, user, pendingRedirect } = state

    if (status === "loading")                return
    if (status === "authenticated" && !user) return
    if (pathname.startsWith("/crm"))         return

    const isPublic     = inList(pathname, PUBLIC_ROUTES)
    const isOnboarding = inList(pathname, ONBOARDING_ROUTES)
    const skipRedirect = inList(pathname, SKIP_AUTH_REDIRECT)

    const navigate = (dest: string) => {
      // Já está no destino
      if (pathname === dest) return
      // Já navegamos para este destino recentemente (pathname ainda não atualizou)
      if (lastNavDest.current === dest) return

      lastNavDest.current = dest
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)

      router.replace(dest)

      // Limpa após 2s — tempo suficiente para o pathname atualizar
      redirectTimerRef.current = setTimeout(() => {
        lastNavDest.current    = null
        redirectTimerRef.current = null
      }, 2000)
    }

    // ── Não autenticado em rota protegida → login ─────────────────────────
    if (status === "unauthenticated" && !isPublic && !isOnboarding) {
      navigate(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    // ── Autenticado com pendingRedirect → processa UMA VEZ e limpa ────────
    if (status === "authenticated" && user && pendingRedirect) {
      const dest = resolveDestination(user, pendingRedirect)
      setState(s => ({ ...s, pendingRedirect: null }))
      navigate(dest)
      return
    }

    // ── Autenticado em página pública → destino correto ───────────────────
    if (status === "authenticated" && user && isPublic && !skipRedirect && !pendingRedirect) {
      navigate(resolveDestination(user))
      return
    }

    // ── Aprovado em /onboarding/pending → dashboard ───────────────────────
    if (
      status === "authenticated" && user &&
      pathname === "/onboarding/pending" &&
      user.onboardingCompleted
    ) {
      navigate(DEFAULT_AFTER_LOGIN)
      return
    }

    // ── Onboarding incompleto fora das rotas de onboarding ────────────────
    if (status === "authenticated" && user && !isPublic && !isOnboarding) {
      const dest = resolveDestination(user)
      if (inList(dest, ONBOARDING_ROUTES) && pathname !== dest) {
        navigate(dest)
      }
    }

  }, [state, pathname, router, resolveDestination])

  // ─── Login ────────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    saveToken(res.accessToken)

    const authUser = mapUser(res.user)

    const params  = new URLSearchParams(window.location.search)
    const nextUrl = params.get("next")
    const hint    =
      nextUrl && nextUrl.startsWith("/") && !inList(nextUrl, PUBLIC_ROUTES)
        ? nextUrl
        : RESOLVE_MARKER

    setState({
      status:          "authenticated",
      user:            authUser,
      pendingRedirect: hint,
    })
  }, [])

  // ─── Logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearToken()
    lastNavDest.current = null
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    setState({ user: null, status: "unauthenticated", pendingRedirect: null })
    router.replace("/login")
  }, [router])

  // ─── Refresh ──────────────────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    fetchingRef.current = false  // 🔥 reseta o lock antes de recarregar
    await loadUser()
  }, [loadUser])

  // ─── Value ────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{
      user:                    state.user,
      status:                  state.status,
      isLoading:               state.status === "loading",
      isAuthenticated:         state.status === "authenticated",
      operationSetupCompleted: state.user?.operationSetupCompleted ?? false,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}