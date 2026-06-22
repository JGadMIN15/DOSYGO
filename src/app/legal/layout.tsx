import type { ReactNode } from "react";
import Link from "next/link";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10">
          <article className="text-[15px] leading-relaxed text-gray-700 space-y-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-red-600 [&_a]:underline [&_strong]:text-gray-900">
            {children}
          </article>
          <nav className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            <Link href="/legal/aviso-legal" className="hover:text-gray-900">Aviso legal</Link>
            <Link href="/legal/privacidad" className="hover:text-gray-900">Privacidad</Link>
            <Link href="/legal/cookies" className="hover:text-gray-900">Cookies</Link>
            <Link href="/legal/terminos" className="hover:text-gray-900">Términos</Link>
            <Link href="/legal/devoluciones" className="hover:text-gray-900">Devoluciones</Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
