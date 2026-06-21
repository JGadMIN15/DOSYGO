import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle, Package, Truck, Home, ChevronRight, MapPin } from "lucide-react";
import ClearCartOnLoad from "@/components/ClearCartOnLoad";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Sesión de pago no encontrada.</p>
        <Link href="/" className="mt-4 inline-block font-semibold" style={{ color: "var(--brand)" }}>Ir al inicio</Link>
      </div>
    );
  }

  let session;
  let order;

  try {
    session = await getStripe().checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    order = await prisma.order.findUnique({
      where: { stripeSessionId: session_id },
      include: { tracking: { orderBy: { timestamp: "asc" } }, items: { include: { product: true } } },
    });
  } catch {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Error al cargar el pedido.</p>
      </div>
    );
  }

  const customerName = session.customer_details?.name ?? "Cliente";
  const customerEmail = session.customer_details?.email ?? "";
  const total = (session.amount_total ?? 0) / 100;

  const trackingSteps = [
    { key: "confirmed",  label: "Pedido confirmado",   icon: CheckCircle, color: "text-green-600",  bg: "bg-green-100" },
    { key: "processing", label: "En preparación",      icon: Package,     color: "text-blue-600",   bg: "bg-blue-100" },
    { key: "shipped",    label: "En camino",            icon: Truck,       color: "text-orange-600", bg: "bg-orange-100" },
    { key: "delivered",  label: "Entregado",            icon: Home,        color: "text-green-600",  bg: "bg-green-100" },
  ];

  const completedStatuses = order?.tracking.map((t) => t.status) ?? ["confirmed"];
  const currentStepIdx = Math.max(
    ...trackingSteps.map((s, i) => (completedStatuses.includes(s.key) ? i : -1))
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <ClearCartOnLoad />

      {/* Cabecera */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(22,163,74,0.1)" }}>
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">¡Pedido confirmado!</h1>
        <p className="text-gray-500 text-lg">
          Gracias, {customerName.split(" ")[0]}. Hemos recibido tu pedido y lo estamos preparando.
        </p>
        <p className="text-sm text-gray-400 mt-1">Confirmación enviada a <strong>{customerEmail}</strong></p>
      </div>

      {/* Número de pedido y tracking */}
      {order && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Número de seguimiento</p>
              <p className="text-2xl font-black tracking-widest" style={{ color: "var(--brand)" }}>
                {order.trackingCode}
              </p>
            </div>
            {order.estimatedDelivery && (
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Entrega estimada</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(order.estimatedDelivery).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Pasos de tracking */}
          <div className="relative">
            <div className="flex items-start justify-between">
              {trackingSteps.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStepIdx;
                const isActive = idx === currentStepIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    {/* Connector line */}
                    {idx < trackingSteps.length - 1 && (
                      <div
                        className="absolute top-5 left-1/2 w-full h-0.5"
                        style={{
                          background: idx < currentStepIdx ? "var(--brand)" : "#e5e7eb",
                        }}
                      />
                    )}
                    {/* Icon circle */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isDone ? step.bg : "bg-gray-100"
                      } ${isActive ? "ring-2 ring-offset-2" : ""}`}
                      style={isActive ? { outline: "2px solid var(--brand)", outlineOffset: "2px" } : {}}
                    >
                      <Icon className={`w-5 h-5 ${isDone ? step.color : "text-gray-400"}`} />
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight ${isDone ? "text-gray-900" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Último evento */}
          {order.tracking.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--brand)" }} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {order.tracking[order.tracking.length - 1].description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.tracking[order.tracking.length - 1].location} ·{" "}
                    {new Date(order.tracking[order.tracking.length - 1].timestamp).toLocaleString("es-ES")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumen del pedido */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Resumen del pedido</h2>
        {order?.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
              <p className="text-xs text-gray-400">x{item.quantity}</p>
            </div>
            <p className="text-sm font-semibold">
              {(item.price * item.quantity).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </p>
          </div>
        ))}
        <div className="flex justify-between items-center pt-4 mt-2">
          <span className="font-black text-gray-900">Total pagado</span>
          <span className="font-black text-xl" style={{ color: "var(--brand)" }}>
            {total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </span>
        </div>
      </div>

      {/* Dirección de envío */}
      {order?.shippingAddress && (() => {
        try {
          const addr = JSON.parse(order.shippingAddress);
          return addr.line1 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
              <h2 className="font-bold text-gray-900 mb-3">Dirección de entrega</h2>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <div className="text-sm text-gray-600 leading-relaxed">
                  <p className="font-medium text-gray-900">{addr.name}</p>
                  <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                  <p>{addr.postal_code} {addr.city}, {addr.state}</p>
                  <p>{addr.country}</p>
                </div>
              </div>
            </div>
          ) : null;
        } catch { return null; }
      })()}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/productos"
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold"
          style={{ background: "var(--brand)" }}
        >
          Seguir comprando <ChevronRight className="w-5 h-5" />
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
        ¿Tienes dudas? Escríbenos a{" "}
        <a href="mailto:info@dosandgo.com" className="underline" style={{ color: "var(--brand)" }}>
          info@dosandgo.com
        </a>
      </p>
    </div>
  );
}
