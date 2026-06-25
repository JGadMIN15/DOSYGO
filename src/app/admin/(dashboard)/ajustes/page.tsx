export const dynamic = "force-dynamic";

import { requireRole } from "@/lib/admin-session";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "../../actions";

export default async function AjustesPage() {
  await requireRole("admin");
  const s = await getSettings();

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Ajustes</h1>
      <p className="text-sm text-gray-500 mb-6">
        Configuración de la tienda. Se aplica al carrito, al pago y a las facturas.
      </p>

      <form action={saveSettings} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label htmlFor="ivaPercent" className="block text-sm font-medium text-gray-700 mb-1">
            IVA (%)
          </label>
          <input
            id="ivaPercent"
            name="ivaPercent"
            type="number"
            min="0"
            max="100"
            step="1"
            defaultValue={s.ivaPercent}
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            Se usa para desglosar la base imponible y el IVA en las facturas.
          </p>
        </div>

        <div>
          <label htmlFor="freeShippingEuros" className="block text-sm font-medium text-gray-700 mb-1">
            Envío gratis a partir de (€)
          </label>
          <input
            id="freeShippingEuros"
            name="freeShippingEuros"
            type="number"
            min="0"
            step="0.01"
            defaultValue={s.freeShippingCents / 100}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="shippingEuros" className="block text-sm font-medium text-gray-700 mb-1">
            Coste de envío (€)
          </label>
          <input
            id="shippingEuros"
            name="shippingEuros"
            type="number"
            min="0"
            step="0.01"
            defaultValue={s.shippingCents / 100}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: "var(--brand, #dc2626)" }}
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
