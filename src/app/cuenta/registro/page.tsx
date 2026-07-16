import { redirect } from "next/navigation";
import AuthForm from "../AuthForm";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Crear cuenta — Dos&Go" };

export default async function RegistroPage() {
  if (await getCurrentCustomer()) redirect("/cuenta");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: "radial-gradient(115% 60% at 85% 6%, rgba(158,27,31,0.14) 0%, transparent 44%), linear-gradient(180deg,#0d0d13,#08080b)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 p-7 shadow-2xl" style={{ background: "linear-gradient(180deg,#15151c,#0c0c11)" }}>
        <span className="text-gold text-[10px] font-bold uppercase tracking-[0.22em]">Dos&amp;Go · Club</span>
        <h1 className="font-display text-2xl font-bold text-white mt-1 mb-1.5">Crea tu cuenta</h1>
        <p className="text-sm text-gray-400 mb-5">
          Sigue tus pedidos y reservas, sube de nivel con cada compra y gana descuentos con la ruleta.
        </p>
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
