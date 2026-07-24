// Formatting helpers shared across pages.

const symbols = { EUR: "€", TL: "₺" };

export function formatMoney(amount, currency = "EUR") {
  const value = Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const symbol = symbols[currency] || "";
  return currency === "EUR" ? `${symbol}${value}` : `${value} ${currency}`;
}

// Render a { EUR: 100, TL: 50 } totals object as "€100 + 50 TL".
export function formatTotals(totals) {
  const entries = Object.entries(totals || {}).filter(([, v]) => v !== 0);
  if (entries.length === 0) return formatMoney(0, "EUR");
  return entries.map(([cur, val]) => formatMoney(val, cur)).join("  +  ");
}

export function ordinal(n) {
  if (!n) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function monthName(m) {
  return months[m] || "";
}

// "2026-07-24" -> "24 Jul". Accepts a Date or an ISO/yyyy-MM-dd string.
export function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${months[d.getMonth() + 1]}`;
}

export function todayLong() {
  const d = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const full = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  return `${days[d.getDay()]}, ${d.getDate()} ${full[d.getMonth()]} ${d.getFullYear()}`;
}
