import type { AddressInput } from "@/lib/validations/store"

export function formatAddress(address: AddressInput): string {
  return [
    `${address.street}, ${address.number}`,
    address.complement,
    address.neighborhood,
    `${address.city} - ${address.state}`,
    address.zip,
  ]
    .filter(Boolean)
    .join(", ")
}
