"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { CustomerWithStats } from "@/lib/services/customer"
import { formatBRL } from "@/lib/utils/money"
import { CustomerDetailDialog } from "@/components/admin/customers/customer-detail-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function CustomerTable({
  customers,
}: {
  customers: CustomerWithStats[]
}) {
  if (customers.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Nenhum cliente ainda.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>WhatsApp</TableHead>
          <TableHead>Pedidos</TableHead>
          <TableHead>Total gasto</TableHead>
          <TableHead>Última compra</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <CustomerDetailDialog
            key={customer.id}
            customer={customer}
            trigger={
              <TableRow className="cursor-pointer">
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.whatsapp}</TableCell>
                <TableCell>{customer.orderCount}</TableCell>
                <TableCell>{formatBRL(customer.totalSpentCents)}</TableCell>
                <TableCell>
                  {customer.lastOrderAt
                    ? format(new Date(customer.lastOrderAt), "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "—"}
                </TableCell>
              </TableRow>
            }
          />
        ))}
      </TableBody>
    </Table>
  )
}
