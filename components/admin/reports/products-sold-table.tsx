"use client"

import { useMemo, useState } from "react"
import { ArrowDown, Download, Search } from "lucide-react"
import { formatBRL } from "@/lib/utils/money"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type ProductSalesRow = {
  key: string
  name: string
  imageUrl: string | null
  quantity: number
  revenueCents: number
}

type SortKey = "quantity" | "revenue" | "name"

function SortHeader({
  value,
  current,
  onSort,
  children,
  className,
}: {
  value: SortKey
  current: SortKey
  onSort: (value: SortKey) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <th className={cn("px-3 py-2 font-medium", className)}>
      <button
        type="button"
        onClick={() => onSort(value)}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1",
          current === value && "text-foreground",
        )}
      >
        {children}
        {current === value ? <ArrowDown className="size-3" /> : null}
      </button>
    </th>
  )
}

/** Every product's sales in the selected period (not just the top 5),
 * with products that sold nothing available behind a toggle and a CSV
 * export for spreadsheets. */
export function ProductsSoldTable({
  rows,
  periodLabel,
}: {
  rows: ProductSalesRow[]
  periodLabel: string
}) {
  const [sort, setSort] = useState<SortKey>("quantity")
  const [query, setQuery] = useState("")
  const [showUnsold, setShowUnsold] = useState(false)

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          quantity: acc.quantity + row.quantity,
          revenueCents: acc.revenueCents + row.revenueCents,
        }),
        { quantity: 0, revenueCents: 0 },
      ),
    [rows],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((row) => showUnsold || row.quantity > 0)
      .filter((row) => !q || row.name.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name, "pt-BR")
        if (sort === "revenue")
          return b.revenueCents - a.revenueCents || b.quantity - a.quantity
        return b.quantity - a.quantity || b.revenueCents - a.revenueCents
      })
  }, [rows, query, showUnsold, sort])

  const unsoldCount = rows.filter((row) => row.quantity === 0).length

  function exportCsv() {
    const lines = [
      ["Produto", "Quantidade vendida", "Faturamento (R$)", "% do faturamento"],
      ...visible.map((row) => [
        row.name,
        String(row.quantity),
        (row.revenueCents / 100).toFixed(2).replace(".", ","),
        totals.revenueCents > 0
          ? ((row.revenueCents / totals.revenueCents) * 100)
              .toFixed(1)
              .replace(".", ",")
          : "0",
      ]),
    ]
    // ";" + BOM: what Excel in pt-BR opens correctly with accents.
    const csv = lines
      .map((cells) =>
        cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"),
      )
      .join("\r\n")
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `vendas-por-produto-${periodLabel.replace(/[^\w-]+/g, "_")}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Vendas por produto</CardTitle>
          <CardDescription>
            {totals.quantity} {totals.quantity === 1 ? "item" : "itens"}{" "}
            vendidos · {formatBRL(totals.revenueCents)} em produtos · pedidos
            cancelados não entram
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={exportCsv}
          disabled={visible.length === 0}
        >
          <Download />
          Baixar planilha
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1 sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto"
              className="h-9 pl-9"
            />
          </div>
          {unsoldCount > 0 ? (
            <div className="flex items-center gap-2">
              <Switch
                id="show-unsold"
                checked={showUnsold}
                onCheckedChange={setShowUnsold}
              />
              <Label htmlFor="show-unsold" className="text-sm font-normal">
                Mostrar sem vendas ({unsoldCount})
              </Label>
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
              <tr>
                <SortHeader value="name" current={sort} onSort={setSort}>
                  Produto
                </SortHeader>
                <SortHeader
                  value="quantity"
                  current={sort}
                  onSort={setSort}
                  className="text-right"
                >
                  Qtd. vendida
                </SortHeader>
                <SortHeader
                  value="revenue"
                  current={sort}
                  onSort={setSort}
                  className="text-right"
                >
                  Faturamento
                </SortHeader>
                <th className="w-40 px-3 py-2 font-medium">% do faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-muted-foreground px-3 py-8 text-center"
                  >
                    {query.trim()
                      ? "Nenhum produto encontrado."
                      : "Nenhuma venda no período."}
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const share =
                    totals.revenueCents > 0
                      ? (row.revenueCents / totals.revenueCents) * 100
                      : 0
                  return (
                    <tr
                      key={row.key}
                      className={cn(row.quantity === 0 && "text-muted-foreground")}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.imageUrl ?? "/placeholder-image.svg"}
                            alt=""
                            className="bg-muted size-8 shrink-0 rounded-md object-cover"
                          />
                          <span className="font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {row.quantity}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatBRL(row.revenueCents)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                            {share.toFixed(share > 0 && share < 1 ? 1 : 0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
