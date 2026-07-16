import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CUID_RE = /^c[a-z0-9]{24,}$/i;

// Re-checks cart items against the DB so the cart can drop products that were
// removed/archived/expired and flag ones that are out of stock. Fail-open: on
// any error it reports nothing removed (never wipe a cart on a transient issue).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids
          .filter((x: unknown) => typeof x === "string" && CUID_RE.test(x))
          .slice(0, 50)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ removedIds: [], outOfStockIds: [], prices: {} });
    }

    const now = Date.now();
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, archived: false },
      select: { id: true, price: true, stock: true, availableUntil: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const removedIds: string[] = []; // gone / archived / expired → drop from cart
    const outOfStockIds: string[] = []; // exists but stock 0 → keep, but block checkout
    const prices: Record<string, number> = {}; // current DB price (céntimos)

    for (const id of ids) {
      const p = byId.get(id);
      if (!p) {
        removedIds.push(id);
        continue;
      }
      if (p.availableUntil && p.availableUntil.getTime() < now) {
        removedIds.push(id);
        continue;
      }
      if (p.stock <= 0) outOfStockIds.push(id);
      prices[id] = p.price;
    }

    return NextResponse.json({ removedIds, outOfStockIds, prices });
  } catch {
    return NextResponse.json({ removedIds: [], outOfStockIds: [], prices: {} });
  }
}
