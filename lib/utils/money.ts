/** Money is always stored/passed as integer cents to avoid float rounding errors. */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function centsToReais(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function reaisToCents(value: string): number {
  const amount = Number.parseFloat(value.trim().replace(",", "."))
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0
}
