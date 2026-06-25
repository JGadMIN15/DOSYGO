export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";

function fmtDate(d: Date): string {
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMoney(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

interface Buyer {
  tracking: string | null;
  date: Date;
  name: string;
  email: string;
  phone: string | null;
  qty: number;
  price: number;
  status: string;
}

interface SoldProduct {
  productId: string;
  name: string;
  brand: string;
  archived: boolean;
  createdAt: Date;
  units: number;
  revenue: number;
  orders: Set<string>;
  firstSale: Date | null;
  buyers: Buyer[];
}

const PAGE_SIZE = 10;

export default async function VendidosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const orderItems = await prisma.orderItem.findMany({
    include: {
      order: true,
      product: {
        select: { id: true, name: true, brand: true, createdAt: true, archived: true },
      },
    },
  });

  const map = new Map<string, SoldProduct>();
  for (const it of orderItems) {
    let agg = map.get(it.productId);
    if (!agg) {
      agg = {
        productId: it.productId,
        name: it.product.name,
        brand: it.product.brand,
        archived: it.product.archived,
        createdAt: it.product.createdAt,
        units: 0,
        revenue: 0,
        orders: new Set<string>(),
        firstSale: null,
        buyers: [],
      };
      map.set(it.productId, agg);
    }
    agg.units += it.quantity;
    agg.revenue += it.price * it.quantity;
    agg.orders.add(it.orderId);
    if (!agg.firstSale || it.order.createdAt < agg.firstSale) {
      agg.firstSale = it.order.createdAt;
    }
    agg.buyers.push({
      tracking: it.order.trackingCode,
      date: it.order.createdAt,
      name: it.order.customerName,
      email: it.order.customerEmail,
      phone: it.order.customerPhone,
      qty: it.quantity,
      price: it.price,
      status: it.order.status,
    });
  }

  const sold = [...map.values()].sort((a, b) => b.units - a.units);
  sold.forEach((p) => p.buyers.sort((a, b) => b.date.getTime() - a.date.getTime()));

  const totalUnits = sold.reduce((s, p) => s + p.units, 0);
  const totalRevenue = sold.reduce((s, p) => s + p.revenue, 0);

  const filtered = q
    ? sold.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    : sold;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (p: number) =>
    `/admin/vendidos?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Vendidos</h1>
      <p className="text-sm text-gray-500 mb-4">
        Registro de productos vendidos (incluye los eliminados). {sold.length}{" "}
        {sold.length === 1 ? "producto" : "productos"} · {totalUnits} unidades ·{" "}
        {fmtMoney(totalRevenue)} en total
      </p>

      <form method="GET" className="flex gap-2 mb-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar producto…"
          className="flex-1 max-w-md rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        />
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Buscar
        </button>
        {q && (
          <a href="/admin/vendidos" className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-900">
            Limpiar
          </a>
        )}
      </form>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-500">
          {q ? "Sin resultados para tu búsqueda." : "Todavía no se ha vendido ningún producto."}
        </div>
      ) : (
        <div className="space-y-4">
          {pageItems.map((p) => (
            <div key={p.productId} className="bg-white rounded-xl border border-gray-200 p-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{p.name}</span>
                  <span className="text-xs text-gray-400">{p.brand}</span>
                  {p.archived && (
                    <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Eliminado
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-gray-900">{fmtMoney(p.revenue)}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Unidades vendidas</p>
                  <p className="font-semibold text-gray-900">{p.units}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Pedidos</p>
                  <p className="font-semibold text-gray-900">{p.orders.size}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Tardó en venderse</p>
                  <p className="font-semibold text-gray-900">
                    {p.firstSale ? `${daysBetween(p.createdAt, p.firstSale)} días` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">Primera venta</p>
                  <p className="font-semibold text-gray-900">
                    {p.firstSale ? fmtDate(p.firstSale) : "—"}
                  </p>
                </div>
              </div>

              {/* Buyers */}
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
                  Compradores
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-gray-400">
                      <tr>
                        <th className="py-1 pr-4 font-medium">Fecha</th>
                        <th className="py-1 pr-4 font-medium">Cliente</th>
                        <th className="py-1 pr-4 font-medium">Contacto</th>
                        <th className="py-1 pr-4 font-medium">Uds.</th>
                        <th className="py-1 pr-4 font-medium">Importe</th>
                        <th className="py-1 pr-4 font-medium">Pedido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {p.buyers.map((b, idx) => (
                        <tr key={idx} className="text-gray-700">
                          <td className="py-1.5 pr-4 whitespace-nowrap text-gray-500">
                            {fmtDate(b.date)}
                          </td>
                          <td className="py-1.5 pr-4">{b.name}</td>
                          <td className="py-1.5 pr-4">
                            <span className="block text-xs">{b.email}</span>
                            <span className="block text-xs text-gray-500">
                              {b.phone ?? "Sin teléfono"}
                            </span>
                          </td>
                          <td className="py-1.5 pr-4">{b.qty}</td>
                          <td className="py-1.5 pr-4 whitespace-nowrap">
                            {fmtMoney(b.price * b.qty)}
                          </td>
                          <td className="py-1.5 pr-4 whitespace-nowrap">
                            <span className="font-mono text-xs">{b.tracking ?? "—"}</span>
                            <span className="block text-xs text-gray-400">{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Página {page} de {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={pageHref(page - 1)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
              >
                ← Anterior
              </a>
            )}
            {page < pages && (
              <a
                href={pageHref(page + 1)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
              >
                Siguiente →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
