"use client";

import { useEffect } from "react";

interface DocItem {
  name: string;
  qty: number;
  unit: number;
  lineTotal: number;
}

interface Props {
  type: "factura" | "albaran";
  docNumber: string;
  dateStr: string;
  customer: { name: string; email: string; phone: string | null };
  shippingName?: string;
  shippingLines: string[];
  items: DocItem[];
  shippingCost: number;
  total: number;
  base: number;
  iva: number;
  ivaPct: number;
}

function eur(n: number): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default function OrderDocument(props: Props) {
  const isFactura = props.type === "factura";

  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-[800px] mx-auto mb-4 flex justify-between items-center px-4">
        <a href="/admin/pedidos" className="text-sm text-gray-600 hover:text-gray-900">
          ← Volver a pedidos
        </a>
        <button
          onClick={() => window.print()}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "#dc2626" }}
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      <div
        className="printable max-w-[800px] mx-auto bg-white p-10 shadow text-gray-900"
        style={{ fontSize: "13px" }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
          <div>
            <div className="text-2xl font-bold">Dos&amp;Go</div>
            <div className="text-gray-500 mt-1">dosygo.es</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold uppercase">
              {isFactura ? "Factura" : "Albarán"}
            </div>
            <div className="text-gray-700 mt-1">Nº {props.docNumber}</div>
            <div className="text-gray-500">{props.dateStr}</div>
          </div>
        </div>

        {/* Customer / shipping */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-xs font-bold uppercase text-gray-400 mb-1">
              {isFactura ? "Facturar a" : "Cliente"}
            </div>
            <div className="font-medium">{props.customer.name}</div>
            <div className="text-gray-600">{props.customer.email}</div>
            {props.customer.phone && <div className="text-gray-600">{props.customer.phone}</div>}
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-gray-400 mb-1">
              Dirección de entrega
            </div>
            {props.shippingName && <div className="font-medium">{props.shippingName}</div>}
            {props.shippingLines.length > 0 ? (
              props.shippingLines.map((l, i) => (
                <div key={i} className="text-gray-600">
                  {l}
                </div>
              ))
            ) : (
              <div className="text-gray-400">—</div>
            )}
          </div>
        </div>

        {/* Items */}
        <table className="w-full mb-6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase text-gray-400">
              <th className="py-2">Descripción</th>
              <th className="py-2 text-center" style={{ width: 60 }}>
                Cant.
              </th>
              {isFactura && (
                <th className="py-2 text-right" style={{ width: 100 }}>
                  Precio
                </th>
              )}
              {isFactura && (
                <th className="py-2 text-right" style={{ width: 100 }}>
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {props.items.map((it, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{it.name}</td>
                <td className="py-2 text-center">{it.qty}</td>
                {isFactura && <td className="py-2 text-right">{eur(it.unit)}</td>}
                {isFactura && <td className="py-2 text-right">{eur(it.lineTotal)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals (factura) */}
        {isFactura && (
          <div className="flex justify-end">
            <div style={{ width: 260 }}>
              {props.shippingCost > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Envío (incl. IVA)</span>
                  <span>{eur(props.shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Base imponible</span>
                <span>{eur(props.base)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">IVA ({props.ivaPct}%)</span>
                <span>{eur(props.iva)}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-base">
                <span>Total</span>
                <span>{eur(props.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Albarán: units + signatures */}
        {!isFactura && (
          <div className="mt-8">
            <div className="text-gray-700">
              Total de artículos: {props.items.reduce((s, i) => s + i.qty, 0)}
            </div>
            <div className="mt-16 flex justify-between gap-8">
              <div className="border-t border-gray-300 pt-2 text-xs text-gray-500 flex-1">
                Firma del transportista
              </div>
              <div className="border-t border-gray-300 pt-2 text-xs text-gray-500 flex-1">
                Firma del cliente
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-400">
          dosygo.es · Documento generado automáticamente.
        </div>
      </div>
    </div>
  );
}
