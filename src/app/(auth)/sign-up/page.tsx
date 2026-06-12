"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Camera, Instagram, User, Phone, Mail, Lock,
    Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, Shield, Zap, TrendingUp
} from "lucide-react"
import { authApi, saveToken, ApiError } from "@/lib/api"

export default function SignUpPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        name: "", instagram: "", whatsapp: "",
        email: "", password: "", confirmPassword: "",
    })
    const [profileImage, setProfileImage] = useState<string | null>(null)   // data URL para preview
    const [profileImageBase64, setProfileImageBase64] = useState<string>()  // base64 puro para upload
    const [profileImageMime, setProfileImageMime] = useState<string>()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState(1)

    // ─── Imagem de perfil ───────────────────────────────────────────────────────

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Valida tamanho no client antes de enviar
        if (file.size > 3 * 1024 * 1024) {
            setError("Imagem muito grande. Máximo 3 MB.")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const dataUrl = reader.result as string
            setProfileImage(dataUrl)                             // preview
            setProfileImageBase64(dataUrl.split(',')[1])         // base64 puro
            setProfileImageMime(file.type)
        }
        reader.readAsDataURL(file)
    }

    // ─── Formatadores ───────────────────────────────────────────────────────────

    const formatWhatsApp = (value: string) => {
        const n = value.replace(/\D/g, "")
        if (n.length <= 2) return n
        if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
        if (n.length <= 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
        return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
    }

    const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(p => ({ ...p, whatsapp: formatWhatsApp(e.target.value) }))
    }

    const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\s/g, "").toLowerCase()
        if (v.length > 0 && !v.startsWith("@")) v = "@" + v
        setFormData(p => ({ ...p, instagram: v }))
    }

    // ─── Validações ─────────────────────────────────────────────────────────────

    const isStep1Valid =
        formData.name.length >= 3 &&
        formData.instagram.length >= 2

    const whatsappDigits = formData.whatsapp.replace(/\D/g, "")
    const isStep2Valid =
        whatsappDigits.length >= 10 &&
        formData.email.includes("@") &&
        formData.password.length >= 8 &&
        formData.password === formData.confirmPassword

    // ─── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isStep2Valid) return

        setIsLoading(true)
        setError(null)

        try {
            await authApi.register({
                name: formData.name,
                instagram: formData.instagram,
                whatsapp: whatsappDigits,   // backend recebe só dígitos
                email: formData.email,
                password: formData.password,
                profileImageBase64,          // undefined se não selecionou
                profileImageMime,
            })

            // Armazena email para a página de sucesso poder exibir e reenviar
            sessionStorage.setItem('signup_email', formData.email)

            router.push("/sign-up-success")

        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Erro ao criar conta. Tente novamente.")
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
                            Crie sua conta na plataforma de pagamentos dos sellers profissionais. Aprovação ágil, taxas que cabem na sua margem e a estrutura certa para o seu produto crescer sem travas.
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
                        <img src="/koopfy-logo.png" className="mb-6 h-10 transition-all duration-200 group-data-[state=collapsed]:hidden"></img>

                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex gap-1.5">
                            <div className={`h-1 w-8 rounded-full transition-colors ${currentStep >= 1 ? 'bg-foreground' : 'bg-border'}`} />
                            <div className={`h-1 w-8 rounded-full transition-colors ${currentStep >= 2 ? 'bg-foreground' : 'bg-border'}`} />
                        </div>
                        <span className="text-xs text-muted-foreground">Passo {currentStep} de 2</span>
                    </div>

                    <div className="animate-fade-in-up animation-delay-100">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                            {currentStep === 1 ? "Crie sua conta" : "Informações de acesso"}
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            {currentStep === 1 ? "Comece configurando seu perfil" : "Configure suas credenciais de acesso"}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm animate-scale-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ── Step 1 ── */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-fade-in-up" key="step1">
                                {/* Avatar */}
                                <div className="flex flex-col items-center">
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                                        className="hidden" onChange={handleImageSelect} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                        className="group relative w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-border hover:border-primary transition-all duration-300 bg-muted/50">
                                        {profileImage ? (
                                            <Image src={profileImage} alt="Profile" fill className="object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                                <Camera className="w-8 h-8 mb-1" />
                                                <span className="text-xs font-medium">Adicionar</span>
                                            </div>
                                        )}
                                        {profileImage && (
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </button>
                                    <p className="text-sm text-muted-foreground mt-3">Foto de perfil (opcional)</p>
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome completo</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input id="name" type="text" placeholder="Seu nome completo"
                                            value={formData.name}
                                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                            className="pl-12 h-12 bg-muted/50 border-border rounded-xl" required />
                                    </div>
                                </div>

                                {/* Instagram */}
                                <div className="space-y-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <div className="relative">
                                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input id="instagram" type="text" placeholder="@seuarroba"
                                            value={formData.instagram} onChange={handleInstagramChange}
                                            className="pl-12 h-12 bg-muted/50 border-border rounded-xl" required />
                                    </div>
                                </div>

                                <Button type="button" onClick={() => setCurrentStep(2)} disabled={!isStep1Valid}
                                    className="w-full h-12 rounded-xl font-semibold text-base">
                                    Continuar <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        )}

                        {/* ── Step 2 ── */}
                        {currentStep === 2 && (
                            <div className="space-y-5 animate-fade-in-up" key="step2">
                                {/* WhatsApp */}
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp">WhatsApp</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input id="whatsapp" type="tel" placeholder="(00) 00000-0000"
                                            value={formData.whatsapp} onChange={handleWhatsAppChange}
                                            className="pl-12 h-12 bg-muted/50 border-border rounded-xl" required />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input id="email" type="email" placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                            className="pl-12 h-12 bg-muted/50 border-border rounded-xl" required />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input id="password" type={showPassword ? "text" : "password"}
                                            placeholder="Mínimo 8 caracteres" minLength={8}
                                            value={formData.password}
                                            onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                                            className="pl-12 pr-12 h-12 bg-muted/50 border-border rounded-xl" required />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirme sua senha"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData(p => ({ ...p, confirmPassword: e.target.value }))}
                                            className="pl-12 pr-12 h-12 bg-muted/50 border-border rounded-xl" required />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                        <p className="text-sm text-destructive">As senhas não coincidem</p>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}
                                        className="flex-1 h-12 rounded-xl font-semibold">
                                        <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
                                    </Button>
                                    <Button type="submit" disabled={!isStep2Valid || isLoading}
                                        className="flex-[2] h-12 rounded-xl font-semibold text-base">
                                        {isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                                <span>Criando conta...</span>
                                            </div>
                                        ) : (
                                            <><span>Criar conta</span><ArrowRight className="ml-2 w-5 h-5" /></>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Já tem uma conta?{" "}
                        <span
                            onClick={() => router.push('/login')}
                            className="font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                        >
                            Fazer login
                        </span>
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

function StepIndicator({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
    const isActive = currentStep >= step
    const isCurrent = currentStep === step
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
        ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
        ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                {isActive && step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
            </div>
            <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
        </div>
    )
}