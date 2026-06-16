"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    FileText, Upload, X, CheckCircle2, ArrowRight, ArrowLeft, Loader2,
    Building2, Flag, IdCard, Home, FileCheck2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { onboardingApi, ApiError } from "@/lib/api"

type CompanyType = "BR" | "US"

interface FileData {
    base64: string
    mime: string
    name: string
}

const MAX_FILE_MB = 8

const companyOptions = [
    {
        value: "BR" as CompanyType,
        label: "Empresa Brasileira",
        description: "CNPJ — Contrato Social e Cartão CNPJ",
        icon: <Flag className="w-5 h-5" />,
    },
    {
        value: "US" as CompanyType,
        label: "Empresa Americana (LLC)",
        description: "LLC — Documento EIN",
        icon: <Building2 className="w-5 h-5" />,
    },
]

export default function DocumentsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [companyType, setCompanyType] = useState<CompanyType | null>(null)

    // Documentos da empresa
    const [contratoSocial, setContratoSocial] = useState<FileData>()
    const [cartaoCnpj, setCartaoCnpj] = useState<FileData>()
    const [einDocument, setEinDocument] = useState<FileData>()

    // Documentos pessoais (sempre obrigatórios)
    const [identityDocument, setIdentityDocument] = useState<FileData>()
    const [proofOfResidence, setProofOfResidence] = useState<FileData>()

    // ─── Validação ───────────────────────────────────────────────────────────
    const companyDocsOk =
        companyType === "BR" ? !!contratoSocial && !!cartaoCnpj
        : companyType === "US" ? !!einDocument
        : false

    const isValid = !!companyType && companyDocsOk && !!identityDocument && !!proofOfResidence

    // ─── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return

        setLoading(true)
        setError(null)

        try {
            const res = await onboardingApi.saveDocuments({
                companyType,
                contratoSocial,
                cartaoCnpj,
                einDocument,
                identityDocument,
                proofOfResidence,
            })

            // Se o seller veio via SSO do checkout, volta pra lá ao concluir.
            const ret = typeof window !== "undefined"
                ? sessionStorage.getItem("koopfy_return_url")
                : null
            if (ret) {
                sessionStorage.removeItem("koopfy_return_url")
                window.location.href = ret
                return
            }

            router.push(res.redirectTo ?? "/onboarding/pending")
            router.refresh()

        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Erro ao enviar documentos. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <img src="/koopfy-logo.png" className="items-center h-8 transition-all duration-200" alt="Koopfy" />
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Etapa</span>
                            <span className="font-semibold text-primary">3</span>
                            <span className="text-muted-foreground">de 3</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="text-center mb-10 animate-fade-in-up">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <FileCheck2 className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Envio de Documentos</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Para concluir seu cadastro, precisamos verificar os documentos da sua empresa e os seus dados pessoais
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up animation-delay-100">
                    {/* Tipo de empresa */}
                    <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <h2 className="font-semibold text-foreground mb-2">Tipo de Empresa</h2>
                        <p className="text-sm text-muted-foreground mb-6">Selecione onde sua empresa está registrada</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {companyOptions.map((opt) => (
                                <button key={opt.value} type="button" onClick={() => setCompanyType(opt.value)}
                                    className={cn("p-5 rounded-xl border-2 text-left transition-all duration-200",
                                        companyType === opt.value
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "border-border hover:bg-muted/30")}>
                                    <div className="flex items-start gap-3">
                                        <div className={cn("mt-0.5", companyType === opt.value ? "text-primary" : "text-muted-foreground")}>
                                            {opt.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">{opt.label}</span>
                                                {companyType === opt.value && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Documentos da empresa */}
                    {companyType && (
                        <section className="p-6 rounded-2xl border border-border bg-card shadow-sm animate-fade-in">
                            <h2 className="font-semibold text-foreground mb-2">Documentos da Empresa</h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                {companyType === "BR"
                                    ? "Envie o Contrato Social e o Cartão CNPJ"
                                    : "Envie o documento EIN da sua LLC"}
                            </p>
                            <div className="space-y-4">
                                {companyType === "BR" ? (
                                    <>
                                        <FileField label="Contrato Social" hint="PDF ou imagem"
                                            icon={<FileText className="w-5 h-5" />}
                                            value={contratoSocial} onChange={setContratoSocial} onError={setError} />
                                        <FileField label="Cartão CNPJ" hint="PDF ou imagem"
                                            icon={<FileText className="w-5 h-5" />}
                                            value={cartaoCnpj} onChange={setCartaoCnpj} onError={setError} />
                                    </>
                                ) : (
                                    <FileField label="Documento EIN" hint="PDF ou imagem"
                                        icon={<FileText className="w-5 h-5" />}
                                        value={einDocument} onChange={setEinDocument} onError={setError} />
                                )}
                            </div>
                        </section>
                    )}

                    {/* Documentos pessoais */}
                    <section className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                        <h2 className="font-semibold text-foreground mb-2">Documentos Pessoais</h2>
                        <p className="text-sm text-muted-foreground mb-6">Documento de identidade e comprovante de residência</p>
                        <div className="space-y-4">
                            <FileField label="Documento de identidade" hint="CNH ou Passaporte — PDF ou imagem"
                                icon={<IdCard className="w-5 h-5" />}
                                value={identityDocument} onChange={setIdentityDocument} onError={setError} />
                            <FileField label="Comprovante de residência" hint="Conta de luz, água, etc. — PDF ou imagem"
                                icon={<Home className="w-5 h-5" />}
                                value={proofOfResidence} onChange={setProofOfResidence} onError={setError} />
                        </div>
                    </section>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => router.push("/onboarding/operation")}
                            className="h-14 rounded-xl font-semibold px-6">
                            <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
                        </Button>
                        <Button type="submit" disabled={loading || !isValid}
                            className="flex-1 h-14 rounded-xl font-semibold text-base">
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Enviando...</span>
                                </div>
                            ) : (
                                <><span>Finalizar Cadastro</span><ArrowRight className="ml-2 w-5 h-5" /></>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Campo de upload reutilizável ──────────────────────────────────────────────

function FileField({
    label, hint, icon, value, onChange, onError,
}: {
    label: string
    hint: string
    icon: React.ReactNode
    value: FileData | undefined
    onChange: (f: FileData | undefined) => void
    onError: (msg: string | null) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            onError(`"${label}" é muito grande. Máximo ${MAX_FILE_MB} MB.`)
            e.target.value = ""
            return
        }

        onError(null)
        const reader = new FileReader()
        reader.onloadend = () => {
            const dataUrl = reader.result as string
            onChange({ base64: dataUrl.split(",")[1], mime: file.type, name: file.name })
        }
        reader.readAsDataURL(file)
    }

    return (
        <div>
            <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden" onChange={handleSelect} />

            {value ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/10">
                    <div className="text-emerald-600"><CheckCircle2 className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground truncate">{value.name}</p>
                    </div>
                    <button type="button" onClick={() => { onChange(undefined); if (inputRef.current) inputRef.current.value = "" }}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button type="button" onClick={() => inputRef.current?.click()}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-muted/30 transition-all text-left">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                        {icon}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{hint}</p>
                    </div>
                    <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
            )}
        </div>
    )
}
