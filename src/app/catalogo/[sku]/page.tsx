import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CalendarClock, CreditCard, ShieldCheck } from "lucide-react";
import CatalogImage from "../CatalogImage";
import ReservationForm from "./ReservationForm";
import { findBySku, catalogImageUrl } from "@/lib/catalog";
import { RESERVATION_DEPOSIT_EUROS, RESERVATION_REFUND_DAYS } from "@/lib/reservation";

interface Props {
  params: Promise<{ sku: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { sku } = await params;
  const item = findBySku(decodeURIComponent(sku));
  if (!item) return { title: "Modelo no encontrado — Dos&Go" };
  return {
    title: `${item.brand} ${item.sku} · Reservar — Dos&Go`,
    description: `Reserva el ${item.brand} ${item.sku} con una señal de ${RESERVATION_DEPOSIT_EUROS} €, reembolsable si no lo conseguimos en ${RESERVATION_REFUND_DAYS} días.`,
  };
}

export default async function CatalogDetailPage({ params }: Props) {
  const { sku: rawSku } = await params;
  const item = findBySku(decodeURIComponent(rawSku));
  if (!item) notFound();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/catalogo" className="hover:text-red-600 transition-colors">Catálogo</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium">{item.brand}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="relative aspect-square" style={{ background: "linear-gradient(145deg, #f9f9f9 0%, #f0f0f0 100%)" }}>
              <CatalogImage
                src={catalogImageUrl(item.sku)}
                brand={item.brand}
                sku={item.sku}
                className="w-full h-full object-contain p-10"
              />
              <span className="absolute top-4 left-4 px-3 py-1 text-white text-[10px] font-bold uppercase tracking-[0.12em] rounded-sm" style={{ background: "var(--brand)" }}>
                Reservable
              </span>
            </div>
          </div>

          {/* Info + reservation */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: "var(--gold)" }}>
              {item.brand}
            </p>
            <h1 className="text-2xl font-black text-gray-900 mb-1">Reloj {item.brand}</h1>
            <p className="text-sm font-mono text-gray-500 mb-5">Ref. {item.sku}</p>

            {/* How reservation works */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-5">
              <p className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CalendarClock className="w-5 h-5" style={{ color: "var(--brand)" }} />
                ¿Cómo funciona la reserva?
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ background: "var(--brand)" }}>1</span>
                  <span>Para reservar, pagas una <strong>señal de {RESERVATION_DEPOSIT_EUROS} €</strong> (antes de fijar el precio final). Esa señal <strong>se descuenta</strong> del precio cuando compres.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ background: "var(--brand)" }}>2</span>
                  <span>Buscamos el reloj. Si <strong>no lo tenemos en stock en {RESERVATION_REFUND_DAYS} días</strong> (contados desde que reservas, no desde la entrega), <strong>te devolvemos la señal</strong> íntegra.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center" style={{ background: "var(--brand)" }}>3</span>
                  <span className="inline-flex items-start gap-1"><CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>Cuando lo conseguimos te avisamos y completas el pago por transferencia. <strong>Si no completas la transferencia, la señal no se devuelve.</strong></span></span>
                </li>
              </ul>
              <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" /> Señal reembolsable si no conseguimos el reloj en {RESERVATION_REFUND_DAYS} días. Pago seguro con tarjeta (Stripe).
              </p>
            </div>

            <ReservationForm sku={item.sku} />
          </div>
        </div>
      </div>
    </div>
  );
}
