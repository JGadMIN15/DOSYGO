export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import WatchImage from "@/components/WatchImage";
import ProductGallery from "@/components/ProductGallery";
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
    take: 4,
  });

  const images: string[] = JSON.parse(product.images).filter(Boolean);

  const features = [
    "Movimiento de cuarzo de alta precisión",
    "Cristal mineral resistente a arañazos",
    "Caja de acero inoxidable",
    "Resistente al agua hasta 50m",
    "Correa intercambiable incluida",
    "Certificado de autenticidad Dos&Go",
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/productos" className="hover:text-red-600 transition-colors">Relojes</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/productos?categoria=${encodeURIComponent(product.category)}`} className="hover:text-red-600 transition-colors">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

          {/* Gallery */}
          {images.length > 0 ? (
            <ProductGallery images={images} name={product.name} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 aspect-square flex items-center justify-center">
              <WatchImage src="" name={product.name} category={product.category} className="w-4/5 h-4/5" />
            </div>
          )}

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--brand)" }}>
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

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-4xl font-black text-gray-900">
                {product.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-6">IVA incluido · Envío 5€ (gratis en pedidos +100€)</p>

            <p className="text-gray-600 leading-relaxed mb-6 text-sm">{product.description}</p>

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
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: Truck,      label: "Envío 24-48h" },
                { icon: Shield,     label: "Garantía 2 años" },
                { icon: RotateCcw,  label: "30 días devolución" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-200 text-center">
                  <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
                  <span className="text-xs text-gray-600 font-medium leading-tight">{label}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="mt-7 bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Características</h3>
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

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-gray-200 pt-12">
            <h2 className="text-xl font-black text-gray-900 mb-6">También te puede gustar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => {
                const imgs: string[] = JSON.parse(p.images).filter(Boolean);
                return (
                  <Link key={p.id} href={`/productos/${p.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative aspect-square bg-gray-50">
                      {imgs[0] ? (
                        <Image src={imgs[0]} alt={p.name} fill sizes="25vw" className="object-contain p-4" />
                      ) : (
                        <WatchImage src="" name={p.name} category={p.category} className="w-full h-full" />
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{p.brand}</p>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-red-600 transition-colors line-clamp-2">{p.name}</p>
                      <p className="font-bold text-sm mt-1">{p.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
