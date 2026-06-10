/* ============================================================
   ORBIT — Immobilienrechner
   ============================================================ */

const fmtEUR = new Intl.NumberFormat("de-DE", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0,
});
const fmtEUR2 = new Intl.NumberFormat("de-DE", {
  style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const fmtPct = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const fmtNum = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1, maximumFractionDigits: 1,
});

const $ = (id) => document.getElementById(id);
const num = (id) => parseFloat($(id)?.value) || 0;

/* --------- sanfte Zähl-Animation für Ergebniswerte --------- */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const animState = new Map();

function setVal(id, value, formatter, suffix = "") {
  const el = $(id);
  if (!el) return;
  if (prefersReduced) {
    el.textContent = formatter(value) + suffix;
    animState.set(id, value);
    return;
  }
  const from = animState.get(id) ?? value;
  animState.set(id, value);
  if (from === value) { el.textContent = formatter(value) + suffix; return; }

  const start = performance.now();
  const dur = 350;
  function frame(now) {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = formatter(from + (value - from) * eased) + suffix;
    if (t < 1 && animState.get(id) === value) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ============================================================
   Tabs
   ============================================================ */
const tabs = document.querySelectorAll(".tab");
if (tabs.length) {
  function activate(name) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.calc === name));
    document.querySelectorAll(".calc").forEach((c) =>
      c.classList.toggle("active", c.id === "calc-" + name)
    );
    history.replaceState(null, "", "#" + name);
  }
  tabs.forEach((t) => t.addEventListener("click", () => activate(t.dataset.calc)));
  const hash = location.hash.replace("#", "");
  if (["nebenkosten", "rendite", "finanzierung"].includes(hash)) activate(hash);
}

/* ============================================================
   01 — Kaufnebenkosten
   ============================================================ */
function calcNebenkosten() {
  if (!$("nk-preis")) return;
  const preis = num("nk-preis");
  const gestP = num("nk-land");
  const notarP = num("nk-notar");
  const maklerP = num("nk-makler");

  $("nk-notar-val").textContent = fmtNum.format(notarP) + " %";
  $("nk-makler-val").textContent = fmtPct.format(maklerP) + " %";

  const gest = (preis * gestP) / 100;
  const ng = (preis * notarP) / 100;
  const mk = (preis * maklerP) / 100;
  const summe = gest + ng + mk;

  setVal("nk-gest", gest, (v) => fmtEUR.format(v));
  setVal("nk-ng", ng, (v) => fmtEUR.format(v));
  setVal("nk-mk", mk, (v) => fmtEUR.format(v));
  setVal("nk-summe", summe, (v) => fmtEUR.format(v));
  setVal("nk-quote", preis ? (summe / preis) * 100 : 0, (v) => fmtPct.format(v), " %");
  setVal("nk-total", preis + summe, (v) => fmtEUR.format(v));
}

/* ============================================================
   02 — Mietrendite & Cashflow
   ============================================================ */
function calcRendite() {
  if (!$("re-preis")) return;
  const preis = num("re-preis");
  const nkP = num("re-nk");
  const miete = num("re-miete");
  const hausgeld = num("re-hausgeld");
  const ruecklage = num("re-ruecklage");
  const rate = num("re-rate");

  $("re-nk-val").textContent = fmtNum.format(nkP) + " %";

  const invest = preis * (1 + nkP / 100);
  const jkm = miete * 12;
  const jahresNetto = jkm - (hausgeld + ruecklage) * 12;
  const cf = miete - hausgeld - ruecklage - rate;

  setVal("re-jkm", jkm, (v) => fmtEUR.format(v));
  setVal("re-faktor", jkm > 0 ? preis / jkm : 0, (v) => fmtNum.format(v));
  setVal("re-brutto", preis ? (jkm / preis) * 100 : 0, (v) => fmtPct.format(v), " %");
  setVal("re-netto", invest ? (jahresNetto / invest) * 100 : 0, (v) => fmtPct.format(v), " %");

  const cfEl = $("re-cf");
  setVal("re-cf", cf, (v) => (v > 0 ? "+" : "") + fmtEUR.format(v));
  cfEl.classList.toggle("neg", cf < 0);
  cfEl.classList.toggle("pos", cf > 0);
}

/* ============================================================
   03 — Finanzierung (Annuitätendarlehen)
   ============================================================ */
function calcFinanzierung() {
  if (!$("fi-darlehen")) return;
  const darlehen = num("fi-darlehen");
  const zinsP = num("fi-zins");
  const tilgungP = num("fi-tilgung");
  const bindung = num("fi-bindung");

  $("fi-zins-val").textContent = fmtPct.format(zinsP) + " %";
  $("fi-tilgung-val").textContent = fmtNum.format(tilgungP) + " %";
  $("fi-bindung-val").textContent = bindung + " J.";

  const annuitaet = (darlehen * (zinsP + tilgungP)) / 100;
  const rate = annuitaet / 12;
  const zinsM = zinsP / 100 / 12;

  // Monatliche Simulation
  let rest = darlehen;
  let zinskosten = 0;
  let monate = 0;
  let restNachBindung = darlehen;
  const maxMonate = 12 * 80;

  while (rest > 0 && monate < maxMonate && rate > rest * zinsM) {
    const zins = rest * zinsM;
    const tilgung = Math.min(rate - zins, rest);
    rest -= tilgung;
    monate++;
    if (monate <= bindung * 12) {
      zinskosten += zins;
      restNachBindung = rest;
    }
  }

  const tilgtBindung = darlehen - restNachBindung;
  const jahre = Math.floor(monate / 12);
  const restMonate = monate % 12;
  const abbezahlt = rest <= 0 && monate < maxMonate;

  setVal("fi-rate", rate, (v) => fmtEUR2.format(v));
  setVal("fi-rest", restNachBindung, (v) => fmtEUR.format(v));
  setVal("fi-getilgt", tilgtBindung, (v) => fmtEUR.format(v));
  setVal("fi-zinskosten", zinskosten, (v) => fmtEUR.format(v));
  $("fi-laufzeit").textContent =
    rate <= darlehen * zinsM && darlehen > 0
      ? "Rate deckt Zins nicht"
      : abbezahlt
        ? `${jahre} J. ${restMonate} M.`
        : "> 80 Jahre";
}

/* ============================================================
   Events & Init
   ============================================================ */
document.querySelectorAll("input, select").forEach((el) => {
  el.addEventListener("input", () => {
    calcNebenkosten();
    calcRendite();
    calcFinanzierung();
  });
});
calcNebenkosten();
calcRendite();
calcFinanzierung();

/* Scroll-Reveal */
const reveals = document.querySelectorAll(".reveal");
if (reveals.length && "IntersectionObserver" in window && !prefersReduced) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  reveals.forEach((r) => io.observe(r));
} else {
  reveals.forEach((r) => r.classList.add("in"));
}
