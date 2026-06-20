import { prisma } from "@/lib/prisma";
import WatchCard from "@/components/WatchCard";
import Link from "next/link";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import ProductSort from "@/components/ProductSort";

interface Props {
  searchParams: Promise<{ categoria?: string; buscar?: string; orden?: string; marca?: string }>;
}

export default async function ProductosPage({ searchParams }: Props) {
  const params = await searchParams;
  const { categoria, buscar, orden, marca } = params;

  const orderBy =
    orden === "precio-asc"  ? { price: "asc"       as const } :
    orden === "precio-desc" ? { price: "desc"      as const } :
    orden === "nuevo"       ? { createdAt: "desc"  as const } :
                              { featured: "desc"   as const };

  const products = await prisma.product.findMany({
    where: {
      ...(categoria ? { category: categoria } : {}),
      ...(buscar    ? { name: { contains: buscar } } : {}),
      ...(marca     ? { brand: marca } : {}),
    },
    orderBy,
  });

  const allCategories = await prisma.product.groupBy({
    by: ["category"],
    _count: { id: true },
    orderBy: { category: "asc" },
  });

  const allBrands = await prisma.product.groupBy({
    by: ["brand"],
    _count: { id: true },
    orderBy: { brand: "asc" },
  });

  const priceRanges = [
    { label: "Menos de 100€",     min: 0,    max: 100 },
    { label: "100€ – 300€",       min: 100,  max: 300 },
    { label: "300€ – 500€",       min: 300,  max: 500 },
    { label: "Más de 500€",       min: 500,  max: 999999 },
  ];

  const activeFilters = [
    ...(categoria ? [`Categoría: ${categoria}`] : []),
    ...(marca     ? [`Marca: ${marca}`]         : []),
    ...(buscar    ? [`Búsqueda: "${buscar}"`]   : []),
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">Relojes</span>
          {categoria && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-700 font-medium">{categoria}</span>
            </>
          )}
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <aside className="lg:w-60 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-36">

              {/* Categorías */}
              <div className="border-b border-gray-100">
                <div className="px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Tipo de reloj</p>
                  <ul className="space-y-0.5">
                    <li>
                      <Link
                        href={marca ? `/productos?marca=${encodeURIComponent(marca)}` : "/productos"}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                          !categoria ? "font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
                        }`}
                        style={!categoria ? { background: "var(--brand)" } : {}}
                      >
                        <span>Todos</span>
                        <span className={`text-xs ${!categoria ? "text-white/70" : "text-gray-400"}`}>
                          {allCategories.reduce((s, c) => s + c._count.id, 0)}
                        </span>
                      </Link>
                    </li>
                    {allCategories.map((cat) => {
                      const href = `/productos?categoria=${encodeURIComponent(cat.category)}${marca ? `&marca=${encodeURIComponent(marca)}` : ""}`;
                      return (
                        <li key={cat.category}>
                          <Link
                            href={href}
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                              categoria === cat.category ? "font-semibold text-white" : "text-gray-600 hover:bg-gray-50"
                            }`}
                            style={categoria === cat.category ? { background: "var(--brand)" } : {}}
                          >
                            <span>{cat.category}</span>
                            <span className={`text-xs ${categoria === cat.category ? "text-white/70" : "text-gray-400"}`}>
                              {cat._count.id}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Marcas */}
              {allBrands.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Marca</p>
                    <ul className="space-y-0.5">
                      {allBrands.map((b) => {
                        const isActive = marca === b.brand;
                        const href = isActive
                          ? (categoria ? `/productos?categoria=${encodeURIComponent(categoria)}` : "/productos")
                          : `${categoria ? `/productos?categoria=${encodeURIComponent(categoria)}&` : "/productos?"}marca=${encodeURIComponent(b.brand)}`;
                        return (
                          <li key={b.brand}>
                            <Link
                              href={href}
                              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                                isActive ? "font-semibold" : "text-gray-600 hover:bg-gray-50"
                              }`}
                              style={isActive ? { color: "var(--brand)" } : {}}
                            >
                              <span>{b.brand}</span>
                              <span className="text-xs text-gray-400">{b._count.id}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {/* Precio */}
              <div className="px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Precio</p>
                <ul className="space-y-0.5">
                  {priceRanges.map((range) => (
                    <li key={range.label}>
                      <button className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left">
                        <span className="w-3.5 h-3.5 rounded border border-gray-300 flex-shrink-0" />
                        {range.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3.5 mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <h1 className="font-bold text-gray-900 text-sm">
                  {categoria ?? (buscar ? `Resultados para "${buscar}"` : "Todos los relojes")}
                </h1>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {products.length} {products.length === 1 ? "producto" : "productos"}
                </span>
              </div>
              <ProductSort current={orden} />
            </div>

            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeFilters.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-red-200 rounded-full text-xs font-medium text-red-700">
                    {f}
                  </span>
                ))}
                <Link href="/productos" className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                  Limpiar filtros
                </Link>
              </div>
            )}

            {/* Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-24 text-center">
                <p className="text-5xl mb-4">⌚</p>
                <p className="text-gray-500 text-lg font-medium mb-1">Sin resultados</p>
                <p className="text-gray-400 text-sm mb-6">Prueba con otros filtros o busca en toda la colección.</p>
                <Link
                  href="/productos"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold"
                  style={{ background: "var(--brand)" }}
                >
                  Ver todos los relojes
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => (
                  <WatchCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
