/* Comportamiento general del sitio y utilidades compartidas (window.Site). */
(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

  /** URL de WhatsApp con el mensaje precargado, o null si no hay número configurado. */
  function whatsappUrl(message) {
    const number = String(config.whatsappNumber || "").replace(/\D/g, "");
    if (!number) return null;
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  }

  /** Respaldo por correo cuando no hay WhatsApp configurado. */
  function mailtoUrl(subject, body) {
    if (!config.salesEmail) return null;
    return "mailto:" + config.salesEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  window.Site = { config, whatsappUrl, mailtoUrl, formatMXN: (n) => mxn.format(Math.round(n)) };

  // Enlaces de contacto: WhatsApp si existe, si no correo; si no hay ninguno, se ocultan.
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    const message = link.getAttribute("data-whatsapp");
    const href = whatsappUrl(message) || mailtoUrl("Información sobre kioskos Samsung", message);
    if (!href) {
      // Sin canal directo, los CTAs secundarios llevan al formulario y el botón flotante desaparece.
      if (link.classList.contains("wa-float")) link.hidden = true;
      else link.setAttribute("href", "#cotizar");
      return;
    }
    link.setAttribute("href", href);
    if (href.startsWith("https://")) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
    }
  });
  if (!config.whatsappNumber && !config.salesEmail) {
    console.warn("[Kioskia] Configura whatsappNumber o salesEmail en assets/js/config.js para recibir cotizaciones.");
  }

  // Línea de contacto en el pie de página.
  const contactLine = document.querySelector("[data-contact-line]");
  if (contactLine) {
    const parts = [];
    if (config.phoneDisplay) parts.push(config.phoneDisplay);
    if (config.salesEmail) parts.push('<a href="mailto:' + config.salesEmail + '">' + config.salesEmail + "</a>");
    contactLine.innerHTML = parts.join(" · ") || "Kioskos de autoservicio para negocios en México.";
  }
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // Navegación móvil.
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.getElementById("nav-menu");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  }
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Aparición al hacer scroll.
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Pestañas de industrias (patrón ARIA tabs con flechas de teclado).
  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    function select(tab) {
      tabs.forEach((t) => {
        const active = t === tab;
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !active;
      });
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!delta) return;
        const next = tabs[(i + delta + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  });
})();
