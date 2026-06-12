// components/crm-sidebar.tsx
// ═══════════════════════════════════════════════════════════════════════════
// Sidebar única que serve tanto /crm/sellers (SPA) quanto /crm/admin/*.
// Para /crm/sellers usa query params (?view=pending|mine|all) — single page.
// Para /crm/admin usa rotas reais (/crm/admin/withdrawals, etc).
// ═══════════════════════════════════════════════════════════════════════════

"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Manager } from "@/lib/crm-auth"
import {
  Zap, BarChart3, Clock, Users, Eye, Shield, LogOut,
  ArrowDownToLine, Wallet, CreditCard, ShieldAlert, ScrollText,
  type LucideIcon,
} from "lucide-react"

const initials = (name: string) =>
  (name ?? "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("")

// ─── Nav items ───────────────────────────────────────────────────────────

interface NavItem {
  label: string
  icon: LucideIcon
  // SPA item: href apontando pra /crm/sellers com ?view=
  // Page item: href real
  href: string
  // Para destacar active quando estamos numa SPA-page com ?view=X
  matchView?: string
  badgeKey?: string  // chave em `stats` para mostrar contador
  roles?: ("manager" | "supervisor" | "admin")[]
}

interface NavSection {
  label?: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", icon: BarChart3, href: "/crm/sellers?view=dashboard", matchView: "dashboard" },
      { label: "Pendentes", icon: Clock, href: "/crm/sellers?view=pending", matchView: "pending", badgeKey: "pending" },
      { label: "Meus Sellers", icon: Users, href: "/crm/sellers?view=mine", matchView: "mine", badgeKey: "myAssignments" },
      { label: "Todos", icon: Eye, href: "/crm/sellers?view=all", matchView: "all" },
    ],
  },
  {
    label: "Equipe",
    items: [
      {
        label: "Gerentes", icon: Shield, href: "/crm/sellers?view=managers", matchView: "managers",
        roles: ["supervisor", "admin"],
      },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Visão Geral", icon: BarChart3, href: "/crm/admin/overview", roles: ["admin"] },
      { label: "Saques", icon: ArrowDownToLine, href: "/crm/admin/withdrawals", roles: ["admin"], badgeKey: "pendingWithdrawals" },
      { label: "Saldos", icon: Wallet, href: "/crm/admin/balances", roles: ["admin"] },
      { label: "Transações", icon: CreditCard, href: "/crm/admin/transactions", roles: ["admin"] },
      { label: "Chargebacks", icon: ShieldAlert, href: "/crm/admin/chargebacks", roles: ["admin"], badgeKey: "openChargebacks" },
      { label: "Auditoria", icon: ScrollText, href: "/crm/admin/audit", roles: ["admin"] },
    ],
  },
]

// ─── Componente ──────────────────────────────────────────────────────────

interface SidebarProps {
  manager: Manager
  stats: any | null
  pathname: string
  onLogout: () => void
}

export function CrmSidebar({ manager, stats, pathname, onLogout }: SidebarProps) {
  const searchParams = useSearchParams()
  const currentView = searchParams.get("view")

  const isItemActive = (item: NavItem): boolean => {
    // Páginas dentro de /crm/admin/* — comparação direta de pathname
    if (item.href.startsWith("/crm/admin/")) {
      return pathname.startsWith(item.href)
    }
    // SPA em /crm/sellers — compara ?view=
    if (pathname.startsWith("/crm/sellers") && item.matchView) {
      // dashboard é o default (sem ?view=)
      if (item.matchView === "dashboard") return !currentView || currentView === "dashboard"
      return currentView === item.matchView
    }
    return false
  }

  // Filtra seções por role e remove seções vazias
  const visibleSections = SECTIONS
    .map(sec => ({
      ...sec,
      items: sec.items.filter(item => !item.roles || item.roles.includes(manager.role)),
    }))
    .filter(sec => sec.items.length > 0)

  return (
    <aside className="w-64 bg-[#0d0d14] border-r border-zinc-800/50 flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-5 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Zap className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Koopfy CRM</p>
            <p className="text-[10px] text-zinc-500 capitalize">{manager.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {visibleSections.map((section, idx) => (
          <div key={section.label ?? `s-${idx}`} className="space-y-1">
            {section.label && (
              <p className="px-3 pt-2 pb-1 text-[9px] font-bold text-zinc-600 tracking-widest">
                {section.label}
              </p>
            )}
            {section.items.map(item => {
              const Icon = item.icon
              const active = isItemActive(item)
              const badge = item.badgeKey ? stats?.[item.badgeKey] : null

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {!!badge && (
                    <Badge className={cn(
                      "h-5 min-w-5 px-1.5 text-[10px]",
                      active ? "bg-primary/20 text-primary border-0" : "bg-zinc-700 text-zinc-300 border-0"
                    )}>
                      {badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-zinc-800/50">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/50 transition-colors">
          <Avatar className="size-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-zinc-700 text-xs font-bold text-white">
              {initials(manager.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{manager.name}</p>
            <p className="text-[10px] text-zinc-500 truncate">{manager.email}</p>
          </div>
          <button onClick={onLogout} className="text-zinc-500 hover:text-white transition-colors" aria-label="Sair">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}