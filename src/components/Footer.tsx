import Link from "next/link";
import { Mail, Phone, MapPin, Share2, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-0">
      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <span className="text-2xl font-black" style={{ color: "var(--brand)" }}>Dos</span>
              <span className="text-2xl font-black text-white">&amp;</span>
              <span className="text-2xl font-black" style={{ color: "var(--brand)" }}>Go</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Relojes de alta calidad para cada momento de tu vida. Precisión, estilo y elegancia en cada pieza.
            </p>
            <div className="flex gap-2.5">
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Tienda</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/productos" className="text-gray-400 text-sm hover:text-white transition-colors">
                  Todos los relojes
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Ayuda</h3>
            <ul className="space-y-2.5">
              {["Política de envíos", "Devoluciones", "Garantía", "Preguntas frecuentes", "Seguimiento de pedido"].map((item) => (
                <li key={item}>
                  <span className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-gray-400 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "var(--brand)" }} />
                info@dosandgo.com
              </li>
              <li className="flex items-center gap-2.5 text-gray-400 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "var(--brand)" }} />
                +34 900 123 456
              </li>
              <li className="flex items-start gap-2.5 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
                Calle Gran Vía 28, Madrid, España
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">© 2026 Dos&amp;Go Relojes. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-xs">Pagos seguros con</span>
            <span className="text-gray-300 font-bold text-sm">Stripe</span>
            {["Visa", "Mastercard", "Amex"].map((card) => (
              <span key={card} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">{card}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
