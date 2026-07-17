import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Ticket, Package, Sparkles, LogOut } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { logoutCustomer } from "./actions";
import Roulette from "./Roulette";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { RESERVATION_STATUS_LABEL } from "@/lib/reservation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuenta — Dos&Go" };

const LEVEL_CENTS = 40000; // 400 € por nivel

export default async function CuentaPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/cuenta/entrar");

  const spent = customer.totalSpentCents;
  const level = customer.level;
  const inLevel = spent - level * LEVEL_CENTS;
  const progress = Math.min(100, Math.round((inLevel / LEVEL_CENTS) * 100));
  const remaining = Math.max(0, (level + 1) * LEVEL_CENTS - spent);
  const totalSpins = (customer.welcomeSpun ? 0 : 1) + customer.pendingSpins;

  const [orders, reservations, rewards] = await Promise.all([
    prisma.order.findMany({
      where: { customerEmail: customer.email },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, trackingCode: true, total: true, status: true, createdAt: true },
    }),
    prisma.reservation.findMany({
      where: { customerEmail: customer.email },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, brand: true, sku: true, status: true, ticket: true, depositCents: true },
    }),
    prisma.discountReward.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, percent: true, used: true, source: true },
    }),
  ]);

  const availableRewards = rewards.filter((r) => !r.used);

  return (
    <div style={{ background: "radial-gradient(110% 50% at 85% 0%, rgba(158,27,31,0.12) 0%, transparent 45%), linear-gradient(180deg,#0d0d13,#08080b)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 min-h-screen">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.22em]">Dos&amp;Go · Club</span>
            <h1 className="font-display text-3xl font-bold text-white mt-1">Hola, {customer.name || customer.username}</h1>
          </div>
          <form action={logoutCustomer}>
            <button className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 rounded-lg px-3 py-2 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </form>
        </div>

        {/* Nivel + progreso */}
        <div className="rounded-2xl border border-white/10 p-6 mb-5" style={{ background: "linear-gradient(180deg,#15151c,#0c0c11)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(201,169,110,0.15)" }}>
              <Trophy className="w-5 h-5" style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Nivel {level}</p>
              <p className="text-xs text-gray-400">Has gastado {formatPrice(spent)} en total</p>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--brand), var(--gold))" }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Te faltan <span className="text-white font-semibold">{formatPrice(remaining)}</span> para el nivel {level + 1} (cada nivel = una tirada de ruleta).
          </p>
        </div>

        {/* Ruleta */}
        <div className="rounded-2xl border border-white/10 p-6 mb-5" style={{ background: "linear-gradient(180deg,#15151c,#0c0c11)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5" style={{ color: "var(--gold)" }} />
            <h2 className="text-white font-bold">Ruleta de premios</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {totalSpins > 0
              ? "¡Gírala y llévate un descuento para tu próxima compra!"
              : "Sube de nivel (cada 400 € de compra) para ganar tiradas."}
          </p>
          <Roulette initialSpins={totalSpins} />
        </div>

        {/* Descuentos */}
        <div className="rounded-2xl border border-white/10 p-6 mb-5" style={{ background: "linear-gradient(180deg,#15151c,#0c0c11)" }}>
          <h2 className="text-white font-bold mb-1.5">Mis descuentos</h2>
          {availableRewards.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no tienes descuentos. Gánalos con la ruleta.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {availableRewards.map((r) => (
                <span key={r.id} className="inline-flex items-center gap-1 text-sm font-bold text-white rounded-lg px-3 py-1.5" style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-dark))" }}>
                  -{r.percent}%
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-gray-500 mt-3">Se aplican en cualquier pedido, uno por pedido (no se acumulan).</p>
        </div>

        {/* Reservas */}
        <div className="rounded-2xl border border-white/10 p-6 mb-5" style={{ background: "linear-gradient(180deg,#15151c,#0c0c11)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5" style={{ color: "var(--gold)" }} />
            <h2 className="text-white font-bold">Mis reservas</h2>
          </div>
          {reservations.length === 0 ? (
            <p className="text-sm text-gray-400">No tienes reservas. <Link href="/catalogo" className="text-gold underline">Explora el catálogo</Link>.</p>
          ) : (
            <div className="space-y-2">
              {reservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate"><span className="text-gold font-semibold">{r.brand}</span> · <span className="font-mono">{r.sku}</span></p>
                    <p className="text-xs text-gray-400">{RESERVATION_STATUS_LABEL[r.status] ?? r.status} · señal {formatPrice(r.depositCents)}</p>
                  </div>
                  {r.ticket && <Link href={`/reserva/${r.ticket}`} className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 whitespace-nowrap">Ver</Link>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos */}
        <div className="rounded-2xl border border-white/10 p-6" style={{ background: "linear-gradient(180deg,#15151c,#0c0c11)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5" style={{ color: "var(--gold)" }} />
            <h2 className="text-white font-bold">Mis pedidos</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-400">Aún no tienes pedidos.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm text-white font-mono">{o.trackingCode}</p>
                    <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("es-ES")} · {o.status}</p>
                  </div>
                  <span className="text-sm font-bold text-white">{formatPrice(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
