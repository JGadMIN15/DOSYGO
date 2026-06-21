import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

interface CartItem {
  id: string;
  quantity: number;
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
        throw new Error("ID de producto no válido");
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new Error("Cantidad no válida");
      }
      return { id: String(item.id), quantity: qty };
    });

    // --- Fetch authoritative prices from DB (prevents client-side price tampering) ---
    const productIds = [...new Set(items.map((i) => i.id))];
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, stock: true },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // --- Stock and data validation ---
    for (const item of items) {
      const db = dbProducts.find((p) => p.id === item.id)!;
      if (db.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${db.name}` },
          { status: 409 }
        );
      }
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/[^\x00-\x7F]/g, "").trim();
    console.log("appUrl:", JSON.stringify(appUrl));
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
          unit_amount: Math.round(db.price * 100),
        },
        quantity: item.quantity,
      };
    });

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
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
              amount: subtotal >= 100 ? 0 : 500,
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
        items: JSON.stringify(items.map((i) => ({
          id: i.id,
          qty: i.quantity,
          price: dbProducts.find((p) => p.id === i.id)!.price,
        }))),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear sesión";
    console.error("Checkout error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
