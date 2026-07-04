"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { cancelReservationByTicket } from "./actions";

export default function CancelReservation({
  ticket,
  willRefund,
}: {
  ticket: string;
  willRefund: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function doCancel() {
    setError(null);
    start(async () => {
      const res = await cancelReservationByTicket(ticket);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo cancelar la reserva.");
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <XCircle className="w-4 h-4" /> Cancelar mi reserva
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-700 mb-3">
        {willRefund ? (
          <>Vas a cancelar la reserva y <strong>te devolveremos la señal</strong>. ¿Confirmas?</>
        ) : (
          <>Si cancelas ahora <strong>perderás la señal</strong> (no es reembolsable en este momento, según las condiciones). ¿Seguro que quieres cancelar?</>
        )}
      </p>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={doCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: willRefund ? "var(--brand)" : "#b91c1c" }}
        >
          {pending ? "Cancelando…" : willRefund ? "Sí, cancelar y devolver" : "Sí, cancelar y perder la señal"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white disabled:opacity-50"
        >
          No, volver
        </button>
      </div>
    </div>
  );
}
