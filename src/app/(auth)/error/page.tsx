import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Erro de Autenticacao</CardTitle>
          <CardDescription>
            Ocorreu um erro durante o processo de autenticacao. Por favor, tente novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">Voltar para o Login</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/sign-up">Criar Nova Conta</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
