"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Mail, MessageCircle, Zap, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth.context"

export default function OnboardingPendingPage() {
    const { user, logout, refreshUser } = useAuth()
    const router = useRouter()
    const [checking, setChecking] = useState(false)

    // Polling a cada 30s para verificar se foi aprovado
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                await refreshUser()
                // O AuthContext vai redirecionar para /dashboard se onboarding_completed = true
            } catch { }
        }, 30_000)

        return () => clearInterval(interval)
    }, [refreshUser])

    const handleCheckStatus = async () => {
        setChecking(true)
        try {
            await refreshUser()
        } finally {
            setChecking(false)
        }
    }
    

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="lg:hidden flex items-center gap-3 mb-8 animate-fade-in">
                        <img src="/koopfy-logo.png" className="mb-6 h-10 transition-all duration-200 group-data-[state=collapsed]:hidden"></img>
                    </div>

                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={logout}>
                        <LogOut className="size-4" />Sair
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-8">

                    {/* Icon */}
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-30" />
                        <div className="relative flex size-24 items-center justify-center rounded-full bg-primary/10">
                            <Clock className="size-10 text-primary" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-3">
                        <h1 className="text-2xl font-bold">Cadastro em Análise</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            Recebemos seu cadastro, <strong>{user?.name?.split(" ")[0] ?? ""}!</strong> Nossa equipe
                            está analisando suas informações e entrará em contato em até <strong>48h úteis</strong>.
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="text-left space-y-3 rounded-2xl border border-border bg-card p-6">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">O que acontece agora</p>
                        {[
                            { icon: CheckCircle2, label: "Cadastro recebido", sub: "Seus dados foram enviados com sucesso", done: true },
                            { icon: Clock, label: "Revisão da equipe", sub: "Análise de KYC, ofertas e métodos solicitados", done: false },
                            { icon: Mail, label: "Notificação por email", sub: "Você receberá um email com o resultado", done: false },
                            { icon: Zap, label: "Conta ativada", sub: "Acesso liberado ao painel completo", done: false },
                        ].map((step, i) => {
                            const Icon = step.icon
                            return (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`flex size-8 items-center justify-center rounded-full shrink-0 ${step.done ? "bg-success/10" : "bg-muted"
                                        }`}>
                                        <Icon className={`size-4 ${step.done ? "text-success" : "text-muted-foreground"}`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${step.done ? "text-success" : "text-foreground"}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <Button className="w-full gap-2" onClick={handleCheckStatus} disabled={checking}>
                            {checking
                                ? <><div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />Verificando...</>
                                : <><CheckCircle2 className="size-4" />Verificar Status</>
                            }
                        </Button>
                        <Button variant="outline" className="w-full gap-2"
                            onClick={() => window.open("mailto:suporte@koopfypayments.com", "_blank")}>
                            <MessageCircle className="size-4" />Falar com Suporte
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Esta página atualiza automaticamente a cada 30 segundos.
                    </p>
                </div>
            </div>
        </div>
    )
}