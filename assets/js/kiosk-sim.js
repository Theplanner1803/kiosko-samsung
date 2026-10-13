/*
 * Simulador del kiosko en el hero: demuestra el flujo completo
 * (pantalla de espera → menú → sugerencia de combo → pago NFC/QR → ticket impreso)
 * y muestra al lado el impacto para el negocio.
 */
(function () {
  "use strict";

  const screen = document.querySelector("[data-kiosk-screen]");
  if (!screen) return;

  const fmt = (n) => window.Site.formatMXN(n);
  const ticketEl = document.querySelector("[data-ticket]");
  const nfcEl = document.querySelector('[data-part="nfc"]');
  const scannerEl = document.querySelector('[data-part="scanner"]');
  const out = {
    total: document.querySelector("[data-insight-total]"),
    upsell: document.querySelector("[data-insight-upsell]"),
    time: document.querySelector("[data-insight-time]"),
    note: document.querySelector("[data-insight-note]"),
  };

  // Menú de demostración (precios ficticios).
  const MENU = [
    { id: "burger", name: "Hamburguesa clásica", price: 129, emoji: "🍔", upsell: true },
    { id: "double", name: "Doble queso", price: 159, emoji: "🧀", upsell: true },
    { id: "wings", name: "Alitas", price: 119, emoji: "🍗" },
    { id: "salad", name: "Ensalada", price: 99, emoji: "🥗" },
    { id: "soda", name: "Refresco", price: 35, emoji: "🥤" },
    { id: "coffee", name: "Café frío", price: 59, emoji: "🧋" },
    { id: "fries", name: "Papas", price: 45, emoji: "🍟" },
    { id: "icecream", name: "Helado", price: 39, emoji: "🍦" },
  ];
  const COMBO_PRICE = 55;

  let state;
  let timers = [];

  function resetState() {
    state = { cart: {}, combos: 0, upsellOffered: false, startedAt: null, order: "" };
  }

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function subtotal() {
    const items = MENU.reduce((sum, item) => sum + (state.cart[item.id] || 0) * item.price, 0);
    return items + state.combos * COMBO_PRICE;
  }
  function itemCount() {
    return Object.values(state.cart).reduce((a, b) => a + b, 0);
  }

  function bump(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove("bump");
    void el.offsetWidth; // reinicia la animación
    el.classList.add("bump");
  }
  function updateInsight(note) {
    bump(out.total, fmt(subtotal()));
    bump(out.upsell, fmt(state.combos * COMBO_PRICE));
    if (note) out.note.textContent = note;
  }

  function setActivePart(part) {
    nfcEl.classList.toggle("is-active", part === "nfc");
    scannerEl.classList.toggle("is-active", part === "scanner");
  }

  /** Reemplaza el contenido de la pantalla, conservando el foco dentro del kiosko si ya estaba ahí. */
  function render(html) {
    const hadFocus = screen.contains(document.activeElement);
    screen.innerHTML = '<div class="sim">' + html + "</div>";
    if (hadFocus) {
      const target = screen.querySelector("[data-autofocus]") || screen.querySelector("button");
      if (target) target.focus({ preventScroll: true });
    }
  }

  function showAttract() {
    clearTimers();
    resetState();
    setActivePart(null);
    ticketEl.classList.remove("is-printing");
    ticketEl.innerHTML = "";
    out.time.textContent = "—";
    updateInsight("Haz un pedido de prueba en el kiosko.");
    render(
      '<button class="sim__attract" data-action="start" data-autofocus>' +
        '<span class="sim__brand">Kioskia Burger</span>' +
        '<span class="sim__hero" aria-hidden="true">🍔</span>' +
        "<span>Ordena aquí, sin filas</span>" +
        '<span class="sim__tap">Toca para ordenar</span>' +
      "</button>"
    );
  }

  function menuHtml() {
    const items = MENU.map((item) =>
      '<button class="sim__item" data-action="add" data-id="' + item.id + '" data-count="' + (state.cart[item.id] || 0) + '"' +
        ' aria-label="Agregar ' + item.name + ", " + fmt(item.price) + '">' +
        '<span class="emoji" aria-hidden="true">' + item.emoji + "</span>" +
        '<span class="name">' + item.name + "</span>" +
        '<span class="price">' + fmt(item.price) + "</span>" +
      "</button>"
    ).join("");
    const count = itemCount() + state.combos * 2;
    return (
      '<div class="sim__bar"><span>Menú</span><small>Para llevar</small></div>' +
      '<div class="sim__body"><div class="sim__grid">' + items + "</div></div>" +
      '<div class="sim__foot">' +
        '<div class="total">' + fmt(subtotal()) + "<small>" + count + " producto" + (count === 1 ? "" : "s") + "</small></div>" +
        '<button class="sim__cta" data-action="checkout"' + (itemCount() ? "" : " disabled") + ">Pagar</button>" +
      "</div>"
    );
  }

  function showMenu() {
    // Conserva el scroll del menú entre re-renderizados.
    const body = screen.querySelector(".sim__body");
    const scroll = body ? body.scrollTop : 0;
    render(menuHtml());
    const newBody = screen.querySelector(".sim__body");
    if (newBody) newBody.scrollTop = scroll;
  }

  function showUpsell() {
    state.upsellOffered = true;
    showMenu();
    const modal = document.createElement("div");
    modal.className = "sim__modal";
    modal.innerHTML =
      '<div class="sim__sheet" role="dialog" aria-label="Sugerencia de combo">' +
        '<span class="emoji" aria-hidden="true">🍟🥤</span>' +
        "<h4>¿Lo hacemos combo?</h4>" +
        "<p>Agrega papas y refresco por solo " + fmt(COMBO_PRICE) + " más.</p>" +
        '<div class="row"><button class="sim__ghost" data-action="decline">No, gracias</button>' +
        '<button class="sim__cta" data-action="accept" data-autofocus>Sí, agregar</button></div>' +
      "</div>";
    screen.firstElementChild.appendChild(modal);
    const accept = modal.querySelector("[data-autofocus]");
    if (screen.contains(document.activeElement) || document.activeElement === document.body) accept.focus({ preventScroll: true });
    updateInsight("El kiosko ofrece el combo en cada pedido, sin que nadie tenga que acordarse.");
  }

  function showPayment() {
    render(
      '<div class="sim__bar"><span>Pago</span><small>' + fmt(subtotal()) + "</small></div>" +
      '<div class="sim__pay">' +
        "<h4>¿Cómo quieres pagar?</h4>" +
        '<button class="sim__method" data-action="pay" data-method="nfc" data-autofocus><span class="emoji" aria-hidden="true">💳</span><span><strong>Tarjeta o celular</strong><small>Sin contacto (NFC) o chip</small></span></button>' +
        '<button class="sim__method" data-action="pay" data-method="qr"><span class="emoji" aria-hidden="true">📱</span><span><strong>Código QR</strong><small>Escanea desde tu app</small></span></button>' +
        '<button class="sim__ghost" data-action="back">Volver al menú</button>' +
      "</div>"
    );
    updateInsight("Tarjeta, NFC o QR directamente en el kiosko. Tu cajero no interviene.");
  }

  function showProcessing(method) {
    const nfc = method === "nfc";
    setActivePart(nfc ? "nfc" : "scanner");
    render(
      '<div class="sim__status">' +
        '<div class="sim__spinner" aria-hidden="true"></div>' +
        "<h4>" + (nfc ? "Acerca tu tarjeta o celular" : "Muestra tu QR al escáner") + "</h4>" +
        "<p>" + (nfc ? "Al lector, debajo de la pantalla" : "El lector está debajo de la pantalla") + "</p>" +
      "</div>"
    );
    later(showDone, 2200);
  }

  function showDone() {
    setActivePart(null);
    state.order = "A-" + String(Math.floor(100 + Math.random() * 900));
    const seconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));
    out.time.textContent = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0") + " min";
    render(
      '<div class="sim__status">' +
        '<div class="sim__check" aria-hidden="true">✓</div>' +
        "<h4>¡Pago aprobado!</h4>" +
        "<p>Tu número de orden</p>" +
        '<div class="sim__order">' + state.order + "</div>" +
        "<p>Toma tu ticket ↓</p>" +
        '<button class="sim__ghost" data-action="restart" data-autofocus>Nueva orden</button>' +
      "</div>"
    );
    printTicket();
    updateInsight(
      state.combos
        ? "Este pedido subió " + fmt(state.combos * COMBO_PRICE) + " gracias a la sugerencia. Multiplícalo por cada pedido del día."
        : "Pedido cobrado sin cajero. Prueba de nuevo y acepta el combo para ver cómo sube el ticket."
    );
    later(showAttract, 12000);
  }

  function printTicket() {
    const lines = MENU.filter((i) => state.cart[i.id])
      .map((i) => state.cart[i.id] + "× " + i.name + "<br>")
      .join("");
    const combo = state.combos ? state.combos + "× Combo<br>" : "";
    ticketEl.innerHTML =
      "<strong>" + state.order + "</strong>" + "-------------------<br>" + lines + combo +
      "-------------------<br>TOTAL " + fmt(subtotal()) + "<br>¡Gracias!";
    ticketEl.classList.remove("is-printing");
    void ticketEl.offsetWidth;
    ticketEl.classList.add("is-printing");
  }

  screen.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    const action = btn.getAttribute("data-action");

    if (action === "start") {
      state.startedAt = Date.now();
      showMenu();
      updateInsight("Elige productos. Prueba con una hamburguesa.");
    } else if (action === "add") {
      const item = MENU.find((i) => i.id === btn.getAttribute("data-id"));
      state.cart[item.id] = (state.cart[item.id] || 0) + 1;
      if (item.upsell && !state.upsellOffered) showUpsell();
      else { showMenu(); updateInsight(); }
    } else if (action === "accept") {
      state.combos += 1;
      showMenu();
      updateInsight("+" + fmt(COMBO_PRICE) + " en este ticket por una sola sugerencia.");
    } else if (action === "decline") {
      showMenu();
      updateInsight("Aunque no todos aceptan, el kiosko ofrece el combo en el 100 % de los pedidos.");
    } else if (action === "checkout") {
      showPayment();
    } else if (action === "back") {
      showMenu();
    } else if (action === "pay") {
      showProcessing(btn.getAttribute("data-method"));
    } else if (action === "restart") {
      showAttract();
    }
  });

  showAttract();
})();
