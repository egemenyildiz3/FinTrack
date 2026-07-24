import { useState } from "react";

// A labeled list of removable "chips" with an add box and optional quick-add suggestions.
// Protected items can't be removed (their × is hidden).
export default function ChipEditor({
  items,
  onChange,
  placeholder,
  protectedItems = [],
  suggestions = [],
  emptyText = "Nothing here yet.",
}) {
  const [input, setInput] = useState("");

  const isProtected = (x) =>
    protectedItems.some((p) => p.toLowerCase() === x.toLowerCase());
  const exists = (x) => items.some((i) => i.toLowerCase() === x.toLowerCase());

  function add(name) {
    const value = (name ?? input).trim();
    if (!value) return;
    if (exists(value)) {
      setInput("");
      return;
    }
    onChange([...items, value]);
    setInput("");
  }

  function remove(name) {
    onChange(items.filter((i) => i !== name));
  }

  const quickAdds = suggestions.filter((s) => !exists(s));

  return (
    <>
      <div className="chips">
        {items.map((it) => (
          <span key={it} className="chip">
            {it}
            {!isProtected(it) && (
              <button className="chip-x" title="Remove" onClick={() => remove(it)}>
                ×
              </button>
            )}
          </span>
        ))}
        {items.length === 0 && <span className="muted small">{emptyText}</span>}
      </div>

      <div className="add-bank">
        <input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn" onClick={() => add()}>
          Add
        </button>
      </div>

      {quickAdds.length > 0 && (
        <div className="suggestions">
          <span className="muted small">Used by payments:</span>
          {quickAdds.map((s) => (
            <button key={s} className="chip add" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
