"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuantityStepper({
  quantity,
  onChange,
  min = 0,
  max,
}: {
  quantity: number
  onChange: (quantity: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={quantity <= min}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus />
      </Button>
      <span className="w-5 text-center text-sm tabular-nums">{quantity}</span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={max !== undefined && quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus />
      </Button>
    </div>
  )
}
