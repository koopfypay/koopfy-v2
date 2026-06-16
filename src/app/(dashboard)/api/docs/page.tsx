"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Check, Copy, KeyRound, Webhook, ShieldCheck, AlertTriangle } from "lucide-react"

const PROD_URL = "https://api.koopfy.com/pay/payments/mbway"

const CURL_EXAMPLE = `curl -X POST ${PROD_URL} \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: pedido-123" \\
  -d '{
    "amount": 500,
    "currency": "EUR",
    "customer": {
      "name": "Lucas Silva",
      "email": "lucas@exemplo.com",
      "phone": "912345678"
    },
    "return_url": "https://sualoja.com/obrigado",
    "postback_url": "https://sualoja.com/webhooks/koopfy",
    "reference": "PEDIDO-123"
  }'`

const RESPONSE_EXAMPLE = `{
  "success": true,
  "transactionId": "8f3a...-uuid",
  "status": "requires_action",
  "redirectUrl": "https://pay.sentinel.../hosted/abc123",
  "reference": "PEDIDO-123"
}`

const WEBHOOK_EXAMPLE = `{
  "id": "evt_1718...",
  "event": "payment.approved",
  "created_at": "2026-06-16T20:00:00.000Z",
  "data": {
    "status": "approved",
    "transactionId": "8f3a...-uuid",
    "amount": 500,
    "currency": "EUR",
    "externalReference": "PEDIDO-123",
    "metadata": {}
  }
}`

const SIGNATURE_EXAMPLE = `const crypto = require('crypto');

const expected = 'sha256=' + crypto
  .createHmac('sha256', SEU_WEBHOOK_SECRET)
  .update(rawBody)            // corpo CRU, sem reparsear
  .digest('hex');

const ok = crypto.timingSafeEqual(
  Buffer.from(expected),
  Buffer.from(req.headers['x-nexor-signature']),
);`

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard indisponível */ }
  }
  return (
    <div className="relative group">
      {lang && (
        <span className="absolute left-3 top-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          {lang}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={copy}
        className="absolute right-2 top-2 h-7 w-7 opacity-70 hover:opacity-100"
        aria-label="Copiar"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <pre className="overflow-x-auto rounded-lg bg-muted/60 border p-4 pt-8 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function Endpoint({ method, path }: { method: string; path: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <Badge className="bg-emerald-600 hover:bg-emerald-600">{method}</Badge>
      <span className="break-all">{path}</span>
    </div>
  )
}

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">API Koopfy Pay — MB Way</h1>
          <Badge variant="secondary">v1</Badge>
        </div>
        <p className="text-muted-foreground">
          Gere pagamentos <strong>MB Way</strong> e receba a URL de redirecionamento
          para o cliente confirmar no app. O resultado final chega no seu webhook.
        </p>
      </header>

      {/* Autenticação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Autenticação</CardTitle>
          <CardDescription>Use sua chave secreta no header de toda chamada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock code={`Authorization: Bearer sk_live_xxxxxxxxxxxxxxxx`} />
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            Nunca exponha a <code>sk_live_</code> no frontend — use sempre a partir do seu servidor.
            A chave fica disponível em <strong>Configurações</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Criar pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Criar um pagamento MB Way</CardTitle>
          <Endpoint method="POST" path={PROD_URL} />
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Parâmetros (body JSON)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Obrig.</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-sm">
                <TableRow><TableCell className="font-mono">amount</TableCell><TableCell>number</TableCell><TableCell>✅</TableCell><TableCell>Valor em <strong>centavos</strong> (500 = €5,00)</TableCell></TableRow>
                <TableRow><TableCell className="font-mono">currency</TableCell><TableCell>string</TableCell><TableCell>—</TableCell><TableCell>Sempre <code>EUR</code> (default)</TableCell></TableRow>
                <TableRow><TableCell className="font-mono">customer.name</TableCell><TableCell>string</TableCell><TableCell>✅</TableCell><TableCell>Nome do cliente</TableCell></TableRow>
                <TableRow><TableCell className="font-mono">customer.email</TableCell><TableCell>string</TableCell><TableCell>✅</TableCell><TableCell>E-mail do cliente</TableCell></TableRow>
                <TableRow><TableCell className="font-mono">customer.phone</TableCell><TableCell>string</TableCell><TableCell>—</TableCell><TableCell>Telemóvel MB Way (PT/ES). Se omitido, o cliente informa na página</TableCell></TableRow>
                <TableRow><TableCell className="font-mono">return_url</TableCell><TableCell>URL</TableCell><TableCell>—</TableCell><TableCell>Para onde o cliente volta após pagar</TableCell></TableRow>
                <TableRow><TableCell className="font-mono">postback_url</TableCell><TableCell>URL</TableCell><TableCell>—</TableCell><TableCell>Seu webhook que recebe o resultado</TableCell></TableRow>
                <TableRow><TableCell className="font-mono">reference</TableCell><TableCell>string</TableCell><TableCell>—</TableCell><TableCell>Sua referência interna (volta no webhook)</TableCell></TableRow>
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              Envie um header <code>Idempotency-Key</code> único por pedido para evitar cobranças duplicadas em retries.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Exemplo de requisição</h3>
            <CodeBlock code={CURL_EXAMPLE} lang="bash" />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Resposta</h3>
            <CodeBlock code={RESPONSE_EXAMPLE} lang="json" />
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecione o cliente para o <code>redirectUrl</code>. O status{" "}
              <code>requires_action</code> significa “aguardando o cliente pagar” — o
              resultado final vem por webhook.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" /> Webhook (resultado)</CardTitle>
          <CardDescription>Enviamos um POST para o seu <code>postback_url</code> quando o pagamento muda de estado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock code={WEBHOOK_EXAMPLE} lang="json" />
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="border-emerald-500 text-emerald-600">payment.approved — pago</Badge>
            <Badge variant="outline" className="border-red-500 text-red-600">payment.failed — recusado/expirado</Badge>
            <Badge variant="outline" className="border-amber-500 text-amber-600">payment.refunded — estornado</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Responda <strong>HTTP 200</strong> para confirmar o recebimento (reenviamos até 3x em caso de falha).
          </p>
        </CardContent>
      </Card>

      {/* Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Verificação de assinatura</CardTitle>
          <CardDescription>
            Se você configurar um webhook secret, assinamos o corpo com HMAC-SHA256 no header{" "}
            <code>X-Nexor-Signature</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock code={SIGNATURE_EXAMPLE} lang="javascript" />
        </CardContent>
      </Card>

      {/* Boas práticas */}
      <Card>
        <CardHeader><CardTitle>Boas práticas</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Sempre envie um <code>Idempotency-Key</code> único por pedido.</li>
            <li>Considere o pagamento confirmado <strong>apenas após</strong> receber <code>payment.approved</code> no webhook — não confie só no retorno do <code>return_url</code>.</li>
            <li>Valide a assinatura do webhook antes de processar.</li>
            <li>Em falha, a resposta segue o padrão <code>{`{ statusCode, message, error }`}</code>.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
