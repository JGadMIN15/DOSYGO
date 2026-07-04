// Reservation deposit terms — shared by client + server (no heavy imports so it
// can be bundled anywhere). Charged in EUR to match the store (Stripe = "eur").
// To switch amount/currency, change these + the "eur" in the Stripe session.
export const RESERVATION_DEPOSIT_CENTS = 5000; // 50 €
export const RESERVATION_DEPOSIT_EUROS = 50;
export const RESERVATION_REFUND_DAYS = 14; // from reservation until WE have stock
// Once we set the final price, the customer has this window to claim the deposit
// back. After it, an unclaimed/unpaid reservation may be forfeited (we keep it).
export const RESERVATION_CLAIM_HOURS = 24;

// Format of the guest reservation ticket (crypto.randomBytes(24).toString("hex")).
export const TICKET_RE = /^[a-f0-9]{48}$/;

export const RESERVATION_STATUSES = [
  "sourcing", // deposit paid, we're getting the watch
  "in_stock", // we have it; awaiting the customer's full transfer
  "completed", // fully paid
  "refunded", // not sourced within the refund window → deposit returned
  "forfeited", // customer didn't complete the transfer → we keep the deposit
  "cancelled",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  sourcing: "Buscando stock",
  in_stock: "En stock · pend. transferencia",
  completed: "Completada",
  refunded: "Señal devuelta",
  forfeited: "Señal retenida",
  cancelled: "Cancelada",
};

// Reservations that are over — no further action (no cancel button, no refund).
export const RESERVATION_TERMINAL_STATUSES: readonly string[] = [
  "completed",
  "refunded",
  "forfeited",
  "cancelled",
];

// Would cancelling the reservation *right now* return the deposit? Pure logic
// shared by the customer's ticket page and the cancel action so they agree.
// Refundable only inside the two windows the customer was promised:
//  - we haven't sourced it and the 14-day window has already elapsed, or
//  - we set the final price and the 24h claim window is still open.
// Otherwise cancelling forfeits the deposit (we keep it).
export function cancelRefundsDeposit(opts: {
  status: string;
  pricedAt: Date | null;
  createdAt: Date;
  nowMs: number;
}): boolean {
  const { status, pricedAt, createdAt, nowMs } = opts;
  if (status === "in_stock" && pricedAt) {
    return nowMs < pricedAt.getTime() + RESERVATION_CLAIM_HOURS * 3_600_000;
  }
  if (status === "sourcing") {
    return nowMs >= createdAt.getTime() + RESERVATION_REFUND_DAYS * 86_400_000;
  }
  return false;
}
