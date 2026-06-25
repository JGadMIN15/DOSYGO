import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-session";
import { updateProduct } from "@/app/admin/actions";
import ProductForm from "@/app/admin/_components/product-form";

function parseImages(images: string): string[] {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) ? arr.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/productos" className="text-sm text-gray-500 hover:text-gray-900">
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Editar producto</h1>
      <ProductForm
        action={updateProduct}
        submitLabel="Guardar cambios"
        product={{
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description,
          price: product.price,
          stock: product.stock,
          featured: product.featured,
          images: parseImages(product.images),
          availableUntil: product.availableUntil
            ? product.availableUntil.toISOString().slice(0, 10)
            : undefined,
        }}
      />
    </div>
  );
}
