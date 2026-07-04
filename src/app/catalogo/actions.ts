"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { getStripe } from "@/lib/stripe";
import { findBySku } from "@/lib/catalog";
import { RESERVATION_DEPOSIT_CENTS } from "@/lib/reservation";

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
  url?: string; // Stripe Checkout URL for the deposit
}

// Start a reservation: opens a Stripe Checkout to take the refundable deposit.
// The Reservation row is created by the webhook once the deposit is paid.
export async function startReservationCheckout(input: ReserveInput): Promise<ReserveResult> {
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

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();

  try {
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Señal de reserva · ${item.brand} ${item.sku}`,
              description: "Reembolsable si no conseguimos el reloj en 14 días. Se descuenta del precio final.",
            },
            unit_amount: RESERVATION_DEPOSIT_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/catalogo/reserva-confirmada?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/catalogo/${encodeURIComponent(item.sku)}`,
      metadata: {
        type: "reservation",
        sku: item.sku,
        brand: item.brand,
        name,
        email,
        phone,
        note,
      },
    });

    if (!session.url) return { ok: false, error: "No se pudo iniciar el pago." };
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("Reservation checkout failed:", err);
    return { ok: false, error: "No se pudo iniciar el pago de la señal. Inténtalo más tarde." };
  }
}
