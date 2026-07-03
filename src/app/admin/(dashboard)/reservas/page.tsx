export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { updateReservationStatus } from "./actions";

function fmtDate(d: Date): string {
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  contacted: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente" },
  { value: "contacted", label: "Contactado" },
  { value: "paid", label: "Pagado" },
  { value: "cancelled", label: "Cancelado" },
];

const PAGE_SIZE = 25;

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const estado = (sp.estado ?? "").trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(estado && ["pending", "contacted", "paid", "cancelled"].includes(estado) ? { status: estado } : {}),
    ...(q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
            { brand: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const total = await prisma.reservation.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  const pageHref = (p: number) =>
    `/admin/reservas?${new URLSearchParams({ ...(q ? { q } : {}), ...(estado ? { estado } : {}), page: String(p) })}`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reservas</h1>
      <p className="text-sm text-gray-500 mb-4">
        {total} {total === 1 ? "reserva" : "reservas"} del catálogo
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <form method="GET" className="flex gap-2">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por cliente, email o referencia…"
            className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900 w-72"
          />
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Buscar
          </button>
        </form>
        <div className="flex gap-1.5">
          <Link href="/admin/reservas" className={`text-xs px-3 py-1.5 rounded-full border ${!estado ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300"}`}>
            Todas
          </Link>
          {STATUS_OPTIONS.map((s) => (
            <Link
              key={s.value}
              href={`/admin/reservas?estado=${s.value}`}
              className={`text-xs px-3 py-1.5 rounded-full border ${estado === s.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300"}`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-500">
          Todavía no hay reservas.
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--gold, #b45309)" }}>
                    {r.brand}
                  </span>
                  <span className="font-mono text-sm font-semibold text-gray-900">{r.sku}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_OPTIONS.find((s) => s.value === r.status)?.label ?? r.status}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{fmtDate(r.createdAt)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">Cliente</p>
                  <p className="text-sm text-gray-900 font-medium">{r.customerName}</p>
                  <a href={`mailto:${r.customerEmail}`} className="text-sm text-red-600 break-all">{r.customerEmail}</a>
                  <p className="text-sm text-gray-700">
                    {r.customerPhone ? <a href={`tel:${r.customerPhone}`}>{r.customerPhone}</a> : <span className="text-gray-400">Sin teléfono</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">Comentario</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.note || <span className="text-gray-400">—</span>}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/catalogo/${encodeURIComponent(r.sku)}`}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Poner a la venta
                </Link>
                <form action={updateReservationStatus} className="flex items-center gap-2 ml-auto">
                  <input type="hidden" name="id" value={r.id} />
                  <select name="status" defaultValue={r.status} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white" style={{ background: "var(--brand, #dc2626)" }}>
                    Actualizar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">Página {page} de {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <a href={pageHref(page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50">← Anterior</a>}
            {page < pages && <a href={pageHref(page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50">Siguiente →</a>}
          </div>
        </div>
      )}
    </div>
  );
}
