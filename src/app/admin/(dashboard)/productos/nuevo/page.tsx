import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { createProduct } from "@/app/admin/actions";
import ProductForm from "@/app/admin/_components/product-form";

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-900">
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Añadir producto</h1>
      <ProductForm action={createProduct} submitLabel="Crear producto" />
    </div>
  );
}
