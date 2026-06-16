"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  RefreshCcw,
  MessageSquareWarning,
  Settings,
  CreditCard,
  ChevronDown,
  LogOut,
  User,
  Bell,
  CheckCircle2,
  Activity,
  HelpCircle,
  Code2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/context/auth.context"
import { useDisputeStats, useTransferTotals } from "@/hooks"

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { title: "Dashboard",     url: "/dashboard",        icon: LayoutDashboard },
  { title: "Pagamentos",    url: "/transactions",      icon: CreditCard      },
  { title: "Liquidações",   url: "/wallet",            icon: Wallet          },
  { title: "Repasses",      url: "/transfers",         icon: RefreshCcw      },
  { title: "Contestações",  url: "/disputes",          icon: MessageSquareWarning },
  { title: "Métodos",       url: "/payment-methods",   icon: ArrowLeftRight  },
  { title: "API",           url: "/api/docs",          icon: Code2           },
  { title: "Configurações", url: "/settings",          icon: Settings        },
]

// ─── Helper: iniciais do nome ─────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("")
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuth()

  // Badges dinâmicos
  const { data: disputeStats } = useDisputeStats()
  const { data: transferTotals } = useTransferTotals()

  const pendingDisputes  = disputeStats?.pending  ?? 0
  const pendingTransfers = transferTotals
    ? Math.round(
        (transferTotals.pending + transferTotals.scheduled) /
        100 // converte centavos para exibir contagem aproximada
      )
    : 0

  // Monta badges por rota
  const badges: Record<string, string | null> = {
    "/transfers": pendingTransfers > 0 ? String(pendingTransfers) : null,
    "/disputes":  pendingDisputes  > 0 ? String(pendingDisputes)  : null,
  }

  const initials = user ? getInitials(user.name) : "??"

  const handleLogout = () => {
    logout()
  }

  const handleProfile = () => {
    router.push("/settings")
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" className="border-r border-primary/15">

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <SidebarHeader className="p-4 pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="hover:bg-transparent group">
                <Link href="/dashboard" className="flex items-center">
                  {/* Encolhido: lettermark quadrado (sem distorcer o wordmark) */}
                  <div className="relative flex size-8 items-center justify-center group-data-[state=expanded]:hidden">
                    <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md group-hover:bg-primary/40 transition-colors" />
                    <div className="relative flex size-8 items-center justify-center rounded-lg bg-primary text-white font-extrabold text-base shadow-lg shadow-primary/30">
                      K
                    </div>
                  </div>
                  {/* Expandido: wordmark (menor, proporção preservada) */}
                  <img
                    src="/koopfy-logo.png"
                    className="h-6 w-auto object-contain transition-all duration-200 group-data-[state=collapsed]:hidden"
                    alt="Koopfy"
                  />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <SidebarContent className="px-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                  const badge    = badges[item.url] ?? null

                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={`relative h-11 rounded-xl transition-all duration-300 group/item ${
                              isActive
                                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg hover:from-primary hover:to-primary/90"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
                            }`}
                          >
                            <Link href={item.url} className="flex items-center gap-3 px-3">
                              <item.icon className={`size-[18px] transition-transform duration-300 ${
                                isActive ? "" : "group-hover/item:scale-110"
                              }`} />
                              <span className="font-medium text-sm flex-1">{item.title}</span>
                              {badge && (
                                <Badge
                                  variant={isActive ? "secondary" : "default"}
                                  className={`h-5 min-w-5 px-1.5 text-[10px] font-bold ${
                                    isActive
                                      ? "bg-primary-foreground/20 text-primary-foreground border-0"
                                      : "bg-primary/10 text-primary border-primary/20"
                                  }`}
                                >
                                  {badge}
                                </Badge>
                              )}
                              {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground/30 rounded-l-full" />
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Status Card ──────────────────────────────────────────────────── */}
        <div className="mx-3 mb-3 group-data-[state=collapsed]:hidden">
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3.5">
            <div className="absolute top-0 right-0 size-20 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/30">
                  <Activity className="size-4 text-primary" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-primary ring-2 ring-card" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">Operacional</p>
                  <CheckCircle2 className="size-3 text-primary" />
                </div>
                <p className="text-[10px] text-muted-foreground">Todos os sistemas ativos</p>
              </div>
            </div>
            <div className="relative mt-3 pt-3 border-t border-primary/10 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Uptime</p>
                <p className="text-xs font-bold text-primary">99.98%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Latência</p>
                <p className="text-xs font-bold text-foreground">42ms</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── User Footer ───────────────────────────────────────────────────── */}
        <SidebarFooter className="border-t border-sidebar-border/50 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="h-14 rounded-xl data-[state=open]:bg-accent data-[state=open]:text-accent-foreground hover:bg-accent transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="size-10 rounded-xl ring-2 ring-primary/20">
                        {user?.avatarUrl && (
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                        )}
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <span className="absolute -bottom-0.5 -right-0.5 flex size-3">
                        <span className="relative inline-flex size-3 rounded-full bg-primary ring-2 ring-sidebar" />
                      </span>
                    </div>

                    <div className="grid flex-1 text-left leading-tight ml-0.5">
                      <span className="font-semibold text-sm truncate">
                        {user?.name ?? "Carregando..."}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {user?.email ?? ""}
                      </span>
                    </div>

                    <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl p-2"
                  side="top"
                  align="start"
                  sideOffset={8}
                >
                  {/* Info do usuário */}
                  <div className="px-2 py-2 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Logado como</p>
                    <p className="text-sm font-semibold truncate">{user?.email ?? ""}</p>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="gap-3 cursor-pointer rounded-lg h-10"
                    onClick={handleProfile}
                  >
                    <User className="size-4" />
                    <span className="font-medium">Meu Perfil</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="gap-3 cursor-pointer rounded-lg h-10"
                    onClick={() => router.push("/settings#notifications")}
                  >
                    <Bell className="size-4" />
                    <span className="font-medium">Notificações</span>
                    {pendingDisputes > 0 && (
                      <Badge className="ml-auto h-5 min-w-5 px-1.5 bg-primary/10 text-primary border-primary/20 text-[10px]">
                        {pendingDisputes}
                      </Badge>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="gap-3 cursor-pointer rounded-lg h-10"
                    onClick={() => window.open("mailto:suporte@koopfy.com", "_blank")}
                  >
                    <HelpCircle className="size-4" />
                    <span className="font-medium">Suporte</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="gap-3 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg h-10"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    <span className="font-medium">Sair da conta</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  )
}