import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones · Dos&Go",
  description: "Condiciones generales de contratación de la tienda.",
};

export default function TerminosPage() {
  return (
    <>
      <h1>Términos y condiciones de venta</h1>
      <p className="text-sm text-gray-400">Última actualización: junio de 2026</p>

      <p>
        Estas condiciones generales de contratación regulan la compra de productos
        en este sitio web, titularidad de [COMPLETAR: razón social] (ver{" "}
        <a href="/legal/aviso-legal">Aviso legal</a>).
      </p>

      <h2>1. Proceso de compra</h2>
      <p>
        Para realizar un pedido, añade los productos al carrito y completa el pago.
        Antes de finalizar deberás aceptar estas condiciones y la{" "}
        <a href="/legal/privacidad">Política de privacidad</a>. Una vez confirmado
        el pago recibirás la confirmación del pedido.
      </p>

      <h2>2. Precios e impuestos</h2>
      <p>
        Los precios se muestran en euros (€) e incluyen los impuestos aplicables
        (IVA) salvo que se indique lo contrario. Los gastos de envío se indican
        antes de finalizar la compra.
      </p>

      <h2>3. Pago</h2>
      <p>
        El pago se realiza de forma segura a través de Stripe (tarjeta de
        crédito/débito). No almacenamos los datos completos de tu tarjeta.
      </p>

      <h2>4. Envío, entrega y transporte</h2>
      <p>
        Realizamos envíos a los países indicados en el proceso de compra. El plazo
        de entrega estimado se muestra en el momento del pedido. [COMPLETAR:
        detalles de transportista, plazos y costes si procede.]
      </p>
      <p>
        El transporte de los pedidos se realiza a través de empresas de mensajería
        externas. Los daños, pérdidas o incidencias que se produzcan{" "}
        <strong>durante el transporte</strong> son responsabilidad de la empresa de
        transporte encargada del envío, frente a la cual gestionaremos la
        reclamación correspondiente. Te recomendamos revisar el paquete en el
        momento de la entrega y hacer constar cualquier daño visible ante el
        transportista, así como comunicárnoslo lo antes posible.
      </p>
      <p>
        Si eres consumidor, el riesgo de pérdida o deterioro del producto se
        transmite cuando tú (o un tercero indicado por ti, distinto del
        transportista) tomas posesión material del producto, conforme a la
        normativa de consumo. Lo anterior no limita los derechos que la ley
        reconoce a los consumidores. Para clientes profesionales o empresas, la
        responsabilidad por incidencias de transporte recae en el transportista
        desde la entrega de la mercancía a este.
      </p>

      <h2>5. Derecho de desistimiento</h2>
      <p>
        Como consumidor tienes derecho a desistir de la compra en un plazo de 14
        días naturales. Consulta cómo ejercerlo en la{" "}
        <a href="/legal/devoluciones">Política de devoluciones</a>.
      </p>

      <h2>6. Garantía legal</h2>
      <p>
        Los productos cuentan con la garantía legal de conformidad prevista en la
        normativa de consumo española (Real Decreto Legislativo 1/2007, modificado
        por el RDL 7/2021), actualmente de 3 años desde la entrega para bienes.
      </p>

      <h2>7. Atención al cliente y reclamaciones</h2>
      <p>
        Para cualquier consulta o reclamación escríbenos a [COMPLETAR: email]. Como
        consumidor, también puedes acudir a la plataforma de resolución de litigios
        en línea de la Unión Europea:{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      <h2>8. Ley aplicable</h2>
      <p>
        Estas condiciones se rigen por la legislación española y la normativa de
        protección de los consumidores y usuarios.
      </p>
    </>
  );
}
