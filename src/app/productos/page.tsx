import { prisma } from "@/lib/prisma";
import WatchCard from "@/components/WatchCard";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ categoria?: string; buscar?: string }>;
}

export default async function ProductosPage({ searchParams }: Props) {
  const params = await searchParams;
  const { categoria, buscar } = params;

  const products = await prisma.product.findMany({
    where: {
      ...(categoria ? { category: categoria } : {}),
      ...(buscar ? { name: { contains: buscar } } : {}),
    },
    orderBy: { featured: "desc" },
  });

  const categories = await prisma.product.groupBy({
    by: ["category"],
    _count: { id: true },
    orderBy: { category: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{categoria ?? "Todos los relojes"}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filtros */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <h3 className="font-bold text-gray-900 mb-4">Categorías</h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/productos"
                  className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !categoria
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={!categoria ? { background: "var(--brand)" } : {}}
                >
                  Todos
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.category}>
                  <Link
                    href={`/productos?categoria=${encodeURIComponent(cat.category)}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      categoria === cat.category
                        ? "text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    style={categoria === cat.category ? { background: "var(--brand)" } : {}}
                  >
                    <span>{cat.category}</span>
                    <span className={`text-xs ${categoria === cat.category ? "text-white/70" : "text-gray-400"}`}>
                      {cat._count.id}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid productos */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-gray-900">
              {categoria ?? "Todos los relojes"}
            </h1>
            <span className="text-sm text-gray-400">{products.length} productos</span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">⌚</p>
              <p className="text-gray-500 text-lg">No se encontraron relojes.</p>
              <Link href="/productos" className="mt-4 inline-block text-sm font-semibold underline" style={{ color: "var(--brand)" }}>
                Ver todos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <WatchCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
