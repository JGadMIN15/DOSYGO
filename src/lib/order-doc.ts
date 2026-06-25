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

// CUIDs are strings; turn one into a stable positive integer (sum of char codes).
function idNum(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum;
}

function dayNum(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function nearestPrime(n: number): number {
  const k = Math.max(2, Math.round(n));
  for (let d = 0; d < 100000; d++) {
    if (k - d >= 2 && isPrime(k - d)) return k - d;
    if (isPrime(k + d)) return k + d;
  }
  return 2;
}

// Invoice number per the requested scheme:
//   base = AAAAMMDD(fecha pedido) + idNum(producto) + idNum(producto)
//   on collision: += nearestPrime(round(idNum(producto) / idNum(venta))), repeated.
async function invoiceNumberFor(orderId: string): Promise<number> {
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      createdAt: true,
      items: { select: { productId: true }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  const used = new Set<number>();
  let result = 0;
  for (const o of orders) {
    const pid = o.items[0]?.productId ?? o.id;
    let num = dayNum(o.createdAt) + idNum(pid) + idNum(pid);
    const step = nearestPrime(Math.round(idNum(pid) / Math.max(1, idNum(o.id))));
    while (used.has(num)) num += step;
    used.add(num);
    if (o.id === orderId) result = num;
  }
  return result;
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

  const number = await invoiceNumberFor(id);

  return {
    docNumber: String(number),
    dateStr: order.createdAt.toLocaleDateString("es-ES"),
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
