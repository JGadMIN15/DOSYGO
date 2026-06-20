import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const { items }: { items: CartItem[] } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          description: "Reloj Dos&Go - Envío a toda Europa en hasta 14 días hábiles",
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
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
              amount: items.reduce((s, i) => s + i.price * i.quantity, 0) >= 100 ? 0 : 500,
              currency: "eur",
            },
            display_name: "Envío estándar Europa",
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
        items: JSON.stringify(items.map((i) => ({ id: i.id, qty: i.quantity, price: i.price }))),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Error al crear sesión de pago" }, { status: 500 });
  }
}
