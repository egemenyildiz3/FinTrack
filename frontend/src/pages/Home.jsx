import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatTotals, formatMoney, ordinal, formatDate, todayLong } from "../format.js";

export default function Home() {
  const [payments, setPayments] = useState([]);
  const [banks, setBanks] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [p, d, b, s, t] = await Promise.all([
        api.getPayments(),
        api.getDashboard(),
        api.getBanks(),
        api.getSalaries(),
        api.getTransfers(),
      ]);
      setPayments(p);
      setDash(d);
      setBanks(b);
      setSalaries(s);
      setTransfers(t);
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

  async function togglePayment(id) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isDone: !p.isDone } : p))
    );
    try {
      await api.togglePayment(id);
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  async function toggleTransfer(id) {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
    try {
      await api.toggleTransfer(id);
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  async function reset() {
    if (!window.confirm("Reset the cycle (uncheck all payments and checklist items)?")) return;
    await Promise.all([api.resetPayments(), api.resetTransfers()]);
    load();
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  // Only monthly items on an enabled bank are shown in the per-account reference.
  const enabled = new Set(banks);
  const monthly = payments.filter(
    (p) => p.recurrence === "Monthly" && p.account && enabled.has(p.account)
  );

  const accounts = {};
  for (const b of banks) accounts[b] = [];
  for (const p of monthly) (accounts[p.account] ||= []).push(p);
  for (const key of Object.keys(accounts)) {
    if (accounts[key].length === 0) delete accounts[key];
  }

  // Remaining (not-done) total per account, so it drops as items are checked off.
  function remainingTotal(items) {
    const totals = {};
    for (const p of items) {
      if (!p.isDone) totals[p.currency] = (totals[p.currency] || 0) + p.amount;
    }
    return totals;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Home</h1>
          <p className="muted">
            <span className="today">{todayLong()}</span>
          </p>
        </div>
        <button className="btn danger" onClick={reset}>
          Reset cycle
        </button>
      </div>

      {dash && (
        <div className="summary-strip">
          <IncomeItem salaries={salaries} />
          <SummaryItem label="Monthly spending" totals={dash.monthlySpendingTotals} />
          <div className="summary-item stat-card">
            <div className="stacked-stat">
              <span className="summary-label">Total balance</span>
              <span className="summary-big accent">
                {formatMoney(dash.totalOwnedMoney, "EUR")}
              </span>
            </div>
            <div className="stacked-divider" />
            <div className="stacked-stat">
              <span className="summary-label">Savings per month</span>
              <span className="summary-big pos">{formatTotals(dash.savings)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid">
        {transfers.length > 0 && (
          <section className="card account">
            <div className="account-head">
              <h2>Checklist</h2>
            </div>
            <ul className="checklist">
              {transfers.map((t) => (
                <li
                  key={t.id}
                  className={t.isDone ? "checked" : ""}
                  onClick={() => toggleTransfer(t.id)}
                >
                  <input type="checkbox" checked={t.isDone} readOnly tabIndex={-1} />
                  <span className="item-name">{t.name}</span>
                  {t.day ? (
                    <span className="item-day">{ordinal(t.day)}</span>
                  ) : (
                    <span className="item-day muted">—</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {Object.entries(accounts).map(([account, items]) => {
          const allDone = items.every((p) => p.isDone);
          return (
            <section key={account} className={`card account ${allDone ? "done" : ""}`}>
              <div className="account-head">
                <h2>{account}</h2>
                <span className="account-total">{formatTotals(remainingTotal(items))}</span>
              </div>
              <ul className="checklist">
                {items.map((p) => (
                  <li
                    key={p.id}
                    className={p.isDone ? "checked" : ""}
                    onClick={() => togglePayment(p.id)}
                  >
                    <input type="checkbox" checked={p.isDone} readOnly tabIndex={-1} />
                    <span className="item-name">{p.name}</span>
                    {p.dayOfMonth ? (
                      <span className="item-day">{ordinal(p.dayOfMonth)}</span>
                    ) : (
                      <span className="item-day muted">—</span>
                    )}
                    <span className="item-amount">{formatMoney(p.amount, p.currency)}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {dash && (
        <>
          <div className="grid two breakdowns">
            <section className="card">
              <h2>Spending by Category</h2>
              <p className="muted small">Monthly only — yearly payments are excluded.</p>
              <BreakdownTable groups={dash.categories} />
            </section>
            <section className="card">
              <h2>Monthly Split per Account</h2>
              <p className="muted small">Where each month's money goes.</p>
              <BreakdownTable groups={dash.accounts} />
            </section>
          </div>

          <section className="card yearly-card">
            <div className="account-head plain">
              <div>
                <h2>Yearly Payments</h2>
                <p className="muted small">Tracked separately, never counted in monthly spending.</p>
              </div>
              <span className="yearly-total">{formatTotals(dash.yearlyTotals)}</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function IncomeItem({ salaries }) {
  const totals = {};
  for (const s of salaries) totals[s.currency] = (totals[s.currency] || 0) + s.amount;

  return (
    <div className="summary-item income">
      <span className="summary-label">Monthly income</span>
      <ul className="income-list">
        {salaries.map((s) => (
          <li key={s.id} className="income-row">
            <div className="income-main">
              <span className="income-name">{s.name}</span>
              <span className="income-amount">{formatMoney(s.amount, s.currency)}</span>
            </div>
            <div className="income-meta">
              <span className="income-schedule muted small">{scheduleLabel(s)}</span>
              {s.receivedThisMonth && <span className="received-tag">✓ received</span>}
            </div>
          </li>
        ))}
        {salaries.length === 0 && <li className="muted small">No income sources.</li>}
      </ul>
      <div className="income-total">
        <span>Total</span>
        <span className="income-total-value">{formatTotals(totals)}</span>
      </div>
    </div>
  );
}

function scheduleLabel(s) {
  if (s.scheduleType === "Manual") return "manual";
  const when = s.effectiveReceiveDate ? formatDate(s.effectiveReceiveDate) : "";
  const prefix = s.autoReceive ? "auto" : "due";
  return `${prefix}${when ? " · " + when : ""}`;
}

function SummaryItem({ label, totals, positive }) {
  return (
    <div className="summary-item stat-card">
      <div className="stacked-stat">
        <span className="summary-label">{label}</span>
        <span className={`summary-big ${positive ? "pos" : "neg"}`}>
          {formatTotals(totals)}
        </span>
      </div>
    </div>
  );
}

function BreakdownTable({ groups }) {
  if (!groups || groups.length === 0) return <p className="muted">No data.</p>;
  return (
    <table className="breakdown">
      <tbody>
        {groups.map((g) => (
          <tr key={g.label}>
            <td className="b-label">{g.label}</td>
            <td className="b-value">{formatTotals(g.totals)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
