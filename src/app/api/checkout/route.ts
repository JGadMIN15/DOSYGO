import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyValue } from "@/lib/auth";

interface CartItem {
  id: string;
  quantity: number;
}

// Client-safe error: its message may be returned to the caller with `status`.
// Anything that is NOT a CheckoutError is treated as unexpected and reported
// with a generic 500 so internal details are never leaked to the client.
class CheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function isValidCuid(id: string) {
  return typeof id === "string" && /^c[a-z0-9]{24,}$/i.test(id);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --- Input validation ---
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    if (body.items.length > 50) {
      return NextResponse.json({ error: "Demasiados productos" }, { status: 400 });
    }

    const items: CartItem[] = body.items.map((item: Record<string, unknown>) => {
      if (!isValidCuid(String(item.id ?? ""))) {
        throw new CheckoutError("ID de producto no válido");
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new CheckoutError("Cantidad no válida");
      }
      return { id: String(item.id), quantity: qty };
    });

    // --- Require a valid contact phone (also enforced in the cart UI) ---
    const phone = String(body.phone ?? "").trim();
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      throw new CheckoutError("Teléfono no válido");
    }

    // --- Require a verified email (code confirmed via /api/email/verify) ---
    const email = String(body.email ?? "").trim().toLowerCase();
    const verifiedEmail = verifyValue<{ email: string; exp: number }>(
      req.cookies.get("dosygo_email_verified")?.value
    );
    if (
      !email ||
      !verifiedEmail ||
      verifiedEmail.exp * 1000 < Date.now() ||
      verifiedEmail.email !== email
    ) {
      throw new CheckoutError("Verifica tu email antes de pagar", 403);
    }

    // --- Fetch authoritative prices from DB (prevents client-side price tampering) ---
    const productIds = [...new Set(items.map((i) => i.id))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, archived: false },
      select: { id: true, name: true, price: true, stock: true, availableUntil: true },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // --- Stock and data validation ---
    for (const item of items) {
      const db = dbProducts.find((p) => p.id === item.id)!;
      if (db.availableUntil && db.availableUntil.getTime() < Date.now()) {
        return NextResponse.json(
          { error: `${db.name} ya no está disponible` },
          { status: 409 }
        );
      }
      if (db.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${db.name}` },
          { status: 409 }
        );
      }
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/[^\x20-\x7E]/g, "").trim();
    const subtotal = items.reduce((sum, item) => {
      const db = dbProducts.find((p) => p.id === item.id)!;
      return sum + db.price * item.quantity;
    }, 0);

    // --- Line items using DB prices only ---
    const lineItems = items.map((item) => {
      const db = dbProducts.find((p) => p.id === item.id)!;
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: db.name,
          },
          unit_amount: db.price,
        },
        quantity: item.quantity,
      };
    });

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: [
          "ES", "PT", "FR", "DE", "IT", "GB", "NL", "BE", "AT", "CH",
          "SE", "NO", "DK", "FI", "PL", "CZ", "SK", "HU", "RO", "BG",
          "HR", "SI", "EE", "LV", "LT", "LU", "IE", "GR", "CY", "MT",
        ],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: subtotal >= 10000 ? 0 : 599,
              currency: "eur",
            },
            display_name: "Envio estandar Europa",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 14 },
            },
          },
        },
      ],
      success_url: `${appUrl}/pedido/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/carrito`,
      metadata: {
        email,
        phone,
        items: JSON.stringify(items.map((i) => ({
          id: i.id,
          qty: i.quantity,
          price: dbProducts.find((p) => p.id === i.id)!.price,
        }))),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    // Known validation errors: safe to surface to the client.
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // Unexpected errors: log the detail server-side, return a generic message
    // so we never leak internals (DB/Stripe error text, stack hints, etc.).
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "No se pudo crear la sesión de pago" },
      { status: 500 }
    );
  }
}
