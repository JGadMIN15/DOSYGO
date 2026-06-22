import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal · Dos&Go",
  description: "Información legal y datos identificativos del titular de la web.",
};

export default function AvisoLegalPage() {
  return (
    <>
      <h1>Aviso legal</h1>
      <p className="text-sm text-gray-400">Última actualización: junio de 2026</p>

      <p>
        En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la
        Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se ponen a
        disposición de los usuarios los siguientes datos identificativos del
        titular de este sitio web.
      </p>

      <h2>1. Titular del sitio web</h2>
      <ul>
        <li><strong>Titular:</strong> [COMPLETAR: razón social o nombre y apellidos]</li>
        <li><strong>NIF/CIF:</strong> [COMPLETAR: NIF/CIF]</li>
        <li><strong>Domicilio:</strong> [COMPLETAR: dirección postal completa]</li>
        <li><strong>Correo electrónico:</strong> [COMPLETAR: email de contacto]</li>
        <li><strong>Teléfono:</strong> [COMPLETAR: teléfono]</li>
        <li><strong>Datos registrales:</strong> [COMPLETAR si procede: Registro Mercantil, tomo, folio, hoja]</li>
        <li><strong>Sitio web:</strong> dosygo.es</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        El presente sitio web tiene por objeto la venta en línea de relojes y
        artículos relacionados. El acceso y uso del sitio atribuye la condición de
        usuario e implica la aceptación de las condiciones recogidas en este Aviso
        legal.
      </p>

      <h2>3. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del sitio (textos, imágenes, marcas, logotipos,
        diseño y código) son titularidad del titular o de terceros que han
        autorizado su uso. Queda prohibida su reproducción, distribución o
        transformación sin autorización expresa.
      </p>

      <h2>4. Responsabilidad</h2>
      <p>
        El titular no se hace responsable de los daños derivados de un uso
        inadecuado del sitio ni de la indisponibilidad temporal del mismo por
        causas técnicas. El titular se reserva el derecho a modificar los
        contenidos sin previo aviso.
      </p>

      <h2>5. Legislación aplicable</h2>
      <p>
        Este Aviso legal se rige por la legislación española. Para la resolución
        de cualquier controversia las partes se someten a los juzgados y
        tribunales que correspondan conforme a derecho.
      </p>
    </>
  );
}
