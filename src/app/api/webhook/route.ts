import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

function generateTrackingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return "DYG" + Array.from({ length: 9 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getEstimatedDelivery(): Date {
  const date = new Date();
  // Add 2-3 business days
  let added = 0;
  while (added < 3) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added++;
  }
  return date;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const itemsMeta: { id: string; qty: number; price: number }[] = JSON.parse(
        session.metadata?.items ?? "[]"
      );

      const shipping = session.collected_information?.shipping_details;
      const shippingAddress = shipping
        ? JSON.stringify({
            name: shipping.name,
            line1: shipping.address.line1,
            line2: shipping.address.line2,
            city: shipping.address.city,
            state: shipping.address.state,
            postal_code: shipping.address.postal_code,
            country: shipping.address.country,
          })
        : "{}";

      const trackingCode = generateTrackingCode();
      const estimatedDelivery = getEstimatedDelivery();

      const order = await prisma.order.create({
        data: {
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          status: "paid",
          total: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? "eur",
          customerName: session.customer_details?.name ?? "Cliente",
          customerEmail: session.customer_details?.email ?? "",
          shippingAddress,
          trackingCode,
          estimatedDelivery,
          items: {
            create: itemsMeta.map((item) => ({
              productId: item.id,
              quantity: item.qty,
              price: item.price,
            })),
          },
          tracking: {
            create: [
              {
                status: "confirmed",
                description: "Pedido confirmado y pago recibido",
                location: "Madrid, España",
              },
              {
                status: "processing",
                description: "Tu pedido está siendo preparado en nuestro almacén",
                location: "Madrid, España",
                timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000),
              },
            ],
          },
        },
      });

      console.log("Order created:", order.id, trackingCode);
    } catch (err) {
      console.error("Error creating order:", err);
    }
  }

  return NextResponse.json({ received: true });
}
