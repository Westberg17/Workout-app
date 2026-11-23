import { useEffect, useState, type ReactNode } from "react";

export function Stepper({
  value,
  onChange,
  step,
  placeholder,
  unit,
  min = 0,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  step: number;
  placeholder?: string;
  unit?: string;
  min?: number;
}) {
  const [text, setText] = useState(value == null ? "" : String(value).replace(".", ","));
  useEffect(() => {
    const parsed = parseNum(text);
    if (parsed !== value) setText(value == null ? "" : String(value).replace(".", ","));
  }, [value]);

  const bump = (d: number) => {
    const base = value ?? 0;
    const next = Math.max(min, Math.round((base + d) * 100) / 100);
    onChange(next);
  };

  return (
    <div className="stepper">
      <button type="button" className="stepper-btn" onClick={() => bump(-step)} aria-label="Minska">
        −
      </button>
      <label className="stepper-field">
        <input
          inputMode="decimal"
          value={text}
          placeholder={placeholder}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            setText(e.target.value);
            onChange(parseNum(e.target.value));
          }}
        />
        {unit && <span className="stepper-unit">{unit}</span>}
      </label>
      <button type="button" className="stepper-btn" onClick={() => bump(step)} aria-label="Öka">
        +
      </button>
    </div>
  );
}

export function parseNum(t: string): number | null {
  const v = t.trim().replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function ScalePicker({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | undefined;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="scale">
      <div className="scale-head">
        <span>{label}</span>
        <strong>{value ?? "–"}</strong>
      </div>
      <div className="scale-row">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            className={`scale-btn ${value === n ? "on" : ""}`}
            style={{ ["--lvl" as string]: (n - min) / (max - min) }}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Checklist({
  items,
  done,
  onToggle,
}: {
  items: string[];
  done: boolean[];
  onToggle: (i: number) => void;
}) {
  return (
    <ul className="checklist">
      {items.map((it, i) => (
        <li key={i}>
          <button type="button" className={`check-item ${done[i] ? "on" : ""}`} onClick={() => onToggle(i)}>
            <span className="check-box">{done[i] ? "✓" : ""}</span>
            <span>{it}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Sheet({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Stäng">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TrendBadge({ trend }: { trend: "up" | "same" | "down" | "new" }) {
  const map = { up: ["↑", "Öka"], same: ["→", "Behåll"], down: ["↓", "Sänk"], new: ["★", "Ny"] } as const;
  const [icon, label] = map[trend];
  return (
    <span className={`trend trend-${trend}`}>
      {icon} {label}
    </span>
  );
}
