"use client"

import { useActionState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import {
  createCategoryAction,
  toggleCategoryActiveAction,
  type ProductActionState,
} from "@/app/(admin)/produtos/actions"
import type { Category } from "@/lib/services/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

const initialState: ProductActionState = {}

function AddButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adicionando..." : "Adicionar"}
    </Button>
  )
}

function CategoryRow({ category }: { category: Category }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
      <span
        className={category.active ? "" : "text-muted-foreground line-through"}
      >
        {category.name}
      </span>
      <Switch
        size="sm"
        checked={category.active}
        disabled={isPending}
        onCheckedChange={(checked) =>
          startTransition(() =>
            toggleCategoryActiveAction(category.id, checked),
          )
        }
      />
    </div>
  )
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createCategoryAction, initialState)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma categoria cadastrada ainda.
          </p>
        ) : null}
      </div>
      <form action={formAction} className="flex items-end gap-2">
        <Input
          name="name"
          placeholder="Nova categoria"
          className="max-w-56"
          required
        />
        <AddButton />
      </form>
      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  )
}
