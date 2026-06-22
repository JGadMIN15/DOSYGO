import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de cookies · Dos&Go",
  description: "Información sobre el uso de cookies en este sitio web.",
};

export default function CookiesPage() {
  return (
    <>
      <h1>Política de cookies</h1>
      <p className="text-sm text-gray-400">Última actualización: junio de 2026</p>

      <p>
        Una cookie es un pequeño archivo que se almacena en tu dispositivo al
        visitar el sitio. Esta política explica qué cookies utilizamos y cómo
        puedes gestionarlas, conforme al artículo 22.2 de la LSSI-CE y al
        Reglamento (UE) 2016/679 (RGPD).
      </p>

      <h2>1. Cookies que utilizamos</h2>
      <ul>
        <li>
          <strong>Técnicas / necesarias</strong> (no requieren consentimiento):
          permiten el funcionamiento básico del sitio, la gestión del carrito, la
          sesión del panel de administración y el registro de tu preferencia de
          cookies.
        </li>
        <li>
          <strong>De terceros — Stripe</strong>: nuestro proveedor de pagos puede
          instalar cookies necesarias para procesar el pago de forma segura y
          prevenir el fraude. Más información en la política de privacidad de
          Stripe.
        </li>
        <li>
          <strong>Analíticas / marketing</strong>: [COMPLETAR si en el futuro se
          añaden, p. ej. Google Analytics o píxeles publicitarios. Estas SÍ
          requieren consentimiento previo y deberán cargarse solo tras aceptarlas.]
        </li>
      </ul>

      <h2>2. Base jurídica</h2>
      <p>
        Las cookies técnicas se basan en el interés legítimo de prestar el
        servicio solicitado. Cualquier cookie no esencial requiere tu
        consentimiento, que solicitamos mediante el banner de cookies.
      </p>

      <h2>3. Cómo gestionar o retirar el consentimiento</h2>
      <p>
        Puedes aceptar o rechazar las cookies no esenciales desde el banner que
        aparece al entrar. Además, puedes configurar o eliminar las cookies desde
        los ajustes de tu navegador (Chrome, Firefox, Safari, Edge…). Ten en
        cuenta que desactivar ciertas cookies puede afectar al funcionamiento del
        sitio.
      </p>

      <h2>4. Más información</h2>
      <p>
        Para cualquier duda sobre esta política puedes escribirnos a [COMPLETAR:
        email de contacto].
      </p>
    </>
  );
}
