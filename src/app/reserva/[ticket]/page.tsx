import { notFound } from "next/navigation";
import Link from "next/link";
import { Search, CheckCircle, RotateCcw, XCircle, Clock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { catalogImageUrl } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import CatalogImage from "@/app/catalogo/CatalogImage";
import CancelReservation from "./CancelReservation";
import {
  RESERVATION_STATUS_LABEL,
  RESERVATION_TERMINAL_STATUSES,
  RESERVATION_REFUND_DAYS,
  RESERVATION_CLAIM_HOURS,
  cancelRefundsDeposit,
  TICKET_RE,
} from "@/lib/reservation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi reserva — Dos&Go", robots: { index: false } };

interface Props {
  params: Promise<{ ticket: string }>;
}

function fmt(d: Date): string {
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReservaTicketPage({ params }: Props) {
  const { ticket } = await params;
  if (!TICKET_RE.test(ticket)) notFound();

  const r = await prisma.reservation.findUnique({ where: { ticket } });
  if (!r) notFound();

  // eslint-disable-next-line react-hooks/purity -- request-time clock in a Server Component
  const nowMs = Date.now();
  const terminal = RESERVATION_TERMINAL_STATUSES.includes(r.status);
  const willRefund = cancelRefundsDeposit({ status: r.status, pricedAt: r.pricedAt, createdAt: r.createdAt, nowMs });

  const refundDeadline = new Date(r.createdAt.getTime() + RESERVATION_REFUND_DAYS * 86_400_000);
  const claimEndsMs = r.pricedAt ? r.pricedAt.getTime() + RESERVATION_CLAIM_HOURS * 3_600_000 : null;
  const claimHoursLeft = claimEndsMs ? Math.max(0, Math.ceil((claimEndsMs - nowMs) / 3_600_000)) : null;
  const claimOpen = claimEndsMs != null && nowMs < claimEndsMs;

  // Status hero: icon + tone + message the customer sees at a glance.
  let Icon = Search;
  let tone = "#2563eb"; // blue
  let heading = RESERVATION_STATUS_LABEL[r.status] ?? r.status;
  let message = "";

  if (r.status === "sourcing") {
    Icon = Search;
    tone = "#2563eb";
    heading = "Estamos buscando tu reloj";
    message = `Si no lo conseguimos antes del ${fmt(refundDeadline)}, te devolvemos la señal íntegra.`;
  } else if (r.status === "in_stock") {
    Icon = CheckCircle;
    tone = "#16a34a";
    heading = "¡Ya tenemos tu reloj!";
    message = claimOpen
      ? `Te hemos fijado el precio final. Tienes hasta el ${fmt(new Date(claimEndsMs!))} (${claimHoursLeft} h) para completar el pago o reclamar la devolución de la señal.`
      : "El plazo de 24 h para reclamar ha terminado. Escríbenos para completar el pago y recibir tu reloj.";
  } else if (r.status === "completed") {
    Icon = CheckCircle;
    tone = "#16a34a";
    heading = "Reserva completada";
    message = "¡Gracias! Tu compra está confirmada.";
  } else if (r.status === "refunded") {
    Icon = RotateCcw;
    tone = "#6b7280";
    heading = "Señal devuelta";
    message = "Hemos reembolsado tu señal. Puede tardar unos días en verse en tu banco.";
  } else if (r.status === "forfeited") {
    Icon = XCircle;
    tone = "#b91c1c";
    heading = "Reserva cancelada";
    message = "La reserva se cerró y la señal se ha retenido según las condiciones.";
  } else if (r.status === "cancelled") {
    Icon = XCircle;
    tone = "#6b7280";
    heading = "Reserva cancelada";
    message = "Esta reserva está cancelada.";
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Mi reserva</h1>
        <p className="text-sm text-gray-500 mb-6">Sin cuenta: guarda el enlace de esta página para volver.</p>

        {/* Modelo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 flex items-center gap-4">
          <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: "linear-gradient(145deg,#f9f9f9,#f0f0f0)" }}>
            <CatalogImage src={catalogImageUrl(r.sku)} brand={r.brand} sku={r.sku} className="w-full h-full object-contain p-3" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--gold, #b45309)" }}>{r.brand}</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">Reloj {r.brand}</p>
            <p className="text-sm font-mono text-gray-500">Ref. {r.sku}</p>
          </div>
        </div>

        {/* Estado */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${tone}1a` }}>
              <Icon className="w-6 h-6" style={{ color: tone }} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">{heading}</h2>
              <p className="text-sm text-gray-600 mt-0.5">{message}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-0.5">Señal</p>
              <p className="font-semibold text-gray-900">
                {formatPrice(r.depositCents)}
                {r.depositRefunded && <span className="ml-1 font-normal text-gray-400">(devuelta)</span>}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-0.5">Reservado el</p>
              <p className="font-semibold text-gray-900">{fmt(r.createdAt)}</p>
            </div>
            {r.finalPriceCents != null && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-0.5">Precio final</p>
                <p className="font-semibold text-gray-900">{formatPrice(r.finalPriceCents)}</p>
              </div>
            )}
            {r.status === "in_stock" && claimOpen && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-0.5">Plazo para decidir</p>
                <p className="font-semibold text-gray-900 inline-flex items-center gap-1"><Clock className="w-4 h-4" /> quedan {claimHoursLeft} h</p>
              </div>
            )}
          </div>
        </div>

        {/* Cancelar */}
        {!terminal && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
            <p className="font-bold text-gray-900 mb-1">¿Quieres cancelar la reserva?</p>
            <p className="text-sm text-gray-600 mb-3">
              {willRefund
                ? "En este momento la cancelación es con devolución de la señal."
                : "En este momento la señal no es reembolsable: al cancelar la perderías."}
            </p>
            <CancelReservation ticket={r.ticket!} willRefund={willRefund} />
          </div>
        )}

        {/* Condiciones */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-xs text-gray-500 space-y-1.5">
          <p className="font-bold text-gray-700 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Condiciones de la señal</p>
          <p>• Se devuelve si no conseguimos el reloj en {RESERVATION_REFUND_DAYS} días (desde la reserva).</p>
          <p>• Al fijar el precio final tienes {RESERVATION_CLAIM_HOURS} h para reclamar la devolución; si no, se descuenta del precio.</p>
          <p>• Si dejas la reserva olvidada (ni reclamas ni completas el pago), la señal no se devuelve.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/catalogo" className="font-semibold underline" style={{ color: "var(--brand)" }}>← Volver al catálogo</Link>
          <a href="mailto:info@dosandgo.com" className="font-semibold underline text-gray-500">Contactar por email</a>
        </div>
      </div>
    </div>
  );
}
