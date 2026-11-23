import { useState } from "react";
import { startTarget } from "../progression";
import { uid } from "../store";
import type { AppState, ExerciseDef, SessionDef, Target } from "../types";
import { Stepper } from "./ui";

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
const KIND = { strength: "Styrka", cardio: "Kondition", climb: "Klättring", mobility: "Rörlighet" } as const;

export function ProgramEditor({ state, setState }: { state: AppState; setState: (f: (s: AppState) => AppState) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const session = state.program.sessions.find((s) => s.id === editing);

  const saveSession = (s: SessionDef) =>
    setState((st) => ({ ...st, program: { ...st.program, sessions: st.program.sessions.map((x) => (x.id === s.id ? s : x)) } }));

  if (session) {
    return (
      <SessionEditor
        session={session}
        targets={state.targets}
        onChange={saveSession}
        onTarget={(id, t) => setState((st) => ({ ...st, targets: { ...st.targets, [id]: t } }))}
        onBack={() => setEditing(null)}
        onDelete={() => {
          setState((st) => {
            const schedule = { ...st.program.schedule };
            for (const k of Object.keys(schedule)) if (schedule[+k] === session.id) schedule[+k] = null;
            return { ...st, program: { sessions: st.program.sessions.filter((x) => x.id !== session.id), schedule } };
          });
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="screen">
      <header className="page-head">
        <span className="eyebrow">Ditt upplägg</span>
        <h1>Program</h1>
      </header>

      <section>
        <h2 className="section-title">Veckoschema</h2>
        <div className="card">
          {ORDER.map((d) => (
            <div key={d} className="field-row">
              <span>{DAY[d]}</span>
              <select
                className="select"
                value={state.program.schedule[d] ?? ""}
                onChange={(e) =>
                  setState((st) => ({ ...st, program: { ...st.program, schedule: { ...st.program.schedule, [d]: e.target.value || null } } }))
                }
              >
                <option value="">Ledigt</option>
                {state.program.sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Pass</h2>
        <div className="list">
          {state.program.sessions.map((s) => (
            <button key={s.id} className="card list-item" onClick={() => setEditing(s.id)}>
              <div>
                <span className="eyebrow">{KIND[s.kind]}</span>
                <strong>{s.name}</strong>
                <span className="muted small">{s.exercises.length > 0 ? `${s.exercises.length} övningar` : s.focus}</span>
              </div>
              <span className="chev">›</span>
            </button>
          ))}
        </div>
        <div className="pill-row">
          {(["strength", "cardio", "climb", "mobility"] as const).map((k) => (
            <button
              key={k}
              className="pill"
              onClick={() => {
                const s: SessionDef = {
                  id: `s-${uid()}`,
                  name: `Nytt ${KIND[k].toLowerCase()}pass`,
                  short: "Nytt",
                  kind: k,
                  focus: "",
                  warmup: [],
                  exercises: [],
                  finisher: [],
                  ratings:
                    k === "mobility"
                      ? []
                      : [
                          { id: "energy", label: "Energi", min: 1, max: 10 },
                          { id: "feel", label: "Passkänsla", min: 1, max: 10 },
                        ],
                };
                setState((st) => ({ ...st, program: { ...st.program, sessions: [...st.program.sessions, s] } }));
                setEditing(s.id);
              }}
            >
              + {KIND[k]}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SessionEditor({
  session,
  targets,
  onChange,
  onTarget,
  onBack,
  onDelete,
}: {
  session: SessionDef;
  targets: Record<string, Target>;
  onChange: (s: SessionDef) => void;
  onTarget: (id: string, t: Target) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const setEx = (i: number, e: ExerciseDef) => onChange({ ...session, exercises: session.exercises.map((x, j) => (j === i ? e : x)) });
  const move = (i: number, d: number) => {
    const ex = [...session.exercises];
    const j = i + d;
    if (j < 0 || j >= ex.length) return;
    [ex[i], ex[j]] = [ex[j], ex[i]];
    onChange({ ...session, exercises: ex });
  };

  return (
    <div className="screen">
      <header className="page-head">
        <button className="link-btn back" onClick={onBack}>
          ‹ Program
        </button>
        <input className="title-input" value={session.name} onChange={(e) => onChange({ ...session, name: e.target.value })} />
      </header>

      <div className="card form">
        <label className="label">Fokus</label>
        <input className="input" value={session.focus ?? ""} onChange={(e) => onChange({ ...session, focus: e.target.value })} />
        <label className="label">Kort namn (veckovy)</label>
        <input className="input" maxLength={6} value={session.short} onChange={(e) => onChange({ ...session, short: e.target.value })} />
        {session.kind !== "mobility" && (
          <>
            <label className="label">Uppvärmning (en per rad)</label>
            <LinesInput value={session.warmup} onChange={(warmup) => onChange({ ...session, warmup })} />
          </>
        )}
        <label className="label">{session.kind === "mobility" ? "Rörlighetsövningar (en per rad)" : "Avslutning / upplägg (en per rad)"}</label>
        <LinesInput value={session.finisher} onChange={(finisher) => onChange({ ...session, finisher })} />
      </div>

      {session.kind === "strength" && (
        <section>
          <h2 className="section-title">Övningar</h2>
          {session.exercises.map((e, i) => {
            const t = targets[e.id] ?? startTarget(e);
            return (
              <div key={e.id} className="card ex-edit">
                <button className="card-toggle" onClick={() => setOpen(open === e.id ? null : e.id)}>
                  <span>
                    {i + 1}. {e.name}
                  </span>
                  <span className="muted small">
                    {e.sets}×{e.repMin}–{e.repMax}
                  </span>
                </button>
                {open === e.id && (
                  <div className="form">
                    <label className="label">Namn</label>
                    <input className="input" value={e.name} onChange={(ev) => setEx(i, { ...e, name: ev.target.value })} />
                    <div className="grid2">
                      <NumField label="Set" value={e.sets} step={1} onChange={(v) => setEx(i, { ...e, sets: Math.max(1, v) })} />
                      <NumField label="Mål-RIR" value={e.rir} step={1} onChange={(v) => setEx(i, { ...e, rir: Math.max(0, v) })} />
                      <NumField label="Reps min" value={e.repMin} step={1} onChange={(v) => setEx(i, { ...e, repMin: Math.max(1, v) })} />
                      <NumField label="Reps max" value={e.repMax} step={1} onChange={(v) => setEx(i, { ...e, repMax: Math.max(e.repMin, v) })} />
                      <NumField label="Viktsteg (kg)" value={e.increment} step={0.5} onChange={(v) => setEx(i, { ...e, increment: Math.max(0.5, v) })} />
                      <NumField
                        label="Vikt nästa pass"
                        value={t.weight ?? 0}
                        step={e.increment}
                        onChange={(v) => onTarget(e.id, { ...t, weight: v, reason: "Manuellt satt vikt.", source: "start", trend: "same" })}
                      />
                    </div>
                    <div className="toggle-row">
                      <button className={`chip ${e.load === "bw" ? "on" : ""}`} onClick={() => setEx(i, { ...e, load: e.load === "bw" ? "kg" : "bw" })}>
                        Kroppsvikt
                      </button>
                      <button className={`chip ${e.perSide ? "on" : ""}`} onClick={() => setEx(i, { ...e, perSide: !e.perSide })}>
                        Per sida
                      </button>
                    </div>
                    <label className="label">Notering</label>
                    <input className="input" value={e.note ?? ""} onChange={(ev) => setEx(i, { ...e, note: ev.target.value })} />
                    <div className="ex-actions">
                      <button className="link-btn" onClick={() => move(i, -1)}>
                        ↑ Upp
                      </button>
                      <button className="link-btn" onClick={() => move(i, 1)}>
                        ↓ Ner
                      </button>
                      <button className="link-btn danger" onClick={() => onChange({ ...session, exercises: session.exercises.filter((_, j) => j !== i) })}>
                        Ta bort
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              const id = `x-${uid()}`;
              onChange({
                ...session,
                exercises: [...session.exercises, { id, name: "Ny övning", sets: 3, repMin: 8, repMax: 12, rir: 2, increment: 2.5, load: "kg" }],
              });
              setOpen(id);
            }}
          >
            + Lägg till övning
          </button>
        </section>
      )}

      <div className="danger-zone">
        {confirmDel ? (
          <button className="btn btn-danger btn-block" onClick={onDelete}>
            Bekräfta: radera passet
          </button>
        ) : (
          <button className="link-btn danger" onClick={() => setConfirmDel(true)}>
            Radera passet
          </button>
        )}
      </div>
    </div>
  );
}

function NumField({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <Stepper value={value} step={step} onChange={(v) => onChange(v ?? 0)} />
    </div>
  );
}

function LinesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join("\n"));
  return (
    <textarea
      className="textarea"
      rows={Math.max(3, value.length + 1)}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
        );
      }}
    />
  );
}
