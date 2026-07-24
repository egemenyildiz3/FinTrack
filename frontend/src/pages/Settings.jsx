import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import ChipEditor from "../components/ChipEditor.jsx";

export default function Settings() {
  const [banks, setBanks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [usedAccounts, setUsedAccounts] = useState([]);
  const [usedCategories, setUsedCategories] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const fileInput = useRef(null);

  async function load() {
    try {
      const [b, c, payments] = await Promise.all([
        api.getBanks(),
        api.getCategories(),
        api.getPayments(),
      ]);
      setBanks(b);
      setCategories(c);
      setUsedAccounts([...new Set(payments.map((p) => p.account).filter(Boolean))]);
      setUsedCategories([...new Set(payments.map((p) => p.category).filter(Boolean))]);
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

  async function persistBanks(next) {
    setBanks(next); // optimistic
    try {
      setBanks(await api.setBanks(next));
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  async function persistCategories(next) {
    setCategories(next); // optimistic
    try {
      setCategories(await api.setCategories(next));
    } catch (e) {
      setError(e.message);
      load();
    }
  }

  async function downloadBackup() {
    try {
      const data = await api.getBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fintrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice("Backup downloaded.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function restoreFromFile(file) {
    setError("");
    setNotice("");
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      setError("That file isn't valid JSON.");
      return;
    }
    if (
      !window.confirm(
        "Restore will REPLACE all current data with this backup. This can't be undone. Continue?"
      )
    ) {
      return;
    }
    try {
      await api.restore(data);
      // Reload the whole app so every page reflects the restored data.
      window.location.reload();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="page-head">
        <h1>Settings</h1>
      </div>
      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <section className="card">
        <h2>Enabled Banks</h2>
        <p className="muted small">
          Only these accounts are counted. Remove one to instantly drop its payments
          from all totals.
        </p>
        <ChipEditor
          items={banks}
          onChange={persistBanks}
          placeholder="Add a bank"
          suggestions={usedAccounts}
          emptyText="No banks enabled — nothing is being counted."
        />
      </section>

      <section className="card">
        <h2>Payment Categories</h2>
        <p className="muted small">
          Categories used to group spending. Deleting one moves its payments to
          "Other". "Other" can't be removed.
        </p>
        <ChipEditor
          items={categories}
          onChange={persistCategories}
          placeholder="Add a category (e.g. Travel)"
          protectedItems={["Other"]}
          suggestions={usedCategories}
          emptyText="No categories."
        />
      </section>

      <section className="card">
        <h2>Backup &amp; Restore</h2>
        <p className="muted small">
          Download all your data as a single JSON file, or restore from one. Your data
          lives only in the app's database, so keep a backup somewhere safe. Restoring
          replaces everything currently in the app.
        </p>
        <div className="backup-actions">
          <button className="btn" onClick={downloadBackup}>
            ↓ Download backup
          </button>
          <button className="btn ghost" onClick={() => fileInput.current?.click()}>
            ↑ Restore from file…
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) restoreFromFile(f);
              e.target.value = ""; // allow re-selecting the same file
            }}
          />
        </div>
      </section>
    </div>
  );
}
