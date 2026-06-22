import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad · Dos&Go",
  description: "Cómo tratamos tus datos personales conforme al RGPD.",
};

export default function PrivacidadPage() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p className="text-sm text-gray-400">Última actualización: junio de 2026</p>

      <p>
        Esta política describe cómo tratamos tus datos personales conforme al
        Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li><strong>Responsable:</strong> [COMPLETAR: razón social / nombre]</li>
        <li><strong>NIF/CIF:</strong> [COMPLETAR]</li>
        <li><strong>Domicilio:</strong> [COMPLETAR]</li>
        <li><strong>Contacto:</strong> [COMPLETAR: email de privacidad]</li>
      </ul>

      <h2>2. Datos que tratamos y finalidades</h2>
      <ul>
        <li>
          <strong>Datos de pedido y envío</strong> (nombre, dirección, email):
          para gestionar la compra, el envío y la atención al cliente.
        </li>
        <li>
          <strong>Datos de pago</strong>: el pago lo procesa Stripe; nosotros no
          almacenamos los datos completos de tu tarjeta.
        </li>
        <li>
          <strong>Datos de navegación</strong>: ver la <a href="/legal/cookies">Política de cookies</a>.
        </li>
      </ul>

      <h2>3. Base jurídica</h2>
      <ul>
        <li>Ejecución del contrato de compraventa (art. 6.1.b RGPD).</li>
        <li>Cumplimiento de obligaciones legales, p. ej. fiscales (art. 6.1.c).</li>
        <li>Consentimiento para comunicaciones o cookies no esenciales (art. 6.1.a).</li>
      </ul>

      <h2>4. Conservación</h2>
      <p>
        Conservamos los datos durante el tiempo necesario para prestar el servicio
        y, posteriormente, durante los plazos legalmente exigidos (p. ej.
        obligaciones fiscales y contables).
      </p>

      <h2>5. Destinatarios (encargados del tratamiento)</h2>
      <p>
        Compartimos datos únicamente con proveedores que nos prestan servicios,
        bajo el correspondiente contrato de encargo de tratamiento, entre ellos:
      </p>
      <ul>
        <li><strong>Stripe</strong> — procesamiento de pagos.</li>
        <li><strong>Vercel</strong> — alojamiento de la web y almacenamiento de imágenes.</li>
        <li><strong>Neon</strong> — base de datos.</li>
        <li>[COMPLETAR: cualquier otro proveedor: transportista, email, etc.]</li>
      </ul>
      <p>
        Algunos proveedores pueden realizar transferencias internacionales de
        datos amparadas en las garantías previstas en el RGPD (p. ej. cláusulas
        contractuales tipo).
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer tus derechos de acceso, rectificación, supresión,
        oposición, limitación del tratamiento y portabilidad escribiendo a
        [COMPLETAR: email]. También puedes presentar una reclamación ante la
        Agencia Española de Protección de Datos (www.aepd.es) si consideras que
        tus derechos no han sido atendidos.
      </p>
    </>
  );
}
