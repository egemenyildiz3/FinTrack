import { useEffect, useState } from "react";
import { api } from "../api.js";
import { monthName } from "../format.js";
import { CURRENCIES } from "../constants.js";
import DayInput from "../components/DayInput.jsx";
import { TrashIcon } from "../components/icons.jsx";

const NUMERIC_KEYS = new Set(["amount", "dayOfMonth", "month"]);

// Returns rows sorted by the given column, or the original order when no sort is active.
function sortRows(rows, sort) {
  if (!sort.key) return rows;
  const dir = sort.dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    if (NUMERIC_KEYS.has(sort.key)) {
      const av = a[sort.key] ?? Infinity;
      const bv = b[sort.key] ?? Infinity;
      return (av - bv) * dir;
    }
    const av = (a[sort.key] ?? "").toString().toLowerCase();
    const bv = (b[sort.key] ?? "").toString().toLowerCase();
    return av.localeCompare(bv) * dir;
  });
}

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [banks, setBanks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [p, b, c] = await Promise.all([
        api.getPayments(),
        api.getBanks(),
        api.getCategories(),
      ]);
      setPayments(p);
      setBanks(b);
      setCategories(c);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(row) {
    await api.updatePayment(row.id, row);
    load();
  }

  async function remove(id) {
    if (!window.confirm("Delete this payment?")) return;
    await api.deletePayment(id);
    load();
  }

  async function add(recurrence) {
    await api.createPayment({
      name: "New payment",
      account: "ING",
      amount: 0,
      currency: "EUR",
      recurrence,
      category: "Other",
      dayOfMonth: 1,
      month: recurrence === "Yearly" ? 1 : null,
      isDone: false,
      sortOrder: 999,
    });
    load();
  }

  if (loading) return <p className="muted">Loading…</p>;

  const monthly = payments.filter((p) => p.recurrence === "Monthly");
  const yearly = payments.filter((p) => p.recurrence === "Yearly");

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Payments</h1>
          <p className="muted">
            The single source of truth. Edit a value and hit Save — the checklist and
            dashboard update automatically.
          </p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <PaymentTable
        title="Monthly"
        rows={monthly}
        yearly={false}
        banks={banks}
        categories={categories}
        onSave={save}
        onDelete={remove}
        onAdd={() => add("Monthly")}
      />

      <PaymentTable
        title="Yearly"
        rows={yearly}
        yearly={true}
        banks={banks}
        categories={categories}
        onSave={save}
        onDelete={remove}
        onAdd={() => add("Yearly")}
      />

      <datalist id="accounts">
        {banks.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
    </div>
  );
}

function PaymentTable({ title, rows, yearly, banks, categories, onSave, onDelete, onAdd }) {
  const enabled = new Set(banks);
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  // Cycle a column through asc → desc → unsorted.
  function toggleSort(key) {
    setSort((s) => {
      if (s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "account", label: "Account" },
    { key: "amount", label: "Amount" },
    { key: "currency", label: "Cur." },
    { key: "category", label: "Category" },
    ...(yearly ? [{ key: "month", label: "Month" }] : []),
    { key: "dayOfMonth", label: "Day" },
  ];

  const sorted = sortRows(rows, sort);

  return (
    <section className="card">
      <div className="page-head tight">
        <h2>{title}</h2>
        <button className="btn" onClick={onAdd}>
          + Add {title.toLowerCase()}
        </button>
      </div>
      <div className="table-wrap">
        <table className="payments">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="sortable"
                  onClick={() => toggleSort(c.key)}
                  title={`Sort by ${c.label}`}
                >
                  {c.label}
                  <span className="sort-arrow">
                    {sort.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                  </span>
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <PaymentRow
                key={row.id}
                row={row}
                yearly={yearly}
                categories={categories}
                excluded={!row.account || !enabled.has(row.account)}
                onSave={onSave}
                onDelete={onDelete}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={yearly ? 8 : 7} className="muted center">
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PaymentRow({ row, yearly, categories, excluded, onSave, onDelete }) {
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);

  // Keep local draft in sync if the row changes after a reload.
  useEffect(() => setDraft(row), [row]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(row);

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className={`${dirty ? "dirty" : ""} ${excluded ? "excluded" : ""}`}>
      <td>
        <div className="name-cell">
          <input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          {excluded && (
            <span className="tag" title="Bank not enabled — excluded from all calculations">
              excluded
            </span>
          )}
        </div>
      </td>
      <td>
        <input
          list="accounts"
          className="w-sm"
          placeholder="none"
          value={draft.account ?? ""}
          onChange={(e) => set("account", e.target.value === "" ? null : e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          className="w-sm right"
          value={draft.amount}
          onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
        />
      </td>
      <td>
        <select value={draft.currency} onChange={(e) => set("currency", e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </td>
      <td>
        <select value={draft.category} onChange={(e) => set("category", e.target.value)}>
          {(categories.includes(draft.category)
            ? categories
            : [draft.category, ...categories]
          ).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </td>
      {yearly && (
        <td>
          <select
            value={draft.month || 1}
            onChange={(e) => set("month", parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {monthName(m)}
              </option>
            ))}
          </select>
        </td>
      )}
      <td>
        <DayInput
          className="w-xs right"
          value={draft.dayOfMonth}
          onChange={(v) => set("dayOfMonth", v)}
        />
      </td>
      <td className="row-actions">
        <button className="btn small" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? "…" : "Save"}
        </button>
        <button
          className="btn small danger icon-only"
          title="Delete"
          onClick={() => onDelete(row.id)}
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
}
