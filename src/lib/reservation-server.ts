import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getStripe } from "@/lib/stripe";

// Unguessable bearer token (192 bits) the guest customer uses to access their
// reservation without an account — /reserva/<ticket>.
export function newReservationTicket(): string {
  return randomBytes(24).toString("hex");
}

type ReservationRow = Awaited<ReturnType<typeof prisma.reservation.findUnique>>;

// Idempotently create the reservation for a PAID deposit session. Both the
// Stripe webhook and the confirmation page call this — whoever runs first
// creates the row (unique stripeSessionId dedupes the race); the other reads it.
// Returns the reservation (with its ticket) or null if the session isn't a paid
// reservation deposit.
export async function ensureReservationForSession(
  session: Stripe.Checkout.Session,
): Promise<ReservationRow> {
  if (session.metadata?.type !== "reservation") return null;
  if (session.payment_status !== "paid") return null;

  const existing = await prisma.reservation.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) return existing;

  const m = session.metadata;
  try {
    return await prisma.reservation.create({
      data: {
        sku: String(m.sku ?? "").slice(0, 100),
        brand: String(m.brand ?? "").slice(0, 100),
        customerName: (String(m.name ?? "").trim() || session.customer_details?.name || "Cliente").slice(0, 100),
        customerEmail: String(m.email ?? session.customer_details?.email ?? "").toLowerCase().slice(0, 254),
        customerPhone: m.phone ? String(m.phone).slice(0, 40) : null,
        note: m.note ? String(m.note).slice(0, 500) : null,
        depositCents: session.amount_total ?? 5000,
        stripeSessionId: session.id,
        stripePaymentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        status: "sourcing",
        ticket: newReservationTicket(),
      },
    });
  } catch (err) {
    // Race with the concurrent creator: fall back to reading the existing row.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return prisma.reservation.findUnique({ where: { stripeSessionId: session.id } });
    }
    throw err;
  }
}

// Best-effort Stripe refund of the deposit. Returns true if the deposit is (now
// or already) refunded. Shared by the admin panel and the customer cancel flow.
export async function refundReservationDeposit(reservation: {
  depositRefunded: boolean;
  stripePaymentId: string | null;
}): Promise<boolean> {
  if (reservation.depositRefunded) return true;
  if (!reservation.stripePaymentId) return false;
  try {
    await getStripe().refunds.create({ payment_intent: reservation.stripePaymentId });
    return true;
  } catch (err) {
    console.error("Reservation refund failed:", err);
    return false;
  }
}
