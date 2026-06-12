"use client"

import { Bell, Search } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      
      <div className="flex flex-1 items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar transações, clientes..."
            className="h-9 pl-9 bg-secondary/50 border-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                3
              </span>
              <span className="sr-only">Notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificações
              <Badge variant="secondary" className="text-xs">3 novas</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-destructive" />
                <span className="font-medium">Alerta de Fraude</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Transação suspeita detectada em PT-2847
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-warning" />
                <span className="font-medium">Payout Processado</span>
              </div>
              <span className="text-xs text-muted-foreground">
                €15,000 enviado para IBAN ***4521
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-success" />
                <span className="font-medium">Novo Vendedor</span>
              </div>
              <span className="text-xs text-muted-foreground">
                TechStore Lda. completou onboarding
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
