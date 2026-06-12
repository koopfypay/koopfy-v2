"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, Shield, TrendingUp, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/auth.context"
import { ApiError } from "@/lib/api"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(formData.email, formData.password)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          // E-mail ainda não verificado — o backend reenvia o link automaticamente
          toast.warning("Confirme seu e-mail", {
            description: "Enviamos um novo link de verificação para o seu e-mail. Verifique sua caixa de entrada e o spam.",
          })
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
          return
        } else if (err.status === 401) {
          toast.error("E-mail ou senha inválido!")
        } else {
          toast.error(err.message)
        }
      } else {
        toast.error("Não foi possível conectar. Verifique sua conexão e tente novamente.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
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
          <div className="lg:hidden flex items-center gap-3 mb-8 animate-fade-in">
            <div className="lg:hidden flex items-center gap-3 mb-8 animate-fade-in">
              <img src="/koopfy-logo.png" className="mb-6 h-10 transition-all duration-200 group-data-[state=collapsed]:hidden"></img>

            </div>

          </div>

          <div className="animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
            <p className="text-muted-foreground mb-8">Acesse seu painel e continue escalando suas vendas</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up animation-delay-100">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="pl-12 h-12 bg-muted/50 border-border rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  className="pl-12 pr-12 h-12 bg-muted/50 border-border rounded-xl"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading || !formData.email || !formData.password}
              className="w-full h-12 rounded-xl font-semibold text-base">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                <><span>Entrar</span><ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/sign-up" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Criar conta
            </Link>
          </p>
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