"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  updateStoreInfoAction,
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
      {pending ? "Salvando..." : "Salvar dados da loja"}
    </Button>
  )
}

export function StoreInfoForm({ store }: { store: Store }) {
  const [state, formAction] = useActionState(
    updateStoreInfoAction,
    initialState,
  )
  const address = store.address

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados da loja</CardTitle>
        <CardDescription>
          Cardápio público em /cardapio/{store.slug}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da loja</Label>
              <Input id="name" name="name" defaultValue={store.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Link do cardápio (slug)</Label>
              <Input id="slug" name="slug" defaultValue={store.slug} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp (DDD + número)</Label>
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              defaultValue={store.whatsapp_number ?? ""}
              placeholder="66999990000"
              required
            />
          </div>

          <fieldset className="space-y-4">
            <legend className="text-sm font-medium">Endereço</legend>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  name="street"
                  defaultValue={address?.street ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  name="number"
                  defaultValue={address?.number ?? ""}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  defaultValue={address?.neighborhood ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  name="complement"
                  defaultValue={address?.complement ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_80px_120px]">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={address?.city ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">UF</Label>
                <Input
                  id="state"
                  name="state"
                  maxLength={2}
                  defaultValue={address?.state ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">CEP</Label>
                <Input
                  id="zip"
                  name="zip"
                  defaultValue={address?.zip ?? ""}
                  required
                />
              </div>
            </div>
          </fieldset>

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
