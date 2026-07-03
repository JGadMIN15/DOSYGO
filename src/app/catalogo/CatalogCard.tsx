import Link from "next/link";
import { CalendarClock } from "lucide-react";
import CatalogImage from "./CatalogImage";
import { catalogImageUrl, type CatalogItem } from "@/lib/catalog";

export default function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <Link href={`/catalogo/${encodeURIComponent(item.sku)}`} className="group block">
      <article className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
        <div className="relative aspect-square" style={{ background: "linear-gradient(145deg, #f9f9f9 0%, #f0f0f0 100%)" }}>
          <CatalogImage
            src={catalogImageUrl(item.sku)}
            brand={item.brand}
            sku={item.sku}
            className="w-full h-full object-contain p-5 group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
          <span className="absolute top-3 left-3 px-2.5 py-0.5 text-white text-[9px] font-bold uppercase tracking-[0.1em] rounded-sm" style={{ background: "var(--brand)" }}>
            Reservable
          </span>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1.5" style={{ color: "var(--gold)" }}>
            {item.brand}
          </p>
          <h3 className="text-sm font-mono text-gray-800 mb-3 truncate">{item.sku}</h3>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-lg text-white"
            style={{ background: "linear-gradient(90deg, var(--brand) 0%, var(--brand-dark) 100%)" }}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Reservar
          </span>
        </div>
      </article>
    </Link>
  );
}
