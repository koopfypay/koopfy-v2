// lib/crm-auth.ts — VERSÃO COM LOGS DE DIAGNÓSTICO
// ⚠️ Use temporariamente pra descobrir por que está expulsando pro login.
// Os logs aparecem no Console do navegador (F12).

"use client"

const CRM_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.koopfy.com/pay"
const LOGIN_PATH = "/crm/login"

export type ManagerRole = "manager" | "supervisor" | "admin"

export interface Manager {
  id: string
  name: string
  email: string
  role: ManagerRole
  avatarUrl?: string
}

export class UnauthorizedError extends Error {
  constructor() { super("Sessão expirada"); this.name = "UnauthorizedError" }
}

export class ForbiddenError extends Error {
  constructor(msg = "Acesso negado") { super(msg); this.name = "ForbiddenError" }
}

export function homeForRole(role: ManagerRole): string {
  switch (role) {
    case "admin": return "/crm/admin/overview"
    case "supervisor": return "/crm/sellers?view=pending"
    case "manager": return "/crm/sellers?view=mine"
    default: return "/crm/sellers"
  }
}

export function sanitizeNextUrl(next: string | null | undefined): string | null {
  if (!next) return null
  try {
    const decoded = decodeURIComponent(next)
    if (!decoded.startsWith("/crm/")) return null
    if (decoded.startsWith("//") || decoded.includes("\\")) return null
    if (decoded.startsWith("/crm/login")) return null
    return decoded
  } catch { return null }
}

export function canAccessRoute(role: ManagerRole, path: string): boolean {
  if (path.startsWith("/crm/admin")) return role === "admin"
  if (path.includes("view=managers")) return role === "supervisor" || role === "admin"
  return path.startsWith("/crm/")
}

// ⚠️ LOG verbose pra debug — REMOVA depois de identificar o problema
export function redirectToLogin() {
  if (typeof window === "undefined") return

  console.group("🚨 [crm-auth] redirectToLogin foi chamado")
  console.log("Pathname atual:", window.location.pathname)
  console.log("Token tinha?:", !!localStorage.getItem("crm_token"))
  console.log("Manager tinha?:", !!localStorage.getItem("crm_manager"))
  console.trace("Stack trace (de onde veio):")
  console.groupEnd()

  localStorage.removeItem("crm_token")
  localStorage.removeItem("crm_manager")

  if (window.location.pathname.startsWith(LOGIN_PATH)) {
    console.log("Já estou no login, ignorando redirect")
    return
  }

  const current = window.location.pathname + window.location.search
  const nextParam = encodeURIComponent(current)
  console.log("Redirecionando para:", `${LOGIN_PATH}?next=${nextParam}`)
  window.location.href = `${LOGIN_PATH}?next=${nextParam}`
}

export function getStoredManager(): Manager | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("crm_manager")
    if (!raw) return null
    return JSON.parse(raw) as Manager
  } catch { return null }
}

export function hasRole(manager: Manager | null, required: ManagerRole | ManagerRole[]): boolean {
  if (!manager) return false
  const arr = Array.isArray(required) ? required : [required]
  return arr.includes(manager.role)
}

export async function crmFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null

  console.log(`[crmFetch] →`, opts.method ?? "GET", path, "| token:", !!token)

  if (!token) {
    console.warn("[crmFetch] ⚠️ Sem token, redirecionando para login")
    redirectToLogin()
    throw new UnauthorizedError()
  }

  const res = await fetch(`${CRM_BASE}/crm${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
  })

  console.log(`[crmFetch] ←`, res.status, path)

  if (res.status === 401) {
    const body = await res.json().catch(() => ({}))
    console.warn("[crmFetch] 🔴 401 Unauthorized em", path, "→ redirecionando")
    console.warn("[crmFetch] Body do 401:", body)
    redirectToLogin()
    throw new UnauthorizedError()
  }

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}))
    console.warn("[crmFetch] 🟡 403 Forbidden em", path)
    console.warn("[crmFetch] Body do 403:", body)
    throw new ForbiddenError(body?.message ?? "Você não tem permissão para acessar este recurso")
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error("[crmFetch] ❌ Erro", res.status, "em", path, data)
    throw new Error((data as any)?.message ?? "Erro na requisição")
  }
  return data as T
}