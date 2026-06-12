"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowRight, Zap, ArrowLeft, CheckCircle2, Shield, TrendingUp } from "lucide-react"
import { authApi, ApiError } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)

    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — igual ao login */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black/50">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float animation-delay-200" />
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
          <div className="animate-fade-in-up">
            <img src="/koopfy-logo.png" className="mb-6 h-10 transition-all duration-200 group-data-[state=collapsed]:hidden"></img>

            <h1 className="text-[2.4rem] font-bold leading-tight mb-6 text-white">Força para vender,<br />liberdade para escalar</h1>
            <p className="text-lg opacity-80 mb-12 max-w-md leading-relaxed text-white">
              A infraestrutura de pagamentos dos sellers profissionais. Aprovação ágil, taxas que cabem na sua margem e a estrutura certa para o seu produto crescer sem travas.
            </p>
          </div>
          <div className="space-y-6 animate-fade-in-up animation-delay-200 text-white">
            <FeatureItem icon={<Zap className="w-5 h-5" />} title="Força para vender" description="Checkout otimizado e a melhor taxa de aprovação para transformar cada visita em venda." />
            <FeatureItem icon={<TrendingUp className="w-5 h-5" />} title="Liberdade para escalar" description="Infraestrutura preparada para alto volume, que acompanha o seu ritmo sem teto." />
            <FeatureItem icon={<Shield className="w-5 h-5" />} title="Feito para profissionais" description="Plataforma exclusiva para sellers white. Ambiente seguro, estável e previsível." />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">OperaHub</span>
          </div>

          {sent ? (
            /* ── Estado: email enviado ── */
            <div className="animate-fade-in-up text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-success/10 mx-auto mb-6">
                <CheckCircle2 className="size-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Email enviado!</h2>
              <p className="text-muted-foreground mb-2">
                Enviamos um link de recuperação para:
              </p>
              <p className="font-semibold text-foreground mb-8">{email}</p>

              <div className="rounded-xl bg-muted/50 border border-border p-4 text-sm text-muted-foreground text-left mb-8 space-y-2">
                <p>• Verifique sua caixa de entrada e spam</p>
                <p>• O link expira em <strong className="text-foreground">30 minutos</strong></p>
                <p>• Se não receber, aguarde alguns minutos e tente novamente</p>
              </div>

              <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => { setSent(false); setEmail("") }}>
                Tentar com outro email
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Lembrou a senha?{" "}
                <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Voltar ao login
                </Link>
              </p>
            </div>
          ) : (
            /* ── Estado: formulário ── */
            <div className="animate-fade-in-up">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao login
              </Link>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Esqueceu a senha?</h2>
              <p className="text-muted-foreground mb-8">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm animate-scale-in">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-12 h-12 bg-muted/50 border-border rounded-xl"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading || !email} className="w-full h-12 rounded-xl font-semibold text-base">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <><span>Enviar link de recuperação</span><ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Lembrou a senha?{" "}
                <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Voltar ao login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-primary backdrop-blur-sm flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold mb-0.5">{title}</h3>
        <p className="text-sm opacity-70">{description}</p>
      </div>
    </div>
  )
}