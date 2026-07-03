export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import CatalogImage from "@/app/catalogo/CatalogImage";
import { allBrands, filterCatalog, catalogImageUrl, CATALOG_SIZE } from "@/lib/catalog";

interface Props {
  searchParams: Promise<{ marca?: string; q?: string; page?: string }>;
}

const PAGE_SIZE = 40;

export default async function AdminCatalogPage({ searchParams }: Props) {
  await requireAdmin();
  const { marca, q, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const brands = allBrands();
  const { items, total, pages, page: current } = filterCatalog({
    brand: marca,
    q,
    page,
    pageSize: PAGE_SIZE,
  });

  // Which of the models on this page are already for sale?
  const published = await prisma.product.findMany({
    where: { catalogSku: { in: items.map((i) => i.sku) } },
    select: { id: true, catalogSku: true },
  });
  const publishedBySku = new Map(published.map((p) => [p.catalogSku as string, p.id]));

  const qs = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { marca, q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `/admin/catalogo?${s}` : "/admin/catalogo";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Catálogo</h1>
      <p className="text-sm text-gray-500 mb-4">
        {CATALOG_SIZE.toLocaleString("es-ES")} modelos. Pon a la venta cualquiera cuando quieras.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <form method="GET" className="flex gap-2">
          {marca && <input type="hidden" name="marca" value={marca} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por referencia o marca…"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 w-64"
          />
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Buscar
          </button>
          {(q || marca) && (
            <Link href="/admin/catalogo" className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-900">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Brand chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <Link
          href={qs({ marca: undefined, page: undefined })}
          className={`text-xs px-3 py-1 rounded-full border ${!marca ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
        >
          Todas ({CATALOG_SIZE})
        </Link>
        {brands.map((b) => (
          <Link
            key={b.brand}
            href={marca === b.brand ? qs({ marca: undefined, page: undefined }) : qs({ marca: b.brand, page: undefined })}
            className={`text-xs px-3 py-1 rounded-full border ${marca === b.brand ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
          >
            {b.brand} ({b.count})
          </Link>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {total.toLocaleString("es-ES")} {total === 1 ? "modelo" : "modelos"}
        {marca ? ` · ${marca}` : ""}{q ? ` · "${q}"` : ""}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const productId = publishedBySku.get(item.sku);
          return (
            <div key={item.sku} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="relative aspect-square" style={{ background: "linear-gradient(145deg,#f9f9f9,#f0f0f0)" }}>
                <CatalogImage
                  src={catalogImageUrl(item.sku)}
                  brand={item.brand}
                  sku={item.sku}
                  className="w-full h-full object-contain p-4"
                />
                {productId && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 text-white text-[9px] font-bold uppercase tracking-wide rounded-sm">
                    A la venta
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{item.brand}</p>
                <p className="text-xs font-mono text-gray-800 mb-3 truncate">{item.sku}</p>
                {productId ? (
                  <Link
                    href={`/admin/productos/${productId}`}
                    className="mt-auto text-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Editar producto
                  </Link>
                ) : (
                  <Link
                    href={`/admin/catalogo/${encodeURIComponent(item.sku)}`}
                    className="mt-auto text-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: "var(--brand, #dc2626)" }}
                  >
                    Poner a la venta
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <span className="text-gray-500">Página {current} de {pages}</span>
          <div className="flex gap-2">
            {current > 1 && (
              <Link href={qs({ page: String(current - 1) })} className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50">
                ← Anterior
              </Link>
            )}
            {current < pages && (
              <Link href={qs({ page: String(current + 1) })} className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50">
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
