import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devoluciones y desistimiento · Dos&Go",
  description: "Derecho de desistimiento, devoluciones y reembolsos.",
};

export default function DevolucionesPage() {
  return (
    <>
      <h1>Política de devoluciones y desistimiento</h1>
      <p className="text-sm text-gray-400">Última actualización: junio de 2026</p>

      <h2>1. Derecho de desistimiento</h2>
      <p>
        Si eres consumidor, dispones de un plazo de <strong>14 días naturales</strong>{" "}
        desde la recepción del producto para desistir de la compra sin necesidad de
        justificación.
      </p>

      <h2>2. Cómo ejercerlo</h2>
      <p>
        Comunícanos tu decisión de desistir mediante una declaración inequívoca
        (por ejemplo, un correo electrónico) a [COMPLETAR: email], indicando tu
        número de pedido. Puedes usar el modelo de formulario de desistimiento
        oficial, aunque no es obligatorio.
      </p>

      <h2>3. Devolución del producto</h2>
      <p>
        Deberás devolver el producto sin demora indebida y, en todo caso, en un
        plazo máximo de 14 días naturales desde que comuniques el desistimiento. La
        dirección de devolución es: [COMPLETAR: dirección de devoluciones].
        [COMPLETAR: indica quién asume los gastos de devolución.]
      </p>

      <h2>4. Reembolso</h2>
      <p>
        Te reembolsaremos todos los pagos recibidos, incluidos los gastos de envío
        ordinarios, sin demora indebida y, a más tardar, en 14 días naturales desde
        que nos informes del desistimiento. Podremos retener el reembolso hasta
        haber recibido el producto o una prueba de su devolución. El reembolso se
        efectuará por el mismo medio de pago utilizado en la compra.
      </p>

      <h2>5. Excepciones</h2>
      <p>
        El derecho de desistimiento puede no aplicarse a determinados productos
        (por ejemplo, bienes personalizados o precintados por motivos de higiene
        una vez abiertos). [COMPLETAR: especifica las excepciones de tu catálogo si
        las hay.]
      </p>

      <h2>6. Garantía legal</h2>
      <p>
        Con independencia del derecho de desistimiento, los productos cuentan con la
        garantía legal de conformidad (ver{" "}
        <a href="/legal/terminos">Términos y condiciones</a>). Si el producto
        presenta un defecto, contáctanos en [COMPLETAR: email].
      </p>
    </>
  );
}
