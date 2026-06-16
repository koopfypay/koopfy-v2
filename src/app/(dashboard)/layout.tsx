'use client'

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/context/auth.context"
import { AuthLoading } from "@/components/auth-loading"
import { CompleteProfileModal } from "@/components/complete-profile-modal"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

   const { isLoading, isAuthenticated } = useAuth()

  // Enquanto resolve → mostra loading (evita flash de conteúdo protegido)
  if (isLoading) return <AuthLoading />

  // Não autenticado → AuthContext já redirecionou para /auth/login
  // Renderiza null para não piscar o conteúdo
  if (!isAuthenticated) return null


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      {/* Nudge p/ completar @ + foto (contas provisionadas via checkout) */}
      <CompleteProfileModal />
    </SidebarProvider>
  )
}


