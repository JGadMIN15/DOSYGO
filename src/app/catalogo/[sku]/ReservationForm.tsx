"use client";

import { useState, useTransition } from "react";
import { CreditCard } from "lucide-react";
import { startReservationCheckout } from "../actions";
import { RESERVATION_DEPOSIT_EUROS, RESERVATION_REFUND_DAYS, RESERVATION_CLAIM_HOURS } from "@/lib/reservation";

export default function ReservationForm({ sku }: { sku: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Debes aceptar las condiciones de la señal.");
      return;
    }
    startTransition(async () => {
      const res = await startReservationCheckout({ sku, name, email, phone, note });
      if (res.ok && res.url) {
        window.location.href = res.url; // Stripe Checkout
      } else {
        setError(res.error ?? "No se pudo iniciar el pago.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <CreditCard className="w-5 h-5" style={{ color: "var(--brand)" }} />
        Reservar con señal de {RESERVATION_DEPOSIT_EUROS} €
      </h3>
      <p className="text-xs text-gray-500">
        Pagas una señal de <strong>{RESERVATION_DEPOSIT_EUROS} €</strong> (tarjeta, segura con Stripe) que se
        <strong> descuenta del precio final</strong>. Si no conseguimos el reloj en {RESERVATION_REFUND_DAYS} días, te la devolvemos.
      </p>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        maxLength={100}
        required
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu email"
        maxLength={254}
        required
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Teléfono (opcional)"
        maxLength={40}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Comentario (opcional): color, talla de correa, dudas…"
        maxLength={500}
        rows={2}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 resize-none"
      />

      <label className="flex items-start gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Acepto las condiciones: la señal se <strong>descuenta</strong> del precio final; se <strong>devuelve</strong> si no
          conseguimos el reloj en {RESERVATION_REFUND_DAYS} días o si <strong>reclamo en las {RESERVATION_CLAIM_HOURS} h</strong>{" "}
          siguientes a que me comuniquéis el precio final; si <strong>dejo la reserva olvidada</strong> (no reclamo ni completo el
          pago), <strong>la señal no se devuelve</strong>.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg py-3 text-white text-sm font-bold uppercase tracking-wide disabled:opacity-50"
        style={{ background: "linear-gradient(90deg, var(--brand) 0%, var(--brand-dark) 100%)" }}
      >
        {pending ? "Redirigiendo al pago…" : `Reservar · pagar ${RESERVATION_DEPOSIT_EUROS} € de señal`}
      </button>
      <p className="text-[11px] text-gray-400 text-center">Pago seguro con tarjeta vía Stripe.</p>
    </form>
  );
}
