"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { refundReservationDeposit } from "@/lib/reservation-server";
import {
  cancelRefundsDeposit,
  RESERVATION_TERMINAL_STATUSES,
  TICKET_RE,
} from "@/lib/reservation";

export interface CancelResult {
  ok: boolean;
  error?: string;
  outcome?: "refunded" | "forfeited";
}

// Guest self-cancel via the secret ticket. Applies the deposit rules: refund if
// inside the promised windows (14-day sourcing failure or 24h claim window),
// otherwise the deposit is forfeited (we keep it). The ticket IS the auth.
export async function cancelReservationByTicket(ticket: string): Promise<CancelResult> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`reserva-cancel:${ip}`, 10, 10 * 60_000).allowed) {
    return { ok: false, error: "Demasiadas solicitudes. Espera unos minutos." };
  }
  if (!TICKET_RE.test(ticket)) return { ok: false, error: "Reserva no válida." };

  const r = await prisma.reservation.findUnique({ where: { ticket } });
  if (!r) return { ok: false, error: "Reserva no encontrada." };
  if (RESERVATION_TERMINAL_STATUSES.includes(r.status)) {
    return { ok: false, error: "Esta reserva ya está cerrada." };
  }

  const refunds = cancelRefundsDeposit({
    status: r.status,
    pricedAt: r.pricedAt,
    createdAt: r.createdAt,
    nowMs: Date.now(),
  });

  let depositRefunded = r.depositRefunded;
  if (refunds) depositRefunded = await refundReservationDeposit(r);

  await prisma.reservation.update({
    where: { id: r.id },
    data: { status: refunds ? "refunded" : "forfeited", depositRefunded },
  });
  revalidatePath(`/reserva/${ticket}`);
  return { ok: true, outcome: refunds ? "refunded" : "forfeited" };
}
