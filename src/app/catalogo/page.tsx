import Link from "next/link";
import { ChevronRight, CalendarClock, CreditCard } from "lucide-react";
import CatalogCard from "./CatalogCard";
import { allBrands, filterCatalog, CATALOG_SIZE } from "@/lib/catalog";
import { RESERVATION_DEPOSIT_EUROS, RESERVATION_REFUND_DAYS } from "@/lib/reservation";

export const metadata = {
  title: "Catálogo · Reserva tu reloj — Dos&Go",
  description:
    "Explora nuestro catálogo completo y reserva el modelo que quieras. Cuando esté disponible te avisamos y lo pagas aquí.",
};

interface Props {
  searchParams: Promise<{ marca?: string; buscar?: string; page?: string }>;
}

export default async function CatalogoPage({ searchParams }: Props) {
  const { marca, buscar, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const brands = allBrands();
  const { items, total, pages, page: current } = filterCatalog({
    brand: marca,
    q: buscar,
    page,
  });

  const qs = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { marca, buscar, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/catalogo?${s}` : "/catalogo";
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Catálogo</span>
        </nav>

        {/* Reservation explainer banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 sm:p-9 mb-6"
          style={{ background: "radial-gradient(120% 130% at 85% 12%, rgba(158,27,31,0.28) 0%, transparent 46%), linear-gradient(180deg, #0d0d12 0%, #0a0a0d 100%)" }}
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.5), transparent)" }} />
          <span className="text-gold text-[10px] font-bold uppercase tracking-[0.28em]">Catálogo · Reserva</span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-2 mb-3">Reserva tu próximo reloj</h1>
          <p className="text-gray-400 max-w-2xl leading-relaxed">
            Nuestro catálogo completo: <span className="text-gray-200 font-semibold">{CATALOG_SIZE.toLocaleString("es-ES")}</span>{" "}
            modelos. Elige el tuyo y resérvalo con una <strong className="text-white">señal de {RESERVATION_DEPOSIT_EUROS} €</strong>. Si no
            lo conseguimos en {RESERVATION_REFUND_DAYS} días, te la devolvemos íntegra.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 text-xs text-gray-100 bg-white/10 rounded-full px-3 py-1.5">
              <CreditCard className="w-4 h-4" style={{ color: "var(--gold)" }} /> Señal de {RESERVATION_DEPOSIT_EUROS} € · se descuenta del precio
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-gray-100 bg-white/10 rounded-full px-3 py-1.5">
              <CalendarClock className="w-4 h-4" style={{ color: "var(--gold)" }} /> Reembolsable si no hay stock en {RESERVATION_REFUND_DAYS} días
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar: brands */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-36">
              <div className="px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Marca</p>
                <ul className="space-y-0.5 max-h-[60vh] overflow-auto">
                  <li>
                    <Link
                      href={qs({ marca: undefined, page: undefined })}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        !marca ? "font-semibold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                      style={!marca ? { color: "var(--brand)" } : {}}
                    >
                      <span>Todas</span>
                      <span className="text-xs text-gray-400">{CATALOG_SIZE}</span>
                    </Link>
                  </li>
                  {brands.map((b) => {
                    const isActive = marca === b.brand;
                    return (
                      <li key={b.brand}>
                        <Link
                          href={isActive ? qs({ marca: undefined, page: undefined }) : qs({ marca: b.brand, page: undefined })}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                            isActive ? "font-semibold" : "text-gray-600 hover:bg-gray-50"
                          }`}
                          style={isActive ? { color: "var(--brand)" } : {}}
                        >
                          <span>{b.brand}</span>
                          <span className="text-xs text-gray-400">{b.count}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar + search */}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3.5 mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-gray-900 text-lg">
                  {marca ? marca : buscar ? `Resultados para "${buscar}"` : "Todo el catálogo"}
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {total.toLocaleString("es-ES")} {total === 1 ? "modelo" : "modelos"}
                </span>
              </div>
              <form method="GET" className="flex gap-2">
                {marca && <input type="hidden" name="marca" value={marca} />}
                <input
                  name="buscar"
                  defaultValue={buscar ?? ""}
                  placeholder="Buscar por referencia o marca…"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-900"
                />
                <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-white" style={{ background: "var(--brand)" }}>
                  Buscar
                </button>
              </form>
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-24 text-center">
                <p className="text-5xl mb-4">⌚</p>
                <p className="text-gray-500 text-lg font-medium mb-1">Sin resultados</p>
                <Link href="/catalogo" className="inline-flex mt-4 items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "var(--brand)" }}>
                  Ver todo el catálogo
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((item) => (
                  <CatalogCard key={item.sku} item={item} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between mt-6 text-sm">
                <span className="text-gray-500">Página {current} de {pages}</span>
                <div className="flex gap-2">
                  {current > 1 && (
                    <Link href={qs({ page: String(current - 1) })} className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 bg-white">
                      ← Anterior
                    </Link>
                  )}
                  {current < pages && (
                    <Link href={qs({ page: String(current + 1) })} className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 bg-white">
                      Siguiente →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
