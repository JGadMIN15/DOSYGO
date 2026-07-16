import Link from "next/link";
import { CalendarClock } from "lucide-react";
import CatalogImage from "./CatalogImage";
import { catalogImageUrl, type CatalogItem } from "@/lib/catalog";

export default function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <Link href={`/catalogo/${encodeURIComponent(item.sku)}`} className="group relative block hover:z-20">
      <article
        className="rounded-2xl overflow-hidden border border-black/5 shadow-sm transition-all duration-300 ease-out will-change-transform group-hover:scale-[1.06] group-hover:shadow-2xl group-hover:border-black/10"
        style={{ background: "linear-gradient(180deg, #ffffff 0%, #f1efe9 100%)" }}
      >
        <div className="relative aspect-square flex items-center justify-center p-6">
          <CatalogImage
            src={catalogImageUrl(item.sku)}
            brand={item.brand}
            sku={item.sku}
            className="w-full h-full object-contain mix-blend-multiply"
          />
          <span className="absolute top-3 left-3 px-2.5 py-0.5 text-white text-[9px] font-bold uppercase tracking-[0.1em] rounded-sm" style={{ background: "var(--brand)" }}>
            Reservable
          </span>
        </div>

        <div className="px-5 py-4 border-t border-black/5">
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1.5" style={{ color: "var(--gold)" }}>
            {item.brand}
          </p>
          <h3 className="text-sm font-mono text-gray-700 mb-3 truncate">{item.sku}</h3>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-lg text-white transition-opacity group-hover:opacity-90"
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
