"use client";

import { useActionState } from "react";
import { activateAccount } from "../actions";
import type { ActionState } from "../actions";

const initialState: ActionState = {};

export default function ActivateForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(activateAccount, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
          Repite la contraseña
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "var(--brand, #dc2626)" }}
      >
        {pending ? "Activando…" : "Activar cuenta y entrar"}
      </button>

      <p className="text-xs text-gray-400 text-center">Mínimo 8 caracteres.</p>
    </form>
  );
}
