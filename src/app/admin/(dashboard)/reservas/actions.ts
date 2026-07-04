"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { getStripe } from "@/lib/stripe";
import { RESERVATION_STATUSES } from "@/lib/reservation";

const CUID_RE = /^c[a-z0-9]{24,}$/i;

export async function updateReservationStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!CUID_RE.test(id) || !(RESERVATION_STATUSES as readonly string[]).includes(status)) {
    redirect("/admin/reservas");
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) redirect("/admin/reservas");

  let depositRefunded = reservation.depositRefunded;

  // When marking a reservation as refunded, try to return the deposit through
  // Stripe (best-effort — the admin can still mark it if the refund is manual).
  if (status === "refunded" && !reservation.depositRefunded && reservation.stripePaymentId) {
    try {
      await getStripe().refunds.create({ payment_intent: reservation.stripePaymentId });
      depositRefunded = true;
    } catch (err) {
      console.error("Reservation refund failed:", err);
    }
  }

  await prisma.reservation.update({ where: { id }, data: { status, depositRefunded } });
  revalidatePath("/admin/reservas");
  redirect("/admin/reservas");
}
