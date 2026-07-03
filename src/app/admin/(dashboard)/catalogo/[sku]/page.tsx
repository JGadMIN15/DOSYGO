import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import CatalogImage from "@/app/catalogo/CatalogImage";
import { findBySku, catalogImageUrl } from "@/lib/catalog";
import { publishCatalogItem } from "../actions";

interface Props {
  params: Promise<{ sku: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function PublishCatalogPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { sku: rawSku } = await params;
  const { error } = await searchParams;
  const item = findBySku(decodeURIComponent(rawSku));
  if (!item) notFound();

  const existing = await prisma.product.findUnique({
    where: { catalogSku: item.sku },
    select: { id: true },
  });
  if (existing) redirect(`/admin/productos/${existing.id}`);

  return (
    <div className="max-w-3xl">
      <Link href="/admin/catalogo" className="text-sm text-gray-500 hover:text-gray-900">
        ← Volver al catálogo
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">Poner a la venta</h1>
      <p className="text-sm text-gray-500 mb-6">
        {item.brand} · <span className="font-mono">{item.sku}</span>
      </p>

      {error === "precio" && (
        <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          Introduce un precio de venta válido.
        </p>
      )}

      <div className="grid sm:grid-cols-[180px_1fr] gap-6">
        {/* Image preview */}
        <div className="rounded-xl border border-gray-200 overflow-hidden aspect-square" style={{ background: "linear-gradient(145deg,#f9f9f9,#f0f0f0)" }}>
          <CatalogImage src={catalogImageUrl(item.sku)} brand={item.brand} sku={item.sku} className="w-full h-full object-contain p-5" />
        </div>

        {/* Form */}
        <form action={publishCatalogItem} className="space-y-4">
          <input type="hidden" name="sku" value={item.sku} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              name="name"
              defaultValue={`Reloj ${item.brand} ${item.sku}`}
              maxLength={200}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio de venta (€) *</label>
              <input
                name="priceEuros"
                inputMode="decimal"
                placeholder="Ej. 129,90"
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                min={0}
                defaultValue={1}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input
              name="category"
              defaultValue={item.brand}
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={`Reloj ${item.brand}, referencia ${item.sku}. Pieza de nuestro catálogo, ahora disponible para compra.`}
              maxLength={5000}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disponible hasta (opcional)</label>
              <input
                name="availableUntil"
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-gray-900"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
              <input type="checkbox" name="featured" /> Destacado
            </label>
          </div>

          <p className="text-xs text-gray-400">
            La foto del catálogo se usará como imagen del producto. Podrás editar todo después en Productos.
          </p>

          <button
            type="submit"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--brand, #dc2626)" }}
          >
            Poner a la venta
          </button>
        </form>
      </div>
    </div>
  );
}
