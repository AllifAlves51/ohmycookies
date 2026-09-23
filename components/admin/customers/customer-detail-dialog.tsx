"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { CustomerWithStats } from "@/lib/services/customer"
import { STATUS_COLUMNS } from "@/lib/services/order"
import { formatAddress } from "@/lib/utils/address"
import { formatBRL } from "@/lib/utils/money"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_INFO = new Map(STATUS_COLUMNS.map((c) => [c.status, c]))

export function CustomerDetailDialog({
  customer,
  trigger,
}: {
  customer: CustomerWithStats
  trigger: React.ReactNode
}) {
  return (
    <Dialog>
      <DialogTrigger
        nativeButton={false}
        render={trigger as React.ReactElement}
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Pedidos</p>
              <p className="font-semibold">{customer.orderCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total gasto</p>
              <p className="font-semibold">
                {formatBRL(customer.totalSpentCents)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Última compra</p>
              <p className="font-semibold">
                {customer.lastOrderAt
                  ? format(new Date(customer.lastOrderAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground text-xs">WhatsApp</p>
            <p>{customer.whatsapp}</p>
          </div>

          {customer.address ? (
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground text-xs">Endereço</p>
              <p>{formatAddress(customer.address)}</p>
            </div>
          ) : null}

          <div>
            <p className="text-muted-foreground mb-2 text-xs">
              Histórico de pedidos
            </p>
            {customer.orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum pedido ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.order_number}</TableCell>
                      <TableCell>
                        {format(
                          new Date(order.created_at),
                          "dd/MM/yyyy HH:mm",
                          {
                            locale: ptBR,
                          },
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_INFO.get(order.status)?.badgeClassName}
                        >
                          {STATUS_INFO.get(order.status)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatBRL(order.total_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
