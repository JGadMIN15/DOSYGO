import Link from "next/link";
import { CheckCircle, ChevronRight, Clock, CreditCard, AlertTriangle } from "lucide-react";
import { getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";
import { RESERVATION_DEPOSIT_CENTS, RESERVATION_REFUND_DAYS, RESERVATION_CLAIM_HOURS } from "@/lib/reservation";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export const metadata = { title: "Reserva confirmada — Dos&Go" };

export default async function ReservaConfirmadaPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  // Best-effort: show the reserved model + amount from the Stripe session.
  // We deliberately don't print the customer's email/name here — `session_id`
  // is a bearer value (browser history, Referer), so it must not leak PII.
  let modelo: string | null = null;
  let deposito = RESERVATION_DEPOSIT_CENTS;
  let pagado = false;

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      if (session.metadata?.type === "reservation") {
        modelo = [session.metadata.brand, session.metadata.sku].filter(Boolean).join(" ") || null;
        deposito = session.amount_total ?? deposito;
        pagado = session.payment_status === "paid";
      }
    } catch {
      // ignore — show the generic confirmation below
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(22,163,74,0.1)" }}>
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">¡Reserva confirmada!</h1>
        <p className="text-gray-500 text-lg">
          Hemos recibido tu señal{modelo ? <> del <strong>{modelo}</strong></> : ""}. Ya estamos buscando tu reloj.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <span className="font-bold text-gray-900">Señal pagada</span>
          <span className="font-black text-xl" style={{ color: "var(--brand)" }}>{formatPrice(deposito)}</span>
        </div>
        {!pagado && session_id && (
          <p className="text-xs text-amber-600 mt-3">
            Si el pago aún aparece como pendiente, se confirmará en unos minutos. Te avisaremos por email.
          </p>
        )}

        <ul className="space-y-3 text-sm text-gray-600 mt-4">
          <li className="flex items-start gap-2.5">
            <Clock className="w-5 h-5 flex-shrink-0" style={{ color: "var(--brand)" }} />
            <span>
              Si <strong>no conseguimos el reloj en {RESERVATION_REFUND_DAYS} días</strong> (contados desde hoy, no
              desde la entrega), <strong>te devolvemos la señal</strong> íntegra.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <CreditCard className="w-5 h-5 flex-shrink-0" style={{ color: "var(--brand)" }} />
            <span>
              Cuando lo consigamos te comunicamos el <strong>precio final</strong>. Tienes <strong>{RESERVATION_CLAIM_HOURS} h</strong>{" "}
              para reclamar la devolución si no te encaja; si no, la señal <strong>se descuenta</strong> del precio y completas el
              pago por transferencia.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
            <span>
              Si <strong>dejas la reserva olvidada</strong> —ni reclamas en {RESERVATION_CLAIM_HOURS} h ni completas el pago—, la
              señal <strong>no se devuelve</strong>.
            </span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/catalogo"
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold"
          style={{ background: "var(--brand)" }}
        >
          Ver más modelos <ChevronRight className="w-5 h-5" />
        </Link>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center py-4 rounded-2xl font-bold border-2 text-gray-700 hover:bg-gray-50 transition-colors"
          style={{ borderColor: "var(--brand)" }}
        >
          Ir al inicio
        </Link>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        ¿Dudas con tu reserva? Escríbenos a{" "}
        <a href="mailto:info@dosandgo.com" className="underline" style={{ color: "var(--brand)" }}>
          info@dosandgo.com
        </a>
      </p>
    </div>
  );
}
