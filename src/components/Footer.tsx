import Link from "next/link";
import { Mail, MapPin, Share2, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "var(--ink)", color: "#e5e5e5" }}>

      {/* Gold top rule */}
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-baseline gap-0.5 mb-5 inline-flex">
              <span className="font-display text-2xl font-bold" style={{ color: "var(--brand)" }}>Dos</span>
              <span className="font-display text-2xl font-bold text-white">&amp;</span>
              <span className="font-display text-2xl font-bold" style={{ color: "var(--brand)" }}>Go</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#9ca3af" }}>
              Relojes de alta calidad para cada momento de tu vida. Precisión, estilo y elegancia en cada pieza.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-red-600"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Web"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-red-600"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h3
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5"
              style={{ color: "var(--gold)" }}
            >
              Tienda
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/productos" className="text-sm transition-colors hover:text-white" style={{ color: "#9ca3af" }}>
                  Todos los relojes
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5"
              style={{ color: "var(--gold)" }}
            >
              Ayuda
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/devoluciones" className="text-sm transition-colors hover:text-white" style={{ color: "#9ca3af" }}>
                  Envíos y devoluciones
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="text-sm transition-colors hover:text-white" style={{ color: "#9ca3af" }}>
                  Garantía
                </Link>
              </li>
              <li>
                <Link href="/legal/terminos" className="text-sm transition-colors hover:text-white" style={{ color: "#9ca3af" }}>
                  Términos y condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-5"
              style={{ color: "var(--gold)" }}
            >
              Contacto
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm" style={{ color: "#9ca3af" }}>
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
                info@dosandgo.com
              </li>
              <li className="flex items-start gap-3 text-sm" style={{ color: "#9ca3af" }}>
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
                Cristobal de Morales n42
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs" style={{ color: "#6b7280" }}>
            © 2026 Dos&amp;Go Relojes. Todos los derechos reservados.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs" style={{ color: "#6b7280" }}>
            <Link href="/legal/aviso-legal" className="hover:text-white transition-colors">Aviso legal</Link>
            <Link href="/legal/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
            <Link href="/legal/terminos" className="hover:text-white transition-colors">Términos</Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: "#6b7280" }}>Pagos seguros con</span>
            <span className="font-bold text-sm text-white">Stripe</span>
            {["Visa", "Mastercard", "Amex"].map((card) => (
              <span
                key={card}
                className="px-2 py-1 rounded text-xs"
                style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}
              >
                {card}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
