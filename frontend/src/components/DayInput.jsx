// A day-of-month input: digits only, at most 2 characters, clamped to 1–31.
// Calls onChange with a number, or null when empty.
export default function DayInput({ value, onChange, className = "", placeholder = "—" }) {
  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (digits === "") {
      onChange(null);
      return;
    }
    let n = parseInt(digits, 10);
    if (n < 1) n = 1;
    if (n > 31) n = 31;
    onChange(n);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={2}
      className={className}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={handleChange}
    />
  );
}
