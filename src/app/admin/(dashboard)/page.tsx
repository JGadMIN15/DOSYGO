export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";

function eur(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [allAgg, monthAgg, ordersToday, productsActive, lowStock, outOfStock, recent] =
    await Promise.all([
      prisma.order.aggregate({ _sum: { total: true }, _count: true }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.product.count({ where: { archived: false } }),
      prisma.product.count({ where: { archived: false, stock: { gt: 0, lte: 3 } } }),
      prisma.product.count({ where: { archived: false, stock: 0 } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const kpis = [
    { label: "Ingresos (total)", value: eur(allAgg._sum.total ?? 0) },
    { label: "Ingresos (este mes)", value: eur(monthAgg._sum.total ?? 0) },
    { label: "Pedidos (total)", value: String(allAgg._count) },
    { label: "Pedidos (este mes)", value: String(monthAgg._count) },
    { label: "Pedidos (hoy)", value: String(ordersToday) },
    { label: "Productos activos", value: String(productsActive) },
    { label: "Stock bajo (≤3)", value: String(lowStock), warn: lowStock > 0 },
    { label: "Agotados", value: String(outOfStock), danger: outOfStock > 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Inicio</h1>
      <p className="text-sm text-gray-500 mb-6">Hola, {session.email}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-400">{k.label}</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                k.danger ? "text-red-600" : k.warn ? "text-amber-600" : "text-gray-900"
              }`}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/admin/productos/nuevo" className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--brand, #dc2626)" }}>
          + Añadir producto
        </Link>
        <Link href="/admin/productos" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Productos
        </Link>
        <Link href="/admin/pedidos" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Pedidos
        </Link>
        <Link href="/admin/vendidos" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          Vendidos
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="text-xs text-red-600 hover:underline">
            Ver todos
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">Aún no hay pedidos.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {recent.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{o.trackingCode ?? o.id.slice(-8)}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.createdAt.toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{eur(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
