import { Check, X } from "lucide-react"
import type { OrderStatus } from "@/lib/services/order"
import { cn } from "@/lib/utils"

const STAGES: OrderStatus[] = [
  "new",
  "preparing",
  "out_for_delivery",
  "completed",
]

export function OrderProgressDots({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500">
        <X className="size-3" />
      </span>
    )
  }

  const currentIndex = Math.max(
    STAGES.indexOf(status === "confirmed" ? "new" : status),
    0,
  )

  return (
    <div className="flex items-center">
      {STAGES.map((stage, index) => {
        const reached = index <= currentIndex
        const isLast = index === STAGES.length - 1
        return (
          <div key={stage} className="flex items-center">
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full",
                reached ? "bg-green-500" : "bg-gray-200",
              )}
            >
              {isLast && reached ? (
                <Check className="size-2.5 text-white" />
              ) : null}
            </span>
            {index < STAGES.length - 1 ? (
              <span
                className={cn(
                  "h-0.5 w-3",
                  index < currentIndex ? "bg-green-500" : "bg-gray-200",
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
