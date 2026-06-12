"use client"

// app/(auth)/verify-email/page.tsx
// Página que processa o token de verificação de email.
// O link no email aponta para esta página: https://app.../verify-email?token=xxx

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authApi, saveToken, ApiError } from "@/lib/api"

type PageStatus = "verifying" | "success" | "error" | "expired" | "pending"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const emailParam = searchParams.get("email")

  const [status, setStatus] = useState<PageStatus>("verifying")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState(emailParam ?? "")

  useEffect(() => {
    if (!token) {
      // Sem token: chegou aqui pelo login (e-mail não verificado) → estado pendente
      if (emailParam) {
        setStatus("pending")
        setMessage(`Enviamos um link de verificação para ${emailParam}. Clique no link para ativar sua conta.`)
      } else {
        setStatus("error")
        setMessage("Token não encontrado. Verifique o link do email.")
      }
      return
    }

    verify(token)
  }, [token, emailParam])

  const verify = async (t: string) => {
    setStatus("verifying")
    try {
      const res = await authApi.verifyEmail(t)

      // Salva o JWT — usuário já está autenticado após verificar o email
      saveToken(res.accessToken)

      setStatus("success")

      // Redireciona após 2s para o onboarding
      setTimeout(() => {
        router.replace(res.redirectTo ?? "/onboarding/kyc")
      }, 2000)

    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message.toLowerCase().includes("expirado")) {
          setStatus("expired")
          setMessage(err.message)
        } else if (err.message.toLowerCase().includes("já verificado")) {
          // Email já verificado → vai direto para login
          setStatus("success")
          setMessage("Email já verificado. Redirecionando para o login...")
          setTimeout(() => router.replace("/login"), 2000)
        } else {
          setStatus("error")
          setMessage(err.message)
        }
      } else {
        setStatus("error")
        setMessage("Erro inesperado. Tente novamente.")
      }
    }
  }

  const handleResend = async () => {
    if (!email.trim()) return
    try {
      await authApi.resendVerification(email)
      setMessage("Novo email enviado! Verifique sua caixa de entrada.")
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Erro ao reenviar.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <img src="/koopfy-logo.png" className="items-center h-8 transition-all duration-200 group-data-[state=collapsed]:hidden"></img>

        </div>

        {/* ── Verificando ─────────────────────────────────────────────────── */}
        {status === "verifying" && (
          <div className="space-y-4 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verificando email...</h1>
            <p className="text-muted-foreground">Aguarde um momento.</p>
          </div>
        )}

        {/* ── Sucesso ──────────────────────────────────────────────────────── */}
        {status === "success" && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Email verificado!</h1>
            <p className="text-muted-foreground">
              {message || "Sua conta foi ativada. Redirecionando..."}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecionando para o onboarding...</span>
            </div>
          </div>
        )}

        {/* ── Pendente (veio do login sem verificar) ───────────────────────── */}
        {status === "pending" && (
          <div className="space-y-6 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Verifique seu email</h1>
              <p className="text-muted-foreground">{message}</p>
            </div>

            <div className="bg-muted/50 rounded-2xl p-6 text-left space-y-4">
              <p className="text-sm font-medium text-foreground">Não recebeu o email? Reenviar</p>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button className="w-full gap-2" onClick={handleResend} disabled={!email.trim()}>
                <RefreshCw className="w-4 h-4" />
                Reenviar email
              </Button>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Voltar ao login</Link>
            </Button>
          </div>
        )}

        {/* ── Token expirado ───────────────────────────────────────────────── */}
        {status === "expired" && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-warning/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Link expirado</h1>
              <p className="text-muted-foreground">{message}</p>
            </div>

            <div className="bg-muted/50 rounded-2xl p-6 text-left space-y-4">
              <p className="text-sm font-medium text-foreground">Reenviar email de verificação</p>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <Button
                className="w-full gap-2"
                onClick={handleResend}
                disabled={!email.trim()}
              >
                <RefreshCw className="w-4 h-4" />
                Reenviar email
              </Button>
            </div>

            {message.includes("enviado") && (
              <p className="text-sm text-success">{message}</p>
            )}
          </div>
        )}

        {/* ── Erro ─────────────────────────────────────────────────────────── */}
        {status === "error" && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Erro na verificação</h1>
              <p className="text-muted-foreground">{message}</p>
            </div>
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link href="/login">Ir para o login</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/sign-up">Criar nova conta</Link>
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}