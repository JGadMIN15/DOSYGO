import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import AssistantChat from "./assistant-chat";

export const dynamic = "force-dynamic";

export default async function AsistentePage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/productos"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← Productos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          ✨ Asistente para añadir productos
        </h1>
        <p className="text-sm text-gray-500">
          Dime el modelo y a qué precio lo encontraste. Busco imágenes, estimo
          precio de venta y demanda, y redacto la ficha. Tú revisas y publicas.
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
