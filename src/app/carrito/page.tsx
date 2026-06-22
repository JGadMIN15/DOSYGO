"use client";

import { useCartStore } from "@/lib/store";
import WatchImage from "@/components/WatchImage";
import Link from "next/link";
import { Trash2, ShoppingBag, ChevronRight, Shield, Truck } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 9 && phoneDigits.length <= 15;
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const sendCode = async () => {
    if (!emailValid) return;
    setOtpLoading(true);
    setOtpMsg(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodeSent(true);
        setOtpMsg("Te hemos enviado un código a tu email.");
      } else {
        setOtpMsg(data.error ?? "No se pudo enviar el código.");
      }
    } catch {
      setOtpMsg("Error de conexión.");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.trim().length < 4) return;
    setOtpLoading(true);
    setOtpMsg(null);
    try {
      const res = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailVerified(true);
        setOtpMsg(null);
      } else {
        setOtpMsg(data.error ?? "Código incorrecto.");
      }
    } catch {
      setOtpMsg("Error de conexión.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || !accepted || !phoneValid || !emailVerified) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, phone: phone.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Error al procesar el pago. Inténtalo de nuevo.");
      }
    } catch {
      alert("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(227,30,36,0.08)" }}>
          <ShoppingBag className="w-12 h-12" style={{ color: "var(--brand)" }} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8">Explora nuestra colección y encuentra el reloj perfecto para ti.</p>
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold"
          style={{ background: "var(--brand)" }}
        >
          Ver relojes <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  const subtotal = total();
  const shipping = subtotal >= 100 ? 0 : 5.99;
  const grandTotal = subtotal + shipping;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-gray-900 mb-8">
        Carrito <span className="text-gray-400 font-normal text-xl">({count()} {count() === 1 ? "artículo" : "artículos"})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                <WatchImage src={item.image} name={item.name} category="Relojes" className="w-full h-full scale-90" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 truncate">{item.name}</h3>
                <p className="font-bold text-lg" style={{ color: "var(--brand)" }}>
                  {item.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </p>
                <div className="flex items-center justify-between mt-3">
                  {/* Quantity */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 font-bold text-base"
                    >
                      −
                    </button>
                    <span className="px-2 text-sm font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 font-bold text-base"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {(item.price * item.quantity).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-20">
            <h2 className="font-black text-lg text-gray-900 mb-5">Resumen del pedido</h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({count()} artículos)</span>
                <span>{subtotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Envío</span>
                <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                  {shipping === 0 ? "Gratis" : shipping.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Añade {(100 - subtotal).toLocaleString("es-ES", { style: "currency", currency: "EUR" })} más para envío gratis</p>
              )}
              <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-lg text-gray-900">
                <span>Total</span>
                <span>{grandTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</span>
              </div>
            </div>

            {/* Email + verificación por código */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="flex gap-2">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailVerified(false);
                    setCodeSent(false);
                  }}
                  disabled={emailVerified}
                  placeholder="tucorreo@email.com"
                  className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50"
                />
                {!emailVerified && (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={!emailValid || otpLoading}
                    className="rounded-xl border border-gray-300 px-3 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
                  >
                    {codeSent ? "Reenviar" : "Enviar código"}
                  </button>
                )}
              </div>

              {emailVerified ? (
                <p className="text-xs text-green-600 mt-1 font-medium">✓ Email verificado</p>
              ) : codeSent ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                  <button
                    type="button"
                    onClick={verifyCode}
                    disabled={otpLoading || code.trim().length < 4}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--brand)" }}
                  >
                    Verificar
                  </button>
                </div>
              ) : null}

              {otpMsg && <p className="text-xs text-gray-500 mt-1">{otpMsg}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                Teléfono de contacto
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-1 ${
                  phone && !phoneValid
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                }`}
              />
              {phone && !phoneValid && (
                <p className="text-xs text-red-600 mt-1">
                  Introduce un teléfono válido (9–15 dígitos).
                </p>
              )}
            </div>

            <label className="flex items-start gap-2 mb-4 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 flex-shrink-0"
              />
              <span>
                He leído y acepto los{" "}
                <Link href="/legal/terminos" className="underline" style={{ color: "var(--brand)" }}>
                  Términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/legal/privacidad" className="underline" style={{ color: "var(--brand)" }}>
                  Política de privacidad
                </Link>
                .
              </span>
            </label>

            <button
              onClick={handleCheckout}
              disabled={loading || !accepted || !phoneValid || !emailVerified}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              style={{ background: "var(--brand)" }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                <>Pagar con Stripe · {grandTotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</>
              )}
            </button>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Shield className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
                Pago 100% seguro con Stripe
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Truck className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
                Entrega estimada: hasta 14 días hábiles
              </div>
            </div>

            <Link
              href="/productos"
              className="block text-center text-sm font-medium mt-4 hover:underline"
              style={{ color: "var(--brand)" }}
            >
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
