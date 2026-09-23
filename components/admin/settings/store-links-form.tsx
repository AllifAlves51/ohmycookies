"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
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
      <CardContent>
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
