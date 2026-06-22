import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import Stripe from "stripe";

// Crypto-secure tracking code: the code acts as a bearer token granting access
// to order PII via /api/tracking, so it must not be predictable. randomInt()
// draws from crypto and avoids the modulo bias of Math.random()-based pickers.
function generateTrackingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 9; i++) code += chars[randomInt(chars.length)];
  return "DYG" + code;
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

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // --- Idempotency: Stripe delivers webhooks at-least-once and retries on
  //     non-2xx, so the same session can arrive multiple times. Never create
  //     the order (or decrement stock) twice. ---
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let itemsMeta: { id: string; qty: number; price: number }[] = [];
  try {
    const parsed = JSON.parse(session.metadata?.items ?? "[]");
    if (Array.isArray(parsed)) itemsMeta = parsed;
  } catch {
    itemsMeta = [];
  }

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

  // --- Persist the order. The unique constraint on stripeSessionId is the
  //     authoritative idempotency guard against the check-then-create race
  //     (two concurrent deliveries). On any other (transient) failure we return
  //     500 so Stripe retries instead of silently losing a paid order. ---
  // The Neon HTTP adapter does NOT support transactions, and nested writes
  // (order + items + tracking in a single create) require one. So persist the
  // order flat, then insert items/tracking with createMany (single multi-row
  // INSERTs, no transaction needed).
  let orderId: string;
  try {
    const order = await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent as string,
        status: "paid",
        total: (session.amount_total ?? 0) / 100,
        currency: session.currency ?? "eur",
        customerName: session.customer_details?.name ?? "Cliente",
        customerEmail: session.customer_details?.email ?? "",
        customerPhone: session.metadata?.phone ?? session.customer_details?.phone ?? null,
        shippingAddress,
        trackingCode,
        estimatedDelivery,
      },
    });
    orderId = order.id;
  } catch (err) {
    // Concurrent duplicate delivery won the unique-constraint race: already handled.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Error creating order:", err);
    // 500 -> Stripe retries the delivery (avoids silently dropping a paid order).
    return NextResponse.json({ error: "Order processing failed" }, { status: 500 });
  }

  // Line items + tracking timeline. Insert rows one at a time with create():
  // the Neon HTTP adapter supports single-statement writes but NOT createMany
  // or nested writes (both run inside a transaction, which it rejects).
  for (const item of itemsMeta) {
    if (!item.id || !Number.isInteger(item.qty) || item.qty <= 0) continue;
    try {
      await prisma.orderItem.create({
        data: {
          orderId,
          productId: item.id,
          quantity: item.qty,
          price: item.price,
        },
      });
    } catch (err) {
      console.error("OrderItem insert failed:", trackingCode, item.id, err);
    }
  }

  try {
    await prisma.shipmentTracking.create({
      data: {
        orderId,
        status: "confirmed",
        description: "Pedido confirmado y pago recibido",
        location: "Madrid, España",
      },
    });
    await prisma.shipmentTracking.create({
      data: {
        orderId,
        status: "processing",
        description: "Tu pedido está siendo preparado en nuestro almacén",
        location: "Madrid, España",
        timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    console.error("Tracking insert failed:", trackingCode, err);
  }

  console.log("Order created:", orderId, trackingCode);

  // --- Decrement stock. Use a raw, single-statement conditional UPDATE: it is
  //     atomic (stock never goes below 0, even with concurrent checkouts of the
  //     last unit) and works over the Neon HTTP adapter, which rejects
  //     updateMany/transactions. Best-effort: a failure must not bounce the
  //     webhook (the paid order is the source of truth). ---
  for (const i of itemsMeta) {
    if (!i.id || !Number.isInteger(i.qty) || i.qty <= 0) continue;
    try {
      const rows = await prisma.$executeRaw`
        UPDATE "Product" SET stock = stock - ${i.qty}
        WHERE id = ${i.id} AND stock >= ${i.qty}
      `;
      if (rows === 0) {
        console.error(
          `Oversell: not enough stock for product ${i.id} (qty ${i.qty}) on order ${trackingCode}. Needs manual review/refund.`
        );
      }
    } catch (err) {
      console.error("Stock decrement failed:", trackingCode, i.id, err);
    }
  }

  return NextResponse.json({ received: true });
}
