"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/(auth)/actions"

export function LogoutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      disabled={isPending}
      onClick={() => startTransition(() => logoutAction())}
    >
      <LogOut />
      Sair
    </Button>
  )
}
