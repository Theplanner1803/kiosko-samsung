/*
 * Configuración del sitio. Es el ÚNICO archivo que necesitas editar antes de publicar.
 * Los campos vacíos desactivan su función (el sitio sigue funcionando).
 */
window.SITE_CONFIG = {
  brand: "Kioskia",

  // WhatsApp de ventas en formato internacional, solo dígitos. México: "52" + 10 dígitos.
  whatsappNumber: "529982938225",

  // Correo de ventas. Se usa como respaldo si no hay WhatsApp configurado.
  salesEmail: "",

  // Teléfono visible en el pie de página. Ej. "+52 55 1234 5678"
  phoneDisplay: "+52 998 293 8225",

  // Opcional: URL que recibe la cotización por POST (JSON). Ej. un formulario de Formspree:
  // "https://formspree.io/f/xxxxxxx". Así cada solicitud queda registrada aunque el cliente no envíe el WhatsApp.
  quoteEndpoint: "",
};
