import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatMoney, formatTotals } from "../format.js";
import { CURRENCIES } from "../constants.js";
import DayInput from "../components/DayInput.jsx";
import { TrashIcon } from "../components/icons.jsx";

export default function Money() {
  const [salaries, setSalaries] = useState([]);
  const [balance, setBalance] = useState("");
  const [savedBalance, setSavedBalance] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [s, b] = await Promise.all([
        api.getSalaries(),
        api.getSetting("TotalOwnedMoney"),
      ]);
      setSalaries(s);
      setBalance(b.value);
      setSavedBalance(b.value);
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

  async function saveBalance() {
    await api.setSetting("TotalOwnedMoney", balance);
    setSavedBalance(balance);
  }

  async function addSalary() {
    await api.createSalary({ name: "Extra income", amount: 0, currency: "EUR" });
    load();
  }

  async function saveSalary(s) {
    await api.updateSalary(s.id, s);
    load();
  }

  async function deleteSalary(id) {
    if (!window.confirm("Delete this income source?")) return;
    await api.deleteSalary(id);
    load();
  }

  async function receive(s) {
    const ok = window.confirm(
      `Add ${formatMoney(s.amount, s.currency)} from "${s.name}" to your balance?`
    );
    if (!ok) return;
    try {
      await api.receiveSalary(s.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  const incomeTotals = {};
  for (const s of salaries)
    incomeTotals[s.currency] = (incomeTotals[s.currency] || 0) + s.amount;

  return (
    <div>
      <div className="page-head">
        <h1>Money</h1>
      </div>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Total Balance</h2>
        <p className="muted small">
          Manually adjust the money you currently own across everything. Receiving an
          income below adds its amount here.
        </p>
        <div className="balance-editor">
          <input
            type="number"
            step="0.01"
            className="balance-input"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
          <span className="cur">EUR</span>
          <button className="btn" disabled={balance === savedBalance} onClick={saveBalance}>
            Save
          </button>
        </div>
        <div className="balance-display">{formatMoney(savedBalance, "EUR")}</div>
      </section>

      <section className="card">
        <div className="page-head tight">
          <h2>Income Sources</h2>
          <button className="btn" onClick={addSalary}>
            + Add income
          </button>
        </div>
        <div className="table-wrap">
          <table className="payments">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Cur.</th>
                <th>Schedule</th>
                <th>Day</th>
                <th>Auto</th>
                <th>Receive</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((s) => (
                <SalaryRow
                  key={s.id}
                  salary={s}
                  onSave={saveSalary}
                  onDelete={deleteSalary}
                  onReceive={receive}
                />
              ))}
              {salaries.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted center">
                    No income sources yet.
                  </td>
                </tr>
              )}
            </tbody>
            {salaries.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td>Total income</td>
                  <td className="right">{formatTotals(incomeTotals)}</td>
                  <td colSpan={6}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}

function SalaryRow({ salary, onSave, onDelete, onReceive }) {
  const [draft, setDraft] = useState(salary);
  useEffect(() => setDraft(salary), [salary]);

  // Only compare the editable fields (the API also returns computed fields).
  const editable = (x) => ({
    name: x.name,
    amount: x.amount,
    currency: x.currency,
    scheduleType: x.scheduleType,
    scheduleDay: x.scheduleDay,
    autoReceive: x.autoReceive,
  });
  const dirty = JSON.stringify(editable(draft)) !== JSON.stringify(editable(salary));

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  return (
    <tr className={dirty ? "dirty" : ""}>
      <td>
        <input value={draft.name} onChange={(e) => set("name", e.target.value)} />
      </td>
      <td>
        <input
          type="number"
          step="0.01"
          className="right"
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
        <select
          value={draft.scheduleType}
          onChange={(e) => set("scheduleType", e.target.value)}
        >
          <option value="Manual">Manual</option>
          <option value="MonthlyDay">Monthly day</option>
          <option value="JetSalary">JET Salary</option>
        </select>
      </td>
      <td>
        {draft.scheduleType === "MonthlyDay" ? (
          <DayInput
            className="w-xs right"
            value={draft.scheduleDay}
            onChange={(v) => set("scheduleDay", v)}
          />
        ) : (
          <span className="muted small">
            {draft.scheduleType === "JetSalary" ? "24th*" : "—"}
          </span>
        )}
      </td>
      <td className="center">
        <input
          type="checkbox"
          checked={draft.autoReceive}
          disabled={draft.scheduleType === "Manual"}
          onChange={(e) => set("autoReceive", e.target.checked)}
        />
      </td>
      <td className="center">
        {salary.receivedThisMonth ? (
          <span className="received-tag">✓ received</span>
        ) : (
          <button className="btn small success" onClick={() => onReceive(salary)}>
            Receive
          </button>
        )}
      </td>
      <td className="row-actions">
        <button className="btn small" disabled={!dirty} onClick={() => onSave(draft)}>
          Save
        </button>
        <button
          className="btn small danger icon-only"
          title="Delete"
          onClick={() => onDelete(salary.id)}
        >
          <TrashIcon />
        </button>
      </td>
    </tr>
  );
}
