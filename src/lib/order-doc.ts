import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/company";

interface DocItem {
  name: string;
  qty: number;
  unit: number;
  lineTotal: number;
}

export interface OrderDocProps {
  docNumber: string;
  dateStr: string;
  company: {
    name: string;
    nif: string;
    address: string;
    city: string;
    email: string;
    phone: string;
    site: string;
  };
  customer: { name: string; email: string; phone: string | null };
  shippingName?: string;
  shippingLines: string[];
  items: DocItem[];
  shippingCost: number;
  total: number;
  base: number;
  iva: number;
  ivaPct: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface Addr {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

function parseAddress(json: string): Addr {
  try {
    const a = JSON.parse(json);
    return a && typeof a === "object" ? (a as Addr) : {};
  } catch {
    return {};
  }
}

export async function getOrderDocProps(id: string): Promise<OrderDocProps | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return null;

  const items: DocItem[] = order.items.map((it) => ({
    name: it.product?.name ?? "Producto",
    qty: it.quantity,
    unit: it.price,
    lineTotal: round2(it.price * it.quantity),
  }));

  const itemsTotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
  const total = order.total;
  const shippingCost = round2(Math.max(0, total - itemsTotal));
  const base = round2(total / (1 + COMPANY.ivaRate));
  const iva = round2(total - base);

  const addr = parseAddress(order.shippingAddress);
  const shippingLines = [
    addr.line1,
    addr.line2,
    [addr.postal_code, addr.city].filter(Boolean).join(" "),
    [addr.state, addr.country].filter(Boolean).join(", "),
  ].filter((l): l is string => Boolean(l && l.trim()));

  return {
    docNumber: order.trackingCode ?? order.id.slice(-8).toUpperCase(),
    dateStr: order.createdAt.toLocaleDateString("es-ES"),
    company: COMPANY,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
    shippingName: addr.name,
    shippingLines,
    items,
    shippingCost,
    total,
    base,
    iva,
    ivaPct: Math.round(COMPANY.ivaRate * 100),
  };
}
