"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle2, ArrowRight, Zap } from "lucide-react"

export default function SignUpSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md text-center border rounded p-6">
                {/* Logo */}
                <img src="/koopfy-logo.png" className="mx-auto mb-12 mt-6 h-10 transition-all duration-200 group-data-[state=collapsed]:hidden"></img>


                {/* Success Icon */}
                <div className="relative mb-8 animate-scale-in inline-block">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="animate-fade-in-up animation-delay-100">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                        Verifique seu email
                    </h1>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        Enviamos um link de confirmacao para o seu email.
                        Clique no link para ativar sua conta e comecar a usar a plataforma.
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-muted/50 rounded-2xl p-6 mb-8 animate-fade-in-up animation-delay-200 text-left">
                    <h3 className="font-semibold text-foreground mb-3">
                        Nao recebeu o email?
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Verifique sua pasta de spam ou lixo eletronico</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>Confirme se digitou o email corretamente</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>O link expira em 24 horas</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="space-y-4 animate-fade-in-up animation-delay-300">
                    <Link href="/login">
                        <Button className="w-full h-12 rounded-xl font-semibold mb-6">
                            Ir para o login
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        Precisa de ajuda?{" "}
                        <a href="mailto:suporte@koopfypayments.com" className="text-primary hover:text-primary/80 font-medium">
                            Entre em contato
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
