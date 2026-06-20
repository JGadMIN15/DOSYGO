import Link from "next/link";
import { Watch, Mail, Phone, MapPin, Share2, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-black" style={{ color: "var(--brand)" }}>
                Dos&amp;Go
              </span>
              <Watch className="w-5 h-5" style={{ color: "var(--brand)" }} />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Relojes de alta calidad para cada momento de tu vida. Precisión, estilo y elegancia en cada pieza.
            </p>
            <div className="flex gap-3 mt-5">
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
            <h3 className="font-semibold text-white mb-4">Tienda</h3>
            <ul className="space-y-2">
              {[
                ["Todos los relojes", "/productos"],
                ["Cronógrafos", "/productos?categoria=Cronógrafos"],
                ["Deportivos", "/productos?categoria=Deportivos"],
                ["Clásicos", "/productos?categoria=Clásicos"],
                ["Para Ella", "/productos?categoria=Para+Ella"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-gray-400 text-sm hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="font-semibold text-white mb-4">Ayuda</h3>
            <ul className="space-y-2">
              {[
                "Política de envíos",
                "Devoluciones",
                "Garantía",
                "FAQ",
                "Seguimiento de pedido",
              ].map((item) => (
                <li key={item}>
                  <span className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "var(--brand)" }} />
                info@dosandgo.com
              </li>
              <li className="flex items-center gap-2 text-gray-400 text-sm">
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "var(--brand)" }} />
                +34 900 123 456
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--brand)" }} />
                Calle Gran Vía 28, Madrid, España
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Dos&amp;Go Relojes. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-xs">Pagos seguros con</span>
            <span className="text-gray-300 font-bold text-sm">Stripe</span>
            <div className="flex gap-2">
              {["Visa", "Mastercard", "Amex"].map((card) => (
                <span key={card} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                  {card}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
