import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import {
  PAYMENT_PREFERENCE_LABEL,
  type OrderWithCustomer,
} from "@/lib/services/order"
import { formatAddress } from "@/lib/utils/address"
import { formatBRL } from "@/lib/utils/money"
import { STORE_TIME_ZONE } from "@/lib/utils/opening-hours"
import { PrintControls } from "./print-controls"

export const metadata: Metadata = {
  title: "Imprimir pedido",
  robots: { index: false, follow: false },
}

type PrintItem = {
  product_name: string
  quantity: number
  unit_price_cents: number
  subtotal_cents: number
  notes: string | null
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: STORE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Receipt-style order ticket for thermal (58/80 mm) or regular printers.
 * Lives outside the (admin) layout so nothing but the ticket prints. */
export default async function PrintOrderPage({
  params,
}: PageProps<"/imprimir/pedido/[id]">) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)
  if (!store) notFound()

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, customer:customers(name, whatsapp)")
      .eq("id", id)
      .eq("store_id", store.id)
      .maybeSingle<OrderWithCustomer & { notes: string | null }>(),
    supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_cents, subtotal_cents, notes")
      .eq("order_id", id)
      .order("created_at", { ascending: true })
      .returns<PrintItem[]>(),
  ])

  if (!order) notFound()

  const isDelivery = order.fulfillment_type === "delivery"
  const itemCount = (items ?? []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="print-page">
      <PrintControls />

      <article className="ticket">
        <header className="center">
          <p className="store">{store.name}</p>
          {store.whatsapp_number ? (
            <p>WhatsApp: {store.whatsapp_number}</p>
          ) : null}
        </header>

        <hr />

        <p className="center big">PEDIDO #{order.order_number}</p>
        <p className="center">{formatDateTime(order.created_at)}</p>
        <p className="center badge">
          {isDelivery ? "ENTREGA" : "RETIRADA NO LOCAL"}
        </p>
        {order.status === "cancelled" ? (
          <p className="center big">*** CANCELADO ***</p>
        ) : null}

        <hr />

        <section>
          <p>
            <strong>Cliente:</strong> {order.customer?.name ?? "—"}
          </p>
          {order.customer?.whatsapp ? (
            <p>
              <strong>Tel:</strong> {order.customer.whatsapp}
            </p>
          ) : null}
          {isDelivery && order.delivery_address ? (
            <p>
              <strong>Endereço:</strong> {formatAddress(order.delivery_address)}
            </p>
          ) : null}
          {isDelivery && order.delivery_zone_name ? (
            <p>
              <strong>Região:</strong> {order.delivery_zone_name}
            </p>
          ) : null}
        </section>

        <hr />

        <section>
          <p className="row head">
            <span>ITENS ({itemCount})</span>
            <span>VALOR</span>
          </p>
          {(items ?? []).map((item, index) => (
            <div key={index} className="item">
              <p className="row">
                <span>
                  {item.quantity}x {item.product_name}
                </span>
                <span>{formatBRL(item.subtotal_cents)}</span>
              </p>
              {item.quantity > 1 ? (
                <p className="muted">
                  {item.quantity} × {formatBRL(item.unit_price_cents)}
                </p>
              ) : null}
              {item.notes ? <p className="note">Obs: {item.notes}</p> : null}
            </div>
          ))}
        </section>

        <hr />

        <section>
          <p className="row">
            <span>Subtotal</span>
            <span>{formatBRL(order.subtotal_cents)}</span>
          </p>
          {isDelivery ? (
            <p className="row">
              <span>Entrega</span>
              <span>{formatBRL(order.delivery_fee_cents)}</span>
            </p>
          ) : null}
          {order.discount_cents > 0 ? (
            <p className="row">
              <span>Desconto</span>
              <span>-{formatBRL(order.discount_cents)}</span>
            </p>
          ) : null}
          <p className="row big">
            <span>TOTAL</span>
            <span>{formatBRL(order.total_cents)}</span>
          </p>
          <p className="row">
            <span>Pagamento</span>
            <span>
              {order.payment_preference
                ? PAYMENT_PREFERENCE_LABEL[order.payment_preference]
                : "A combinar"}
            </span>
          </p>
        </section>

        {order.notes ? (
          <>
            <hr />
            <p className="note">Obs. do pedido: {order.notes}</p>
          </>
        ) : null}

        <hr />
        <p className="center">Obrigado pela preferência!</p>
      </article>

      <style>{`
        :root { --ticket-width: 58mm; --print-width: 46mm; --ticket-font: 11px; }
        body { background: #f4f4f5 !important; }
        .print-page { padding: 24px 12px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .ticket {
          width: var(--ticket-width);
          background: #fff;
          color: #000;
          padding: 4mm 3mm;
          font-family: ui-monospace, "Courier New", monospace;
          font-size: var(--ticket-font);
          line-height: 1.35;
          box-shadow: 0 1px 4px rgba(0,0,0,.15);
        }
        .ticket p { margin: 0; overflow-wrap: anywhere; }
        .ticket hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
        .ticket .center { text-align: center; }
        .ticket .store { font-size: 16px; font-weight: 700; }
        .ticket .big { font-size: 15px; font-weight: 700; }
        .ticket .badge { font-weight: 700; margin-top: 2px; }
        .ticket .row { display: flex; justify-content: space-between; gap: 8px; }
        .ticket .row span:last-child { white-space: nowrap; }
        .ticket .head { font-weight: 700; margin-bottom: 2px; }
        .ticket .item { margin-bottom: 4px; }
        .ticket .muted { color: #444; padding-left: 12px; }
        .ticket .note { font-weight: 700; padding-left: 12px; }
        .ticket section > p + p { margin-top: 1px; }

        @media print {
          @page { margin: 0; }
          body { background: #fff !important; }
          .print-page { padding: 0; display: block; }
          /* Thermal heads only print a central strip (~72mm on 80mm paper,
             ~48mm on 58mm) and clip the rest, so the ticket is narrower
             than the paper and starts at the printable edge. */
          .ticket {
            box-shadow: none;
            width: var(--print-width);
            margin: 0;
            padding: 2mm 0;
            font-weight: 700;
          }
          /* Thermal paper renders grey as faint dots: print pure black. */
          .ticket, .ticket * { color: #000 !important; }
          .ticket hr { border-top-width: 2px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
