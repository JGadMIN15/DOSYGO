"use client";

import { useState, useTransition } from "react";
import { CheckCircle, CalendarClock } from "lucide-react";
import { createReservation } from "../actions";

export default function ReservationForm({ sku }: { sku: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createReservation({ sku, name, email, phone, note });
      if (res.ok) setDone(true);
      else setError(res.error ?? "No se pudo registrar la reserva.");
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
        <h3 className="font-black text-lg text-gray-900 mb-1">¡Reserva registrada!</h3>
        <p className="text-sm text-gray-600">
          Te avisaremos por email en cuanto este reloj esté disponible. No has pagado nada:
          el pago se hará aquí cuando salga.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-3">
      <h3 className="font-bold text-gray-900 flex items-center gap-2">
        <CalendarClock className="w-5 h-5" style={{ color: "var(--brand)" }} />
        Reservar este modelo
      </h3>
      <p className="text-xs text-gray-500">
        Reservar es <strong>gratis</strong> y sin compromiso. Cuando esté disponible te avisamos y lo pagas aquí.
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
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 resize-none"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg py-3 text-white text-sm font-bold uppercase tracking-wide disabled:opacity-50"
        style={{ background: "linear-gradient(90deg, var(--brand) 0%, var(--brand-dark) 100%)" }}
      >
        {pending ? "Enviando…" : "Reservar gratis"}
      </button>
    </form>
  );
}
