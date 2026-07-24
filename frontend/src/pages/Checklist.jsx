import { useEffect, useState } from "react";
import { api } from "../api.js";
import DayInput from "../components/DayInput.jsx";
import { TrashIcon } from "../components/icons.jsx";

export default function Checklist() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  async function load() {
    try {
      setTransfers(await api.getTransfers());
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

  async function toggle(id) {
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

  async function save(t) {
    await api.updateTransfer(t.id, t);
    load();
  }

  async function remove(id) {
    if (!window.confirm("Delete this checklist item?")) return;
    await api.deleteTransfer(id);
    load();
  }

  async function add() {
    await api.createTransfer({
      name: "New item",
      amount: 0,
      currency: "EUR",
      direction: "Out",
      day: 1,
      isDone: false,
      sortOrder: transfers.length,
    });
    load();
  }

  async function reset() {
    if (!window.confirm("Uncheck all items for a new cycle?")) return;
    await api.resetTransfers();
    load();
  }

  function handleDrop(targetIndex) {
    setOverIndex(null);
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...transfers];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    setTransfers(next); // optimistic
    api
      .reorderTransfers(next.map((t) => t.id))
      .then(load)
      .catch((e) => {
        setError(e.message);
        load();
      });
  }

  if (loading) return <p className="muted">Loading…</p>;

  const done = transfers.filter((t) => t.isDone).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Checklist</h1>
          <p className="muted">
            {done} of {transfers.length} done. Drag the handle to reorder; edit the
            description and due day inline.
          </p>
        </div>
        <div className="row-actions">
          <button className="btn" onClick={add}>
            + Add item
          </button>
          <button className="btn danger" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="dnd-list">
        {transfers.map((t, i) => (
          <ChecklistRow
            key={t.id}
            item={t}
            dragging={dragIndex === i}
            over={overIndex === i && dragIndex !== i}
            onToggle={() => toggle(t.id)}
            onSave={save}
            onDelete={() => remove(t.id)}
            onDragStart={() => setDragIndex(i)}
            onDragEnter={() => setOverIndex(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDrop={() => handleDrop(i)}
          />
        ))}
        {transfers.length === 0 && (
          <div className="card muted center">No checklist items yet.</div>
        )}
      </div>
    </div>
  );
}

function ChecklistRow({
  item,
  dragging,
  over,
  onToggle,
  onSave,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}) {
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item]);

  const dirty =
    draft.name !== item.name || (draft.day ?? null) !== (item.day ?? null);

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  const cls = [
    "dnd-row",
    item.isDone ? "done" : "",
    dragging ? "dragging" : "",
    over ? "over" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cls}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDrop={onDrop}
    >
      <span
        className="drag-handle"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        title="Drag to reorder"
      >
        ⠿
      </span>
      <input
        type="checkbox"
        className="big-check"
        checked={item.isDone}
        onChange={onToggle}
      />
      <input
        className="dnd-desc"
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
      />
      <div className="dnd-day">
        <span className="muted small">Day</span>
        <DayInput className="right" value={draft.day} onChange={(v) => set("day", v)} />
      </div>
      <div className="row-actions">
        <button className="btn small" disabled={!dirty} onClick={() => onSave(draft)}>
          Save
        </button>
        <button className="btn small danger icon-only" title="Delete" onClick={onDelete}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
