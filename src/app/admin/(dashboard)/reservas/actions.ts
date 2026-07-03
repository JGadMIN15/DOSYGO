"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";

const CUID_RE = /^c[a-z0-9]{24,}$/i;
const STATUSES = ["pending", "contacted", "paid", "cancelled"] as const;

export async function updateReservationStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!CUID_RE.test(id) || !(STATUSES as readonly string[]).includes(status)) {
    redirect("/admin/reservas");
  }

  await prisma.reservation.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reservas");
  redirect("/admin/reservas");
}
