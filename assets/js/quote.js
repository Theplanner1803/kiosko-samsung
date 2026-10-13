/*
 * Configurador y solicitud de cotización.
 * Envío: abre WhatsApp (o correo) con la solicitud armada y, si hay quoteEndpoint,
 * además la registra por POST para que ninguna solicitud se pierda.
 */
(function () {
  "use strict";

  const form = document.querySelector("[data-quote]");
  if (!form) return;

  const { config, whatsappUrl, mailtoUrl } = window.Site;
  const summaryEl = form.querySelector("[data-quote-summary]");
  const statusEl = form.querySelector("[data-quote-status]");
  const submitBtn = form.querySelector("[data-quote-submit]");
  const qtyInput = form.elements.qty;
  const MAX_QTY = 200;
  let submitting = false;

  const clean = (v) => String(v || "").trim().replace(/\s+/g, " ");

  function clampQty(v) {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(1, n)) : 1;
  }

  /** Lee la configuración elegida como objeto plano. */
  function readSelection() {
    return {
      qty: clampQty(qtyInput.value),
      mount: form.elements.mount.value,
      payment: form.elements.payment.value,
      software: form.elements.software.value,
      extras: Array.from(form.querySelectorAll('input[name="extras"]:checked')).map((i) => i.value),
    };
  }

  function readContact() {
    return {
      name: clean(form.elements.name.value),
      company: clean(form.elements.company.value),
      phone: clean(form.elements.phone.value),
      city: clean(form.elements.city.value),
      email: clean(form.elements.email.value).toLowerCase(),
      privacy: form.elements.privacy.checked,
    };
  }

  function selectionLines(s) {
    const lines = [
      s.qty + " kiosko" + (s.qty > 1 ? "s" : "") + " Samsung KMC-P de 24\"",
      "Instalación: " + s.mount,
      "Cobro: " + s.payment,
      "Software: " + s.software,
    ];
    if (s.extras.length) lines.push("Extras: " + s.extras.join(", "));
    return lines;
  }

  /** Validación en el límite de la aplicación; devuelve errores por campo. */
  function validateContact(c) {
    const errors = {};
    if (c.name.length < 2) errors.name = "Escribe tu nombre.";
    const digits = c.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) errors.phone = "Escribe un teléfono de 10 dígitos.";
    if (c.city.length < 2) errors.city = "Escribe tu ciudad.";
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) errors.email = "Revisa el formato del correo.";
    if (!c.privacy) errors.privacy = "Necesitamos tu aceptación para contactarte.";
    return errors;
  }

  function showErrors(errors) {
    ["name", "phone", "city", "email", "privacy"].forEach((field) => {
      const input = form.elements[field];
      const msg = document.getElementById("q-" + field + "-err");
      input.setAttribute("aria-invalid", errors[field] ? "true" : "false");
      msg.textContent = errors[field] || "";
    });
    const first = Object.keys(errors)[0];
    if (first) form.elements[first].focus();
  }

  function buildMessage(s, c) {
    return [
      "Hola, quiero cotizar kioskos Samsung.",
      "",
      ...selectionLines(s).map((l) => "• " + l),
      "",
      "Nombre: " + c.name,
      c.company ? "Negocio: " + c.company : null,
      "Teléfono: " + c.phone,
      "Ciudad: " + c.city,
      c.email ? "Correo: " + c.email : null,
    ].filter((l) => l !== null).join("\n");
  }

  function renderSummary() {
    summaryEl.innerHTML = "";
    selectionLines(readSelection()).forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      summaryEl.appendChild(li);
    });
  }

  function setStatus(kind, html) {
    statusEl.className = "form-status" + (kind ? " is-" + kind : "");
    statusEl.innerHTML = html;
  }

  async function registerLead(payload) {
    if (!config.quoteEndpoint) return true;
    try {
      const res = await fetch(config.quoteEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  form.addEventListener("click", (e) => {
    const step = e.target.closest("[data-step]");
    if (!step) return;
    qtyInput.value = clampQty(Number(qtyInput.value) + Number(step.getAttribute("data-step")));
    renderSummary();
  });
  qtyInput.addEventListener("change", () => { qtyInput.value = clampQty(qtyInput.value); renderSummary(); });
  form.addEventListener("change", renderSummary);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return;

    const selection = readSelection();
    const contact = readContact();
    const errors = validateContact(contact);
    showErrors(errors);
    if (Object.keys(errors).length) {
      setStatus("", "");
      return;
    }

    const message = buildMessage(selection, contact);
    const channelUrl = whatsappUrl(message) || mailtoUrl("Solicitud de cotización: kioskos Samsung", message);
    if (!channelUrl && !config.quoteEndpoint) {
      setStatus("error", "Por el momento no pudimos enviar tu solicitud. Intenta de nuevo más tarde.");
      return;
    }

    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";

    // Se abre antes de cualquier espera para que el navegador no lo bloquee como ventana emergente.
    if (channelUrl && channelUrl.startsWith("mailto:")) window.location.href = channelUrl;
    else if (channelUrl) window.open(channelUrl, "_blank", "noopener");

    const { privacy, ...contactData } = contact;
    const saved = await registerLead({ ...contactData, ...selection, extras: selection.extras.join(", "), message, source: location.href });

    submitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar solicitud";

    if (channelUrl) {
      const label = channelUrl.startsWith("mailto:") ? "abrir el correo" : "abrir WhatsApp";
      setStatus("ok", "¡Listo! Abrimos tu solicitud para que la envíes. Si no se abrió, toca aquí para <a href=\"" + channelUrl + "\" target=\"_blank\" rel=\"noopener\">" + label + "</a>.");
    } else if (saved) {
      setStatus("ok", "¡Recibimos tu solicitud! Te contactaremos pronto con tu cotización.");
      form.reset();
      renderSummary();
    } else {
      setStatus("error", "No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo; tus datos siguen en el formulario.");
    }
  });

  renderSummary();
})();
