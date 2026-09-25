"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { Check, Copy, ExternalLink } from "lucide-react"
import {
  updateStoreLinksAction,
  type SettingsActionState,
} from "@/app/(admin)/configuracoes/actions"
import type { Store } from "@/lib/services/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const initialState: SettingsActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar links"}
    </Button>
  )
}

function CardapioLink({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only value (origin isn't known during SSR); there's no external "change" event to subscribe to instead.
    setOrigin(window.location.origin)
  }, [])

  const path = `/cardapio/${slug}`
  const fullUrl = origin ? `${origin}${path}` : path

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to do.
    }
  }

  return (
    <div className="space-y-2 border-b pb-4">
      <Label htmlFor="cardapioLink">Link do cardápio público</Label>
      <div className="flex items-center gap-2">
        <Input id="cardapioLink" value={fullUrl} readOnly className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Copiar link"
          onClick={handleCopy}
        >
          {copied ? <Check className="text-green-600" /> : <Copy />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Abrir cardápio"
          nativeButton={false}
          render={<a href={path} target="_blank" rel="noopener noreferrer" />}
        >
          <ExternalLink />
        </Button>
      </div>
    </div>
  )
}

export function StoreLinksForm({ store }: { store: Store }) {
  const [state, formAction] = useActionState(
    updateStoreLinksAction,
    initialState,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Links</CardTitle>
        <CardDescription>
          Exibidos como ícones no cardápio público
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardapioLink slug={store.slug} />
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram</Label>
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              placeholder="https://instagram.com/sualoja"
              defaultValue={store.instagram_url ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook</Label>
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              placeholder="https://facebook.com/sualoja"
              defaultValue={store.facebook_url ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Site</Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://sualoja.com.br"
              defaultValue={store.website_url ?? ""}
            />
          </div>
          {state.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="text-sm" role="status">
              {state.success}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
