"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, MapPin, Calendar, FileText, ArrowRight, Zap, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { onboardingApi, ApiError } from "@/lib/api"

export default function KYCPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [loadingCep, setLoadingCep] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        fullName: "", cpf: "", birthDate: "",
        cep: "", street: "", number: "", complement: "",
        neighborhood: "", city: "", state: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(p => ({ ...p, [name]: value }))
    }

    const formatCPF = (v: string) => {
        const n = v.replace(/\D/g, "")
        if (n.length <= 3) return n
        if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
        if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
        return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`
    }

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(p => ({ ...p, cpf: formatCPF(e.target.value) }))
    }

    const formatCEP = (v: string) => {
        const n = v.replace(/\D/g, "")
        return n.length <= 5 ? n : `${n.slice(0, 5)}-${n.slice(5, 8)}`
    }

    const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCEP(e.target.value)
        setFormData(p => ({ ...p, cep: formatted }))
        const digits = formatted.replace(/\D/g, "")
        if (digits.length === 8) {
            setLoadingCep(true)
            try {
                const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
                const data = await res.json()
                if (!data.erro) {
                    setFormData(p => ({
                        ...p,
                        street: data.logradouro || "",
                        neighborhood: data.bairro || "",
                        city: data.localidade || "",
                        state: data.uf || "",
                    }))
                }
            } catch { /* silencioso — usuário pode preencher manualmente */ }
            finally { setLoadingCep(false) }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await onboardingApi.saveKyc({
                fullName: formData.fullName,
                cpf: formData.cpf.replace(/\D/g, ""),       // envia só números
                birthDate: formData.birthDate,
                cep: formData.cep.replace(/\D/g, ""),
                street: formData.street,
                number: formData.number,
                complement: formData.complement || undefined,
                neighborhood: formData.neighborhood,
                city: formData.city,
                state: formData.state,
            })

            router.push("/onboarding/operation")

        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Erro ao salvar. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <img src="/koopfy-logo.png" className="items-center h-8 transition-all duration-200 group-data-[state=collapsed]:hidden"></img>

                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Etapa</span>
                            <span className="font-semibold text-primary">1</span>
                            <span className="text-muted-foreground">de 3</span>
                        </div>
                    </div>
                </div>
            </header>

            

            <div className="max-w-2xl mx-auto px-6 py-12">
                <div className="text-center mb-10 animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Verificação de Identidade</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Precisamos validar algumas informações para garantir a segurança da sua conta
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up animation-delay-100">
                    {/* Dados pessoais */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-border">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <h2 className="font-semibold text-foreground">Dados Pessoais</h2>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="fullName">Nome completo</Label>
                                <Input id="fullName" name="fullName" placeholder="Seu nome completo"
                                    value={formData.fullName} onChange={handleChange}
                                    className="h-12 bg-muted/50 border-border rounded-xl" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input id="cpf" name="cpf" placeholder="000.000.000-00"
                                    value={formData.cpf} onChange={handleCPFChange}
                                    maxLength={14} className="h-12 bg-muted/50 border-border rounded-xl" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Data de nascimento</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input id="birthDate" name="birthDate" type="date"
                                        value={formData.birthDate} onChange={handleChange}
                                        className="h-12 pl-12 bg-muted/50 border-border rounded-xl" required />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Endereço */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-border">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <h2 className="font-semibold text-foreground">Endereço</h2>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-6">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="cep">CEP</Label>
                                <div className="relative">
                                    <Input id="cep" name="cep" placeholder="00000-000"
                                        value={formData.cep} onChange={handleCEPChange}
                                        maxLength={9} className="h-12 bg-muted/50 border-border rounded-xl pr-10" required />
                                    {loadingCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />}
                                </div>
                            </div>
                            <div className="space-y-2 sm:col-span-4">
                                <Label htmlFor="street">Rua</Label>
                                <Input id="street" name="street" placeholder="Nome da rua"
                                    value={formData.street} onChange={handleChange}
                                    className="h-12 bg-muted/50 border-border rounded-xl" required />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="number">Número</Label>
                                <Input id="number" name="number" placeholder="123"
                                    value={formData.number} onChange={handleChange}
                                    className="h-12 bg-muted/50 border-border rounded-xl" required />
                            </div>
                            <div className="space-y-2 sm:col-span-4">
                                <Label htmlFor="complement">Complemento <span className="text-muted-foreground">(opcional)</span></Label>
                                <Input id="complement" name="complement" placeholder="Apto, bloco, etc."
                                    value={formData.complement} onChange={handleChange}
                                    className="h-12 bg-muted/50 border-border rounded-xl" />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input id="neighborhood" name="neighborhood" placeholder="Seu bairro"
                                    value={formData.neighborhood} onChange={handleChange}
                                    className="h-12 bg-muted/50 border-border rounded-xl" required />
                            </div>
                            <div className="space-y-2 sm:col-span-3">
                                <Label htmlFor="city">Cidade</Label>
                                <Input id="city" name="city" placeholder="Sua cidade"
                                    value={formData.city} onChange={handleChange}
                                    className="h-12 bg-muted/50 border-border rounded-xl" required />
                            </div>
                            <div className="space-y-2 sm:col-span-1">
                                <Label htmlFor="state">UF</Label>
                                <Input id="state" name="state" placeholder="SP" maxLength={2}
                                    value={formData.state} onChange={handleChange}
                                    className="h-12 bg-muted/50 border-border rounded-xl uppercase" required />
                            </div>
                        </div>
                    </section>

                    <Button type="submit" disabled={loading} className="w-full h-14 rounded-xl font-semibold text-base">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Salvando...</span>
                            </div>
                        ) : (
                            <><span>Continuar</span><ArrowRight className="ml-2 w-5 h-5" /></>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}

function StepBadge({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
    const isActive = currentStep >= step
    const isComplete = currentStep > step
    return (
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
        ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
            </span>
        </div>
    )
}