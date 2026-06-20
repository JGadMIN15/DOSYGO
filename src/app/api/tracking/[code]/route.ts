import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const order = await prisma.order.findFirst({
    where: { trackingCode: code.toUpperCase() },
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
