/* Calculadora de retorno: beneficio mensual = utilidad de la venta adicional + valor de horas liberadas. */
(function () {
  "use strict";

  const root = document.querySelector("[data-roi]");
  if (!root) return;

  const DAYS_PER_MONTH = 30;
  const fmt = (n) => window.Site.formatMXN(n);
  const form = root.querySelector("form");
  const el = (sel) => root.querySelector(sel);

  /** Cálculo puro, reutilizable fuera de la interfaz. Porcentajes en 0–100. */
  function estimateKioskBenefit(input) {
    const kioskOrders = input.orders * DAYS_PER_MONTH * (input.share / 100);
    const extraRevenue = kioskOrders * input.ticket * (input.lift / 100);
    const extraProfit = extraRevenue * (input.margin / 100);
    const laborValue = input.hours * input.hourCost * DAYS_PER_MONTH;
    const monthlyBenefit = extraProfit + laborValue;
    const paybackMonths = input.investment > 0 && monthlyBenefit > 0 ? input.investment / monthlyBenefit : null;
    return { extraRevenue, extraProfit, laborValue, monthlyBenefit, paybackMonths };
  }

  const num = (name) => {
    const v = parseFloat(form.elements[name].value);
    return Number.isFinite(v) && v > 0 ? v : 0;
  };

  const formatters = {
    orders: (v) => v,
    ticket: (v) => fmt(v),
    share: (v) => v + " %",
    lift: (v) => v + " %",
    margin: (v) => v + " %",
    hours: (v) => v + " h",
  };

  function update() {
    form.querySelectorAll('input[type="range"]').forEach((input) => {
      const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty("--p", pct + "%");
      el('[data-out="' + input.name + '"]').textContent = formatters[input.name](Number(input.value));
    });

    const r = estimateKioskBenefit({
      orders: num("orders"), ticket: num("ticket"), share: num("share"), lift: num("lift"),
      margin: num("margin"), hours: num("hours"), hourCost: num("hourCost"), investment: num("investment"),
    });

    el("[data-roi-total]").textContent = fmt(r.monthlyBenefit);
    el("[data-roi-revenue]").textContent = fmt(r.extraRevenue);
    el("[data-roi-profit]").textContent = fmt(r.extraProfit);
    el("[data-roi-labor]").textContent = fmt(r.laborValue);

    const payback = el("[data-roi-payback]");
    if (r.paybackMonths === null) {
      payback.textContent = "Agrega la inversión para calcular en cuántos meses la recuperas.";
    } else {
      const months = r.paybackMonths < 1 ? "menos de 1 mes" : "aprox. " + r.paybackMonths.toFixed(1) + " meses";
      payback.innerHTML = "Recuperas la inversión en <strong>" + months + "</strong>.";
    }
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  update();
})();
