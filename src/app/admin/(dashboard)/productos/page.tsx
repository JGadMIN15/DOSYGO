export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { deleteProduct } from "../../actions";
import { formatPrice } from "@/lib/format";

const PAGE_SIZE = 20;

function firstImage(images: string): string | null {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? String(arr[0]) : null;
  } catch {
    return null;
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    archived: false,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { brand: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const total = await prisma.product.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  });

  // eslint-disable-next-line react-hooks/purity -- request-time clock in a Server Component
  const nowTs = Date.now();

  const pageHref = (p: number) =>
    `/admin/productos?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">
            {total} {total === 1 ? "producto" : "productos"}
            {q ? ` · búsqueda: "${q}"` : ""}
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--brand, #dc2626)" }}
        >
          + Añadir producto
        </Link>
      </div>

      <form method="GET" className="flex gap-2 mb-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o marca…"
          className="flex-1 max-w-md rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        />
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Buscar
        </button>
        {q && (
          <Link
            href="/admin/productos"
            className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
          >
            Limpiar
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <p className="text-gray-500 mb-4">
            {q ? "Sin resultados para tu búsqueda." : "Aún no hay productos."}
          </p>
          {!q && (
            <Link
              href="/admin/productos/nuevo"
              className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--brand, #dc2626)" }}
            >
              Añadir el primero
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Marca</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const thumb = firstImage(product.images);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt=""
                              className="w-10 h-10 rounded-md object-cover bg-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100" />
                          )}
                          <span className="font-medium text-gray-900">
                            {product.name}
                            {product.featured && (
                              <span className="ml-2 text-[10px] uppercase font-bold text-amber-600">
                                Destacado
                              </span>
                            )}
                            {product.availableUntil && (
                              <span
                                className={`block text-[11px] font-normal ${
                                  product.availableUntil.getTime() < nowTs
                                    ? "text-red-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {product.availableUntil.getTime() < nowTs
                                  ? "Retirado el "
                                  : "Disponible hasta "}
                                {product.availableUntil.toLocaleDateString("es-ES")}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{product.brand}</td>
                      <td className="px-4 py-3 text-gray-900">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            product.stock > 0 ? "text-gray-700" : "text-red-600 font-medium"
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/productos/${product.id}`}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Editar
                          </Link>
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={product.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                            >
                              Borrar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-500">
                Página {page} de {pages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={pageHref(page - 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    ← Anterior
                  </Link>
                )}
                {page < pages && (
                  <Link
                    href={pageHref(page + 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
