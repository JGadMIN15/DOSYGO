"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "dosygo_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Read client-only storage after mount and reveal the banner if no choice
    // is stored. Doing this in an effect (rather than initial state) keeps the
    // server and first client render identical, avoiding hydration mismatch.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — don't block the site.
    }
  }, []);

  function choose(value: "accepted" | "rejected") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
    // NOTE: there are currently no non-essential scripts to gate. If analytics
    // or marketing tags are added later, load them only when value === "accepted".
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg p-5 sm:flex sm:items-center sm:gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Usamos cookies técnicas necesarias para el funcionamiento del sitio y de
          pago seguro. Puedes aceptar o rechazar las no esenciales. Más información
          en nuestra{" "}
          <Link href="/legal/cookies" className="text-red-600 underline">
            Política de cookies
          </Link>
          .
        </p>
        <div className="flex gap-2 mt-3 sm:mt-0 flex-shrink-0">
          <button
            onClick={() => choose("rejected")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Rechazar
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--brand, #dc2626)" }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
