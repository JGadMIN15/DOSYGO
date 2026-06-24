export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { updateOrderStatus } from "../../actions";

interface ShippingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

function parseAddress(json: string): ShippingAddress {
  try {
    const a = JSON.parse(json);
    return a && typeof a === "object" ? (a as ShippingAddress) : {};
  } catch {
    return {};
  }
}

function fmtDate(d: Date): string {
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtMoney(n: number, currency: string): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: currency.toUpperCase() });
}

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  preparando: "bg-amber-100 text-amber-700",
  enviado: "bg-blue-100 text-blue-700",
  entregado: "bg-gray-200 text-gray-700",
  cancelado: "bg-red-100 text-red-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-gray-200 text-gray-700",
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "paid", label: "Pagado" },
  { value: "preparando", label: "Preparando" },
  { value: "enviado", label: "Enviado" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

export default async function AdminOrdersPage() {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      tracking: { orderBy: { timestamp: "desc" } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pedidos</h1>
      <p className="text-sm text-gray-500 mb-6">
        {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
      </p>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-500">
          Todavía no hay pedidos.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const addr = parseAddress(order.shippingAddress);
            const addrLines = [
              addr.line1,
              addr.line2,
              [addr.postal_code, addr.city].filter(Boolean).join(" "),
              [addr.state, addr.country].filter(Boolean).join(", "),
            ].filter((l) => l && l.trim());

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {order.trackingCode ?? order.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        STATUS_STYLE[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{fmtDate(order.createdAt)}</span>
                    <span className="font-bold text-gray-900">
                      {fmtMoney(order.total, order.currency)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
                  {/* Cliente */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                      Cliente
                    </p>
                    <p className="text-sm text-gray-900 font-medium">{order.customerName}</p>
                    {order.customerEmail && (
                      <a href={`mailto:${order.customerEmail}`} className="text-sm text-red-600 break-all">
                        {order.customerEmail}
                      </a>
                    )}
                    <p className="text-sm text-gray-700">
                      {order.customerPhone ? (
                        <a href={`tel:${order.customerPhone}`}>{order.customerPhone}</a>
                      ) : (
                        <span className="text-gray-400">Sin teléfono</span>
                      )}
                    </p>
                  </div>

                  {/* Envío */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                      Dirección de entrega
                    </p>
                    {addr.name && <p className="text-sm text-gray-900">{addr.name}</p>}
                    {addrLines.length > 0 ? (
                      addrLines.map((line, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          {line}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">Sin dirección</p>
                    )}
                  </div>

                  {/* Productos */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                      Productos
                    </p>
                    {order.items.length > 0 ? (
                      <ul className="space-y-1">
                        {order.items.map((it) => (
                          <li key={it.id} className="text-sm text-gray-700">
                            {it.quantity}× {it.product?.name ?? "Producto"}{" "}
                            <span className="text-gray-400">
                              ({fmtMoney(it.price, order.currency)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">Sin líneas</p>
                    )}
                  </div>
                </div>

                {/* Estado / seguimiento (manual) */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <a
                      href={`/admin/pedidos/${order.id}/factura`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Factura (PDF)
                    </a>
                    <a
                      href={`/admin/pedidos/${order.id}/albaran`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Albarán (PDF)
                    </a>
                  </div>
                  <form action={updateOrderStatus} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Estado
                    </span>
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <input
                      name="note"
                      placeholder="Nota / ubicación (opcional)"
                      maxLength={300}
                      className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white"
                      style={{ background: "var(--brand, #dc2626)" }}
                    >
                      Actualizar
                    </button>
                  </form>

                  {order.tracking.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {order.tracking.map((t) => (
                        <li key={t.id} className="text-xs text-gray-500">
                          <span className="text-gray-400">{fmtDate(t.timestamp)}</span> —{" "}
                          <span className="font-medium text-gray-700">{t.status}</span>
                          {t.description ? `: ${t.description}` : ""}
                          {t.location ? ` (${t.location})` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
