"use client"

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  Wallet, Bitcoin, ArrowRight, Shield,
  Clock, CheckCircle2, AlertCircle, Info, RefreshCcw, QrCode,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { walletApi, ApiError } from "@/lib/api"
import { useSettings, useWalletBalance } from "@/hooks"
import { useAuth } from "@/context/auth.context"

// ─── Constantes ───────────────────────────────────────────────────────────────

// 🔥 Valor mínimo de saque
const MIN_WITHDRAW = 500
const MIN_WITHDRAW_BLACK = 1000

// ─── Redes cripto ─────────────────────────────────────────────────────────────

const CRYPTO_NETWORKS = [
  { id: "trc20", name: "TRC20 (Tron)", fee: "1 USDT", time: "1-5 min" },
  { id: "erc20", name: "ERC20 (Ethereum)", fee: "15 USDT", time: "5-15 min" },
  { id: "bep20", name: "BEP20 (BSC)", fee: "0.5 USDT", time: "1-5 min" },
]

// ─── Tipos chave PIX ──────────────────────────────────────────────────────────

const PIX_KEY_TYPES = [
  { id: "cpf", label: "CPF" },
  { id: "cnpj", label: "CNPJ" },
  { id: "email", label: "E-mail" },
  { id: "phone", label: "Telefone" },
  { id: "random", label: "Aleatória" },
]

type WithdrawMethod = "pix" | "crypto"
type CryptoNetwork = "trc20" | "erc20" | "bep20"
type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random"

// ─── Props ────────────────────────────────────────────────────────────────────

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Saldo inicial (vem do componente pai). Usado como fallback até o hook
   * interno (useWalletBalance) terminar a primeira revalidação.
   * Após isso, o saldo do hook tem prioridade.
   */
  availableBalance: number
  onSuccess?: () => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function WithdrawDialog({
  open,
  onOpenChange,
  availableBalance: initialBalance,
  onSuccess,
}: WithdrawDialogProps) {
  const { data: settings } = useSettings()

  // 🔥 Hook próprio — SWR/React Query deduplica request com a página pai.
  // Quando o dialog abre, forçamos revalidação via mutate() pra garantir
  // que o saldo está fresh.
  const {
    data: balanceData,
    mutate: refreshBalance,
    isValidating: revalidating,
  } = useWalletBalance()

  const [step, setStep] = useState(1)
  const [method, setMethod] = useState<WithdrawMethod>("pix")
  const [amount, setAmount] = useState("")
  const [cryptoNetwork, setCryptoNetwork] = useState<CryptoNetwork>("trc20")
  const [cryptoAddress, setCryptoAddress] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null)

  // 🔥 Campos PIX editáveis na própria modal — começam vazios e são
  // pré-preenchidos com os dados das configurações quando o dialog abre
  // (ver useEffect abaixo). O usuário pode editar livremente.
  const [pixKeyInput, setPixKeyInput] = useState("")
  const [pixKeyTypeInput, setPixKeyTypeInput] = useState<PixKeyType>("random")
  const [pixHolderInput, setPixHolderInput] = useState("")
  const [pixBankInput, setPixBankInput] = useState("")

  // 🔥 Saldo "ativo" na UI — prioriza o hook (mais fresco), com fallback pra
  // prop inicial enquanto a primeira revalidação não retornou. Se ambos
  // estiverem indisponíveis, cai pra 0 (defesa em profundidade).
  const availableBalance = balanceData?.availableBalance ?? initialBalance ?? 0

  // 🔥 Revalida ao abrir e pré-preenche os campos PIX com os dados salvos
  // nas configurações (se existirem). O usuário pode editar depois.
  useEffect(() => {
    if (open) {
      refreshBalance()
      setPixKeyInput(settings?.pix?.key ?? "")
      setPixKeyTypeInput((settings?.pix?.keyType ?? "random") as PixKeyType)
      setPixHolderInput(settings?.pix?.accountHolder ?? "")
    }
  }, [open, refreshBalance, settings])

  // 🔥 Valores PIX "ativos" — vêm dos inputs editáveis
  const pixKey = pixKeyInput.trim()
  const pixKeyType = pixKeyTypeInput
  const pixHolder = pixHolderInput.trim()

  const pixKeyTypeLabel = PIX_KEY_TYPES.find(t => t.id === pixKeyType)?.label ?? "—"

  const numericAmount = parseFloat(amount) || 0
  const selectedNetwork = CRYPTO_NETWORKS.find(n => n.id === cryptoNetwork)

  const reset = () => {
    setStep(1); setMethod("pix"); setAmount("")
    setCryptoNetwork("trc20"); setCryptoAddress("")
    setTwoFactorCode(""); setIsProcessing(false)
    setError(null); setWithdrawalId(null)
    setPixKeyInput(""); setPixKeyTypeInput("random")
    setPixHolderInput(""); setPixBankInput("")
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const handleSubmit = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // 🔥 Validação dura no submit: refaz fetch e confere antes de enviar.
      // Protege contra:
      //   • Saque concorrente em outra aba
      //   • Refund/chargeback que reduziu saldo desde abertura
      //   • Qualquer movimentação que tenha alterado available_balance
      const fresh = await refreshBalance()
      const freshBalance = fresh?.availableBalance ?? availableBalance

      // 🔥 Revalida o mínimo no submit também (defesa em profundidade)
      if (numericAmount < MIN_WITHDRAW) {
        setError(`O valor mínimo para saque é ${fmt(MIN_WITHDRAW)}.`)
        setStep(1)
        return
      }

      if (numericAmount > freshBalance) {
        setError(
          `Saldo disponível mudou desde que você abriu o saque. ` +
          `Disponível agora: ${fmt(freshBalance)}.`,
        )
        setStep(1)
        return
      }

      const res = await walletApi.requestPayout({
        amount: numericAmount,
        method,
        cryptoAddress: method === "crypto" ? cryptoAddress : undefined,
        cryptoNetwork: method === "crypto" ? cryptoNetwork : undefined,
        pixKey: method === "pix" ? pixKey : undefined,
        pixKeyType: method === "pix" ? pixKeyType : undefined,
        pixHolder: method === "pix" ? pixHolder : undefined,
        twoFactorCode,
      })
      setWithdrawalId(res.payoutId ?? "WD-" + Date.now())
      setStep(4)
      onSuccess?.()
      // Atualiza saldo após sucesso (pra próximas chamadas verem o novo valor)
      refreshBalance()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erro ao processar saque. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  // 🔥 Step 1 só libera se: método ok, valor > 0, dentro do saldo E >= mínimo
  const canStep1 = method
    && numericAmount >= MIN_WITHDRAW
    && numericAmount <= availableBalance
  // 🔥 Step 2 PIX: exige chave e titular preenchidos
  const canStep2 = method === "pix"
    ? pixKey.length > 0 && pixHolder.length > 0
    : cryptoAddress.length > 20
  // const canStep3 = twoFactorCode.length === 6
  const canStep3 = true

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2 })
      .format(v).replace("US$", "US$ ")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="border-b border-border bg-muted/30 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="size-4 text-primary" />
            </div>
            Solicitar Saque
          </DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="border-b border-border bg-muted/20 px-6 py-3">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Valor" },
              { num: 2, label: "Destino" },
              { num: 3, label: "Confirmar" },
              { num: 4, label: "Concluído" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {step > s.num ? <CheckCircle2 className="size-4" /> : s.num}
                </div>
                <span className={cn("text-xs font-medium hidden sm:inline", step >= s.num ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </span>
                {i < 3 && <div className={cn("h-px w-6 sm:w-10", step > s.num ? "bg-primary" : "bg-border")} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-destructive text-sm">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Saldo disponível com indicador discreto de revalidação */}
              <div className="rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                      {/* 🔥 Indicador discreto de revalidação em background */}
                      {revalidating && (
                        <RefreshCcw className="size-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">{fmt(availableBalance)}</p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Wallet className="size-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Método de Saque</Label>
                <RadioGroup value={method} onValueChange={v => setMethod(v as WithdrawMethod)} className="grid grid-cols-2 gap-3">
                  {[
                    { id: "pix", label: "PIX", sub: "Instantâneo", Icon: QrCode },
                    { id: "crypto", label: "Cripto (USDT)", sub: "1-15 minutos", Icon: Bitcoin },
                  ].map(opt => {
                    const Icon = opt.Icon
                    return (
                      <Label key={opt.id} htmlFor={opt.id} className={cn(
                        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-muted/50",
                        method === opt.id ? "border-primary bg-primary/5" : "border-border"
                      )}>
                        <RadioGroupItem value={opt.id} id={opt.id} className="sr-only" />
                        <div className={cn("flex size-10 items-center justify-center rounded-lg", method === opt.id ? "bg-primary/10" : "bg-muted")}>
                          <Icon className={cn("size-5", method === opt.id ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <span className="text-sm font-medium text-center">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.sub}</span>
                      </Label>
                    )
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Valor do Saque</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">USD</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="h-12 pl-14 text-lg font-medium"
                  />
                </div>
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map(pct => (
                    <Button key={pct} type="button" variant="outline" size="sm" className="flex-1 text-xs"
                      onClick={() => setAmount((availableBalance * pct / 100).toFixed(2))}>
                      {pct}%
                    </Button>
                  ))}
                </div>

                {/* 🔥 Aviso do valor mínimo */}
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="size-3" />Valor mínimo para saque: {fmt(MIN_WITHDRAW)}
                </p>

                {/* 🔥 Erro: valor abaixo do mínimo (só mostra se digitou algo) */}
                {numericAmount > 0 && numericAmount < MIN_WITHDRAW && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" />O valor mínimo para saque é {fmt(MIN_WITHDRAW)}
                  </p>
                )}

                {numericAmount > availableBalance && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="size-3" />Valor excede o saldo disponível
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              {method === "pix" ? (
                <>
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <QrCode className="size-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Saque via PIX</p>
                        <p className="text-xs text-muted-foreground">Preencha ou confirme os dados da chave PIX de destino</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Chave</Label>
                      <RadioGroup
                        value={pixKeyTypeInput}
                        onValueChange={v => setPixKeyTypeInput(v as PixKeyType)}
                        className="grid grid-cols-3 gap-2"
                      >
                        {PIX_KEY_TYPES.map(t => (
                          <Label key={t.id} htmlFor={`pixtype-${t.id}`} className={cn(
                            "flex cursor-pointer items-center justify-center rounded-lg border-2 p-2 text-xs font-medium transition-all hover:bg-muted/50",
                            pixKeyTypeInput === t.id ? "border-primary bg-primary/5" : "border-border"
                          )}>
                            <RadioGroupItem value={t.id} id={`pixtype-${t.id}`} className="sr-only" />
                            {t.label}
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Chave PIX</Label>
                      <Input
                        placeholder={
                          pixKeyTypeInput === "cpf" ? "000.000.000-00" :
                            pixKeyTypeInput === "cnpj" ? "00.000.000/0000-00" :
                              pixKeyTypeInput === "email" ? "seuemail@exemplo.com" :
                                pixKeyTypeInput === "phone" ? "+55 (00) 00000-0000" :
                                  "chave aleatória"
                        }
                        value={pixKeyInput}
                        onChange={e => setPixKeyInput(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Titular</Label>
                        <Input
                          placeholder="Nome completo"
                          value={pixHolderInput}
                          onChange={e => setPixHolderInput(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Banco <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                        <Input
                          placeholder="Ex: Nubank"
                          value={pixBankInput}
                          onChange={e => setPixBankInput(e.target.value)}
                        />
                      </div>
                    </div>
                    {(!pixKey || !pixHolder) && (
                      <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span>Informe a chave PIX e o nome do titular para continuar.</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <Bitcoin className="size-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Saque em USDT</p>
                        <p className="text-xs text-muted-foreground">Selecione a rede e informe o endereço da carteira</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Rede</Label>
                      <RadioGroup value={cryptoNetwork} onValueChange={v => setCryptoNetwork(v as CryptoNetwork)} className="space-y-2">
                        {CRYPTO_NETWORKS.map(net => (
                          <Label key={net.id} htmlFor={net.id} className={cn(
                            "flex cursor-pointer items-center justify-between rounded-lg border-2 p-3 transition-all hover:bg-muted/50",
                            cryptoNetwork === net.id ? "border-primary bg-primary/5" : "border-border"
                          )}>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={net.id} id={net.id} />
                              <span className="text-sm font-medium">{net.name}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="size-3" />{net.time}</span>
                              <span>Taxa: {net.fee}</span>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>Endereço USDT</Label>
                      <Input
                        placeholder={`Endereço ${selectedNetwork?.name ?? "USDT"}`}
                        value={cryptoAddress}
                        onChange={e => setCryptoAddress(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>Verifique cuidadosamente o endereço e a rede. Envios para endereços ou redes incorretas resultam em perda permanente dos fundos.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3 rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor do Saque</span>
                  <span className="text-lg font-bold">{fmt(numericAmount)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Método</span>
                  <span className="text-sm font-medium">
                    {method === "pix" ? "PIX" : `USDT (${selectedNetwork?.name})`}
                  </span>
                </div>
                {method === "crypto" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Taxa de Rede</span>
                      <span className="text-sm">{selectedNetwork?.fee}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tempo Estimado</span>
                      <span className="text-sm">{selectedNetwork?.time}</span>
                    </div>
                  </>
                )}
                {method === "pix" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo de Chave</span>
                    <span className="text-sm">{pixKeyTypeLabel}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Destino</span>
                  <span className="max-w-[200px] truncate font-mono text-xs">
                    {method === "pix" ? pixKey : cryptoAddress}
                  </span>
                </div>
              </div>

              <div className="space-y-3 hidden" >
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  <Label className="text-sm font-medium">Verificação de Segurança</Label>
                </div>
                <p className="text-xs text-muted-foreground">Digite o código de 6 dígitos do seu aplicativo autenticador</p>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <Input key={i} type="text" inputMode="numeric" maxLength={1}
                      value={twoFactorCode[i] || ""}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "")
                        if (val.length <= 1) {
                          const code = twoFactorCode.split("")
                          code[i] = val
                          setTwoFactorCode(code.join(""))
                          if (val && i < 5) {
                            const next = e.target.parentElement?.children[i + 1] as HTMLInputElement
                            next?.focus()
                          }
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === "Backspace" && !twoFactorCode[i] && i > 0) {
                          const prev = (e.target as HTMLElement).parentElement?.children[i - 1] as HTMLInputElement
                          prev?.focus()
                        }
                      }}
                      className="size-12 text-center text-lg font-bold"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Ao confirmar, você autoriza a transferência do valor especificado para o destino indicado. Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Saque Solicitado</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Sua solicitação foi recebida e está sendo processada.
              </p>
              <div className="w-full space-y-2 rounded-xl bg-muted/50 p-4 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID da Transação</span>
                  <span className="font-mono text-xs">{withdrawalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-medium">{fmt(numericAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método</span>
                  <span>{method === "pix" ? "PIX" : `USDT ${selectedNetwork?.name}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-warning">Em Processamento</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/20 px-6 py-4">
          {step < 4 ? (
            <div className="flex gap-3">
              {step > 1
                ? <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Voltar</Button>
                : <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>Cancelar</Button>
              }
              {step < 3 ? (
                <Button className="flex-1 gap-2"
                  disabled={step === 1 ? !canStep1 : !canStep2}
                  onClick={() => setStep(step + 1)}>
                  Continuar <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button className="flex-1 gap-2"
                  disabled={!canStep3 || isProcessing}
                  onClick={handleSubmit}>
                  {isProcessing
                    ? <><div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />Processando...</>
                    : <><Shield className="size-4" />Confirmar Saque</>
                  }
                </Button>
              )}
            </div>
          ) : (
            <Button className="w-full" onClick={() => handleClose(false)}>Fechar</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}