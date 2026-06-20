import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import WatchImage from "@/components/WatchImage";
import { Shield, Truck, RotateCcw, Star, ChevronRight, Check } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { category: product.category, id: { not: id } },
    take: 3,
  });

  const images: string[] = JSON.parse(product.images);

  const features = [
    "Movimiento de cuarzo suizo de alta precisión",
    "Cristal mineral tratado anti-arañazos",
    "Caja de acero inoxidable 316L",
    "Resistente al agua hasta 50m",
    "Correa intercambiable incluida",
    "Certificado de autenticidad Dos&Go",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/productos" className="hover:text-red-600 transition-colors">Relojes</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/productos?categoria=${encodeURIComponent(product.category)}`} className="hover:text-red-600 transition-colors">
          {product.category}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Imagen */}
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl overflow-hidden aspect-square flex items-center justify-center">
          <WatchImage
            src={images[0]}
            name={product.name}
            category={product.category}
            className="w-4/5 h-4/5"
          />
          <span className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200">
            {product.category}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "var(--brand)" }}>
            {product.brand}
          </p>
          <h1 className="text-3xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-gray-500">4.9 · 24 reseñas</span>
          </div>

          {/* Precio */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-black text-gray-900">
              {product.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </span>
            <span className="text-gray-400 text-sm line-through">
              {(product.price * 1.2).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--brand)" }}>
              -17%
            </span>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Stock */}
          {product.stock > 0 ? (
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-700 font-medium">
                {product.stock > 10 ? "En stock" : `Solo quedan ${product.stock} unidades`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-red-700 font-medium">Agotado</span>
            </div>
          )}

          {/* CTA */}
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image: images[0] ?? "",
              stock: product.stock,
            }}
          />

          {/* Garantías */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: Truck,      label: "Envío 24-48h" },
              { icon: Shield,     label: "Garantía 2 años" },
              { icon: RotateCcw,  label: "30 días devolución" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 text-center">
                <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
                <span className="text-xs text-gray-600 font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="mt-8">
            <h3 className="font-bold text-gray-900 mb-3">Características</h3>
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Relojes relacionados */}
      {related.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-gray-900 mb-6">También te puede gustar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((p) => (
              <Link key={p.id} href={`/productos/${p.id}`} className="block group">
                <div className="watch-card bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center p-6">
                    <WatchImage src={JSON.parse(p.images)[0]} name={p.name} category={p.category} className="w-full h-full" />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm text-gray-900 group-hover:text-red-600 transition-colors">{p.name}</p>
                    <p className="font-bold mt-1">{p.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
