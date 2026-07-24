// Central place for all backend calls.
// Base URL comes from VITE_API_URL (used in Docker); falls back to the dev proxy path.
const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

export const api = {
  // Payments
  getPayments: () => request("/api/payments"),
  createPayment: (p) => request("/api/payments", { method: "POST", body: JSON.stringify(p) }),
  updatePayment: (id, p) => request(`/api/payments/${id}`, { method: "PUT", body: JSON.stringify(p) }),
  deletePayment: (id) => request(`/api/payments/${id}`, { method: "DELETE" }),
  togglePayment: (id) => request(`/api/payments/${id}/toggle`, { method: "POST" }),
  resetPayments: () => request("/api/payments/reset", { method: "POST" }),

  // Salaries
  getSalaries: () => request("/api/salaries"),
  createSalary: (s) => request("/api/salaries", { method: "POST", body: JSON.stringify(s) }),
  updateSalary: (id, s) => request(`/api/salaries/${id}`, { method: "PUT", body: JSON.stringify(s) }),
  deleteSalary: (id) => request(`/api/salaries/${id}`, { method: "DELETE" }),
  receiveSalary: (id) => request(`/api/salaries/${id}/receive`, { method: "POST" }),

  // Settings
  getSetting: (key) => request(`/api/settings/${key}`),
  setSetting: (key, value) => request(`/api/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),

  // Transfers (money-movement checklist: send/receive)
  getTransfers: () => request("/api/transfers"),
  createTransfer: (t) => request("/api/transfers", { method: "POST", body: JSON.stringify(t) }),
  updateTransfer: (id, t) => request(`/api/transfers/${id}`, { method: "PUT", body: JSON.stringify(t) }),
  deleteTransfer: (id) => request(`/api/transfers/${id}`, { method: "DELETE" }),
  toggleTransfer: (id) => request(`/api/transfers/${id}/toggle`, { method: "POST" }),
  resetTransfers: () => request("/api/transfers/reset", { method: "POST" }),
  reorderTransfers: (ids) => request("/api/transfers/reorder", { method: "POST", body: JSON.stringify(ids) }),

  // Banks (enabled banks = source of truth for what counts)
  getBanks: () => request("/api/banks"),
  setBanks: (banks) => request("/api/banks", { method: "PUT", body: JSON.stringify(banks) }),

  // Categories (source of truth for payment categories)
  getCategories: () => request("/api/categories"),
  setCategories: (categories) =>
    request("/api/categories", { method: "PUT", body: JSON.stringify(categories) }),

  // Dashboard
  getDashboard: () => request("/api/dashboard"),

  // Backup / restore (full data export & import)
  getBackup: () => request("/api/backup"),
  restore: (data) => request("/api/backup/restore", { method: "POST", body: JSON.stringify(data) }),
};
