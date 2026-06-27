import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

// Tracking codes are "DYG" + 9 crypto-random base36 chars (see webhook route).
// Validate the shape before querying so malformed/enumeration probes never
// reach the database.
const TRACKING_CODE_RE = /^DYG[A-Z0-9]{9}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // The tracking code is a bearer token to order PII — throttle lookups so the
  // code space can't be probed at speed and a leaked code can't be replayed at
  // scale.
  const ip = getClientIp(req.headers);
  if (!rateLimit(`tracking:${ip}`, 30, 10 * 60_000).allowed) {
    return NextResponse.json(
      { error: "Demasiadas consultas. Espera unos minutos." },
      { status: 429 }
    );
  }

  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();

  if (!TRACKING_CODE_RE.test(code)) {
    return NextResponse.json({ error: "Código no válido" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { trackingCode: code },
    include: {
      tracking: { orderBy: { timestamp: "asc" } },
      items: { include: { product: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    trackingCode: order.trackingCode,
    estimatedDelivery: order.estimatedDelivery,
    customerName: order.customerName,
    createdAt: order.createdAt,
    tracking: order.tracking,
    items: order.items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.price,
    })),
  });
}
