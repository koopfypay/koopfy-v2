"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Shield, AlertTriangle, Plus, Trash2, ExternalLink,
    CheckCircle2, ArrowRight, Loader2, Sparkles, Link as LinkIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { onboardingApi, ApiError } from "@/lib/api"

type RiskLevel = "WHITE" | "GRAY" | "BLACK"

interface Offer {
    id: string
    name: string
    salesPageUrl: string
    riskLevel: RiskLevel
}

export default function OperationPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [description, setDescription] = useState("")
    const [overallRiskLevel, setOverallRiskLevel] = useState<RiskLevel | null>("WHITE")
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [offers, setOffers] = useState<Offer[]>([
        { id: "1", name: "", salesPageUrl: "", riskLevel: "WHITE" }
    ])

    const addOffer = () => setOffers(p => [...p, { id: Date.now().toString(), name: "", salesPageUrl: "", riskLevel: "WHITE" }])
    const removeOffer = (id: string) => { if (offers.length > 1) setOffers(p => p.filter(o => o.id !== id)) }
    const updateOffer = (id: string, field: keyof Offer, value: string) => {
        setOffers(p => p.map(o => o.id === id ? { ...o, [field]: value } : o))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!overallRiskLevel) return

        setLoading(true)
        setError(null)

        try {
            await onboardingApi.saveOperation({
                description,
                overallRiskLevel,
                termsAccepted,
                offers: offers.map(({ name, salesPageUrl, riskLevel }) => ({ name, salesPageUrl, riskLevel })),
            })

            // Etapa de documentos em standby — segue direto para a tela de aprovação
            router.push("/onboarding/pending")
            router.refresh()

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
                        <div className="flex items-center gap-3">
                            <img src="/koopfy-logo.png" className="items-center h-8 transition-all duration-200 group-data-[state=collapsed]:hidden"></img>

                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Etapa</span>
                            <span className="font-semibold text-primary">2</span>
                            <span className="text-muted-foreground">de 2</span>
                        </div>
                    </div>
                </div>
            </header>



            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="text-center mb-10 animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Configure sua Operação</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">Nos conte sobre seu negócio para prepararmos a melhor estrutura</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up animation-delay-100">
                    {/* Descrição */}
                    <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <h2 className="font-semibold text-foreground mb-4">Sobre sua Operação</h2>
                        <Textarea
                            placeholder="Ex: Vendo cursos de marketing digital, infoprodutos sobre investimentos..."
                            value={description} onChange={(e) => setDescription(e.target.value)}
                            rows={4} className="bg-muted/50 border-border rounded-xl resize-none" />
                    </section>

                    {/* Perfil da Operação */}
                    <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <h2 className="font-semibold text-foreground mb-2">Perfil da Operação</h2>
                        <p className="text-sm text-muted-foreground mb-6">A Koopfy é exclusiva para operações white</p>
                        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/10 p-5">
                            <div className="flex items-start gap-4">
                                <div className="text-emerald-600 mt-0.5"><Shield className="w-5 h-5" /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-base text-emerald-600">Operação White</span>
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                        Trabalhamos exclusivamente com operações legais e transparentes. É isso que nos permite
                                        oferecer aprovação ágil, as melhores taxas e total previsibilidade para você escalar sem travas.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Ofertas */}
                    <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-semibold text-foreground mb-1">Suas Ofertas</h2>
                                <p className="text-sm text-muted-foreground">Adicione as ofertas que deseja rodar conosco</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addOffer} className="rounded-lg">
                                <Plus className="w-4 h-4 mr-1.5" /> Adicionar
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {offers.map((offer, index) => (
                                <div key={offer.id} className="p-5 rounded-xl border border-border bg-muted/30 space-y-5 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <span className="text-xs font-bold text-primary">{index + 1}</span>
                                            </div>
                                            <span className="text-sm font-medium text-foreground">Oferta</span>
                                        </div>
                                        {offers.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeOffer(offer.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Nome da oferta</Label>
                                            <Input placeholder="Ex: Curso Master em Vendas" value={offer.name}
                                                onChange={(e) => updateOffer(offer.id, "name", e.target.value)}
                                                className="h-11 bg-background border-border rounded-lg" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Link da página de vendas</Label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input placeholder="https://sua-pagina.com/vendas" value={offer.salesPageUrl}
                                                    onChange={(e) => updateOffer(offer.id, "salesPageUrl", e.target.value)}
                                                    className="h-11 pl-10 pr-10 bg-background border-border rounded-lg" />
                                                {offer.salesPageUrl && (
                                                    <a href={offer.salesPageUrl} target="_blank" rel="noopener noreferrer"
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-5">
                            <div className="flex gap-4">
                                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-800 mb-1">Importante</p>
                                    <p className="text-sm text-amber-700 leading-relaxed">
                                        Toda nova oferta deverá ser adicionada em{" "}
                                        <span className="font-semibold">Configurações &gt; Ofertas</span> dentro do painel.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Termos */}
                    <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-start gap-4">
                            <Checkbox id="terms" checked={termsAccepted}
                                onCheckedChange={(v) => setTermsAccepted(v as boolean)} className="mt-1" />
                            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                                Declaro que as informações fornecidas são verdadeiras e que minha operação é white. Estou ciente
                                de que operações fora desse perfil podem resultar em suspensão da conta. Concordo com os{" "}
                                <a href="#" className="text-primary hover:underline">termos de uso</a> e{" "}
                                <a href="#" className="text-primary hover:underline">política de privacidade</a>.
                            </label>
                        </div>
                    </section>

                    <Button type="submit" disabled={loading || !overallRiskLevel || !termsAccepted}
                        className="w-full h-14 rounded-xl font-semibold text-base">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Finalizando...</span>
                            </div>
                        ) : (
                            <><span>Finalizar Cadastro</span><ArrowRight className="ml-2 w-5 h-5" /></>
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