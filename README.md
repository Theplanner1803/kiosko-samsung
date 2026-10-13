# Kioskia: sitio de venta de kioskos Samsung

Landing para vender el **Samsung Kiosk KMC-P de 24" (CY-KM24CPXZA)** y captar cotizaciones.
Es un sitio estático (HTML, CSS y JS sin compilación): se sube tal cual a cualquier hosting.

## Antes de publicar (obligatorio)

1. **`assets/js/config.js`**: WhatsApp ya configurado (`529982938225`). Agrega `salesEmail` si quieres respaldo por correo.
2. **`aviso-privacidad.html`**: completa razón social, domicilio y correo, y valídalo con tu asesor legal.
   La ley mexicana (LFPDPPP) lo exige porque el formulario recaba datos personales.
3. **Nombre de marca**: "Kioskia" es provisional. Para cambiarlo, busca y reemplaza `Kioskia` en `index.html`,
   `aviso-privacidad.html` y `assets/js/kiosk-sim.js`.
4. **Recomendado**: crea un formulario gratuito en [Formspree](https://formspree.io) y pon su URL en `quoteEndpoint`.
   Así queda registrada cada solicitud aunque el cliente no termine de enviar el WhatsApp.

## Publicar

- **Netlify (lo más rápido)**: entra a app.netlify.com/drop y arrastra la carpeta `kiosko-samsung`.
- **Vercel / GitHub Pages / hosting tradicional**: sube el contenido de la carpeta. No necesita build.
- Después conecta tu dominio y agrega `<link rel="canonical">` y `og:url` en `index.html` con la URL final.

Cuando cambies CSS o JS, sube el número `?v=5` en las etiquetas `<link>` y `<script>` para que los visitantes no vean versiones en caché.

## Cómo fluye una venta

1. El visitante prueba el **simulador** del hero (pedido → combo sugerido → pago NFC/QR → ticket impreso).
2. Calcula su beneficio en la **calculadora de ROI**.
3. Arma su solución en el **configurador** y envía sus datos.
4. Se abre WhatsApp (o su correo) con la solicitud completa. Si hay `quoteEndpoint`, también se registra ahí.

## Estructura

| Archivo | Responsabilidad |
| --- | --- |
| `index.html` | Contenido y estructura de la página |
| `assets/css/styles.css` | Estilos, kiosko dibujado en CSS, responsive |
| `assets/js/config.js` | Datos de contacto y endpoint (lo único que se edita) |
| `assets/js/main.js` | Navegación, animaciones, pestañas, enlaces de contacto |
| `assets/js/kiosk-sim.js` | Simulador interactivo del kiosko |
| `assets/js/roi.js` | Calculadora de retorno (`estimateKioskBenefit`) |
| `assets/js/quote.js` | Configurador, validación y envío de la cotización |

## Decisiones

- **Sin precios publicados**: no hay precio confirmado para México. El sitio vende por cotización.
  Cuando tengas el costo con tu mayorista, agregar un "desde $X" suele aumentar la conversión.
- **Sin fotos oficiales de Samsung**: el kiosko se dibuja en CSS para evitar problemas de derechos de imagen.
  Si tu mayorista o Samsung te autoriza fotos o renders, agrégalos en `assets/img/`.
- **Fotos de ambiente**: de Unsplash (licencia libre para uso comercial, sin atribución obligatoria), guardadas en
  `assets/img/` como WebP. Se eligieron sin logos de cadenas ni kioskos de otras marcas.
- **Marca**: el pie de página aclara que Kioskia es un integrador independiente. Si eres distribuidor
  autorizado de Samsung, puedes indicarlo (solo con la autorización por escrito).

| Archivo | Uso | Autor (Unsplash) |
| --- | --- | --- |
| `ind-restaurante.webp` | Restaurantes | Jonathan Borba |
| `ind-cafeteria.webp` | Cafeterías | Nathan Dumlao |
| `ind-retail.webp` | Retail | Blake Wisz |
| `ind-cine.webp` | Cines | Meg Boulden |
| `ind-hotel.webp` | Hoteles | Neon Wang |
| `ind-clinica.webp` | Clínicas | Malcolm Choong |
| `pago-tarjeta.webp` | Sección "Un solo equipo" | Towfiqu barbhuiya |
| `cta-clientes.webp` | Llamado final | Dan Gold |

## Paleta

Azul marino de base, **azul** como color principal (botones, enlaces), **naranja coral** como acento cálido
(industrias, venta extra, paso 3) y **menta** para estados de éxito (pago aprobado, beneficios). Los tokens están al
inicio de `styles.css`; evita agregar más colores de acento.
