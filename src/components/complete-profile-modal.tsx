"use client"

// Aparece SÓ quando faltam @ (instagram) ou foto — caso típico das contas
// provisionadas via checkout (que nascem sem esses campos). Quem se cadastrou
// direto no dash-pay já os tem no register, então a modal não incomoda.

import * as React from "react"
import { Loader2, Camera, Sparkles } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth.context"
import { useUpdateSettings } from "@/hooks"

export function CompleteProfileModal() {
  const { user, refreshUser } = useAuth()
  const { update, isLoading } = useUpdateSettings()

  const [dismissed, setDismissed] = React.useState(false)
  const [instagram, setInstagram] = React.useState("")
  const [avatar, setAvatar] = React.useState<{ base64: string; preview: string } | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const missingInstagram = !!user && !user.instagram
  const missingAvatar = !!user && !user.avatarUrl
  // Nudge dispensável: aparece quando falta @/foto, mas o seller pode adiar.
  const open = !!user && (missingInstagram || missingAvatar) && !dismissed

  // Pré-preenche o que já existe
  React.useEffect(() => {
    if (user?.instagram) setInstagram(user.instagram.replace(/^@+/, ""))
  }, [user?.instagram])

  const normalizedInstagram = instagram.trim()
    ? "@" + instagram.trim().replace(/^@+/, "").replace(/\s+/g, "")
    : ""

  const handleFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || "")
      setAvatar({ base64: result.split(",")[1] ?? "", preview: result })
    }
    reader.readAsDataURL(file)
  }

  // Salvar só habilita quando os campos QUE FALTAM foram preenchidos
  const canSave =
    (missingInstagram ? normalizedInstagram.length >= 2 : true) &&
    (missingAvatar ? !!avatar : true)

  const handleSave = async () => {
    setError(null)
    try {
      await update({
        section: "company",
        data: {
          ...(normalizedInstagram ? { instagram: normalizedInstagram } : {}),
          ...(avatar ? { avatarBase64: avatar.base64 } : {}),
        } as any,
      })
      await refreshUser()
      // refreshUser atualiza user → open recalcula p/ false (campos preenchidos)
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível salvar. Tente novamente.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setDismissed(true) }}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-wide text-foreground">COMPLETE SEU PERFIL</span>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">Quase lá!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione {missingAvatar && "sua foto"}{missingAvatar && missingInstagram && " e "}
              {missingInstagram && "seu @"} para finalizar seu perfil de recebimento.
            </p>
          </div>

          {/* Foto */}
          {missingAvatar && (
            <label className="group relative cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])} />
              <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-primary/30 bg-muted transition-all group-hover:border-primary">
                {avatar ? (
                  <img src={avatar.preview} alt="avatar" className="size-full object-cover" />
                ) : (
                  <Camera className="size-8 text-muted-foreground" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="text-xs font-medium text-white">Escolher</span>
                </div>
              </div>
            </label>
          )}

          {/* Instagram */}
          {missingInstagram && (
            <div className="w-full">
              <Label htmlFor="ig">Instagram</Label>
              <div className="mt-2 flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                <span className="pl-3 text-muted-foreground">@</span>
                <Input id="ig" value={instagram.replace(/^@+/, "")}
                  onChange={(e) => setInstagram(e.target.value)} placeholder="sualoja"
                  className="border-0 focus-visible:ring-0" />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex w-full gap-3 pt-1">
            <Button variant="ghost" className="flex-1 text-muted-foreground"
              onClick={() => setDismissed(true)} disabled={isLoading}>
              Agora não
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!canSave || isLoading}>
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
