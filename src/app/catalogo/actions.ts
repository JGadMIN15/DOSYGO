"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { findBySku } from "@/lib/catalog";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface ReserveInput {
  sku: string;
  name: string;
  email: string;
  phone: string;
  note: string;
}

export interface ReserveResult {
  ok: boolean;
  error?: string;
  id?: string;
}

// Create a reservation for a catalogue model. No payment is taken — the store
// contacts the customer when the watch is available and they pay then.
export async function createReservation(input: ReserveInput): Promise<ReserveResult> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`reserve:${ip}`, 8, 10 * 60_000).allowed) {
    return { ok: false, error: "Demasiadas solicitudes. Espera unos minutos." };
  }

  const item = findBySku(String(input.sku ?? "").trim());
  if (!item) return { ok: false, error: "Modelo no encontrado en el catálogo." };

  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const phone = String(input.phone ?? "").trim();
  const note = String(input.note ?? "").trim();

  if (name.length < 2 || name.length > 100)
    return { ok: false, error: "Escribe tu nombre." };
  if (!EMAIL_RE.test(email) || email.length > 254)
    return { ok: false, error: "Introduce un email válido." };
  if (phone.length > 40) return { ok: false, error: "Teléfono no válido." };
  if (note.length > 500) return { ok: false, error: "La nota es demasiado larga." };

  try {
    const reservation = await prisma.reservation.create({
      data: {
        sku: item.sku,
        brand: item.brand,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || null,
        note: note || null,
      },
    });
    return { ok: true, id: reservation.id };
  } catch (err) {
    console.error("Reservation create failed:", err);
    return { ok: false, error: "No se pudo registrar la reserva. Inténtalo más tarde." };
  }
}
