"use client"

import { useSyncExternalStore } from "react"

/** Automatic ticket printing for new orders. It's a per-computer choice
 * (only the counter PC next to the printer should print), so it lives in
 * localStorage rather than in the store settings. */

const ENABLED_KEY = "ohmycookies:auto-print"
const PRINTED_KEY = "ohmycookies:auto-printed"
const CHANGE_EVENT = "ohmycookies:auto-print-change"
const PRINT_TIMEOUT_MS = 90_000
export const PRINTED_MESSAGE = "ohmycookies:ticket-printed"

function readEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) === "1"
  } catch {
    return false
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

export function useAutoPrintEnabled() {
  return useSyncExternalStore(subscribe, readEnabled, () => false)
}

export function isAutoPrintEnabled() {
  return readEnabled()
}

export function setAutoPrintEnabled(enabled: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0")
  } catch {
    // Private mode etc.: the toggle just won't stick.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Claims an order for printing on this computer. Two panel tabs open on
 * the same PC both receive the order; only the first claim prints. */
function claim(orderId: string) {
  try {
    const printed: string[] = JSON.parse(
      localStorage.getItem(PRINTED_KEY) ?? "[]",
    )
    if (printed.includes(orderId)) return false
    localStorage.setItem(
      PRINTED_KEY,
      JSON.stringify([orderId, ...printed].slice(0, 100)),
    )
    return true
  } catch {
    return true
  }
}

// Tickets print one at a time: two dialogs (or two kiosk jobs) racing in
// parallel can drop one of them.
let queue: Promise<void> = Promise.resolve()

function printInFrame(orderId: string) {
  return new Promise<void>((resolve) => {
    const frame = document.createElement("iframe")
    frame.setAttribute("aria-hidden", "true")
    frame.tabIndex = -1
    frame.style.cssText =
      "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none"

    let timeout = 0
    function done() {
      window.removeEventListener("message", onMessage)
      window.clearTimeout(timeout)
      // Give the spooler a moment before the document disappears.
      window.setTimeout(() => frame.remove(), 1500)
      resolve()
    }
    function onMessage(event: MessageEvent) {
      if (
        event.source === frame.contentWindow &&
        event.data?.type === PRINTED_MESSAGE
      ) {
        done()
      }
    }

    window.addEventListener("message", onMessage)
    timeout = window.setTimeout(done, PRINT_TIMEOUT_MS)
    // The ticket page prints itself once loaded (see PrintControls).
    frame.src = `/imprimir/pedido/${orderId}?auto=1`
    document.body.appendChild(frame)
  })
}

/** Queues the ticket of a new order; returns false when it was skipped
 * (disabled here, or another tab already took it). */
export function autoPrintOrder(orderId: string, { force = false } = {}) {
  if (!force && (!readEnabled() || !claim(orderId))) return false
  queue = queue.then(() => printInFrame(orderId))
  return true
}
