"use client";

import { useActionState } from "react";
import { changeOwnPassword } from "@/app/admin/actions";
import type { ActionState } from "@/app/admin/actions";

const initialState: ActionState = {};

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, initialState);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Contraseña actual</label>
        <input
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Nueva contraseña</label>
        <input
          name="next"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--brand, #dc2626)" }}
      >
        {pending ? "Guardando…" : "Cambiar"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-green-600">{state.success}</p>}
    </form>
  );
}
