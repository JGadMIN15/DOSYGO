// Reservation deposit terms — shared by client + server (no heavy imports so it
// can be bundled anywhere). Charged in EUR to match the store (Stripe = "eur").
// To switch amount/currency, change these + the "eur" in the Stripe session.
export const RESERVATION_DEPOSIT_CENTS = 5000; // 50 €
export const RESERVATION_DEPOSIT_EUROS = 50;
export const RESERVATION_REFUND_DAYS = 14; // from reservation until WE have stock

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
