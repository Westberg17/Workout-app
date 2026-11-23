import { useEffect, useState } from "react";
import { fmtNum, fmtWeight } from "../progression";
import { exerciseHistory, findSession, targetFor } from "../store";
import type { AppState, ExerciseDef, ExerciseLog, SessionDef, SetLog, WorkoutLog } from "../types";
import { Checklist, ScalePicker, Sheet, Stepper } from "./ui";

interface Props {
  state: AppState;
  log: WorkoutLog;
  onChange: (log: WorkoutLog) => void;
  onFinish: (log: WorkoutLog) => void;
  onCancel: () => void;
}

export function Workout({ state, log, onChange, onFinish, onCancel }: Props) {
  const session = findSession(state, log.sessionId);
  const [showFinish, setShowFinish] = useState(false);
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [warmOpen, setWarmOpen] = useState(log.warmupDone.some((d) => !d) && !log.exercises.some((e) => e.sets.some((s) => s.done)));

  if (!session) {
    return (
      <div className="screen">
        <p>Passet finns inte längre i programmet.</p>
        <button className="btn" onClick={onCancel}>
          Tillbaka
        </button>
      </div>
    );
  }

  const updateEx = (idx: number, ex: ExerciseLog) => {
    const exercises = [...log.exercises];
    exercises[idx] = ex;
    onChange({ ...log, exercises });
  };

  const doneSets = log.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const totalSets = log.exercises.reduce((n, e) => n + (e.skipped ? 0 : e.sets.length), 0);
  const warmDone = log.warmupDone.filter(Boolean).length;

  return (
    <div className="screen workout">
      <header className="wo-head">
        <button className="icon-btn" onClick={onCancel} aria-label="Pausa">
          ‹
        </button>
        <div className="wo-title">
          <span className="eyebrow">{session.focus}</span>
          <h1>{session.name}</h1>
        </div>
        <Elapsed since={log.startedAt} />
      </header>

      {totalSets > 0 && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${(doneSets / totalSets) * 100}%` }} />
          <span>
            {doneSets}/{totalSets} set
          </span>
        </div>
      )}

      {session.warmup.length > 0 && (
        <section className="card">
          <button className="card-toggle" onClick={() => setWarmOpen(!warmOpen)}>
            <span>Uppvärmning</span>
            <span className="muted">
              {warmDone}/{session.warmup.length} {warmOpen ? "▴" : "▾"}
            </span>
          </button>
          {warmOpen && (
            <Checklist
              items={session.warmup}
              done={log.warmupDone}
              onToggle={(i) => {
                const warmupDone = [...log.warmupDone];
                warmupDone[i] = !warmupDone[i];
                onChange({ ...log, warmupDone });
              }}
            />
          )}
        </section>
      )}

      {session.exercises.map((def, i) => {
        const idx = log.exercises.findIndex((e) => e.exerciseId === def.id);
        if (idx < 0) return null;
        return (
          <ExerciseCard
            key={def.id}
            n={i + 1}
            def={def}
            state={state}
            ex={log.exercises[idx]}
            onChange={(ex) => updateEx(idx, ex)}
            onSetDone={() => setRestEnd(Date.now() + state.settings.restSeconds * 1000)}
          />
        );
      })}

      {log.cardio && (
        <section className="card">
          <h3 className="card-title">{session.kind === "climb" ? "Klättring" : "Kondition"}</h3>
          <div className="field-row">
            <span>Tid</span>
            <Stepper
              value={log.cardio.minutes}
              step={5}
              unit="min"
              onChange={(v) => onChange({ ...log, cardio: { ...log.cardio!, minutes: v } })}
            />
          </div>
          <ScalePicker
            label="Ansträngning"
            value={log.cardio.effort ?? undefined}
            min={1}
            max={10}
            onChange={(v) => onChange({ ...log, cardio: { ...log.cardio!, effort: v } })}
          />
          <textarea
            className="textarea"
            placeholder={session.kind === "climb" ? "Vad klättrade du? Svåraste grad, typ av pass…" : "Typ av pass, puls, distans…"}
            value={log.cardio.notes}
            onChange={(e) => onChange({ ...log, cardio: { ...log.cardio!, notes: e.target.value } })}
          />
        </section>
      )}

      {session.finisher.length > 0 && (
        <section className="card">
          <h3 className="card-title">{session.kind === "mobility" ? "Rörlighet" : session.kind === "strength" ? "Avslutning" : "Upplägg"}</h3>
          <Checklist
            items={session.finisher}
            done={log.finisherDone}
            onToggle={(i) => {
              const finisherDone = [...log.finisherDone];
              finisherDone[i] = !finisherDone[i];
              onChange({ ...log, finisherDone });
            }}
          />
        </section>
      )}

      <div className="wo-footer">
        <button className="btn btn-primary btn-block" onClick={() => setShowFinish(true)}>
          Avsluta pass
        </button>
      </div>

      {restEnd && <RestTimer end={restEnd} onDone={() => setRestEnd(null)} onAdd={() => setRestEnd(restEnd + 30000)} />}

      {showFinish && (
        <FinishSheet session={session} log={log} onChange={onChange} onClose={() => setShowFinish(false)} onSave={() => onFinish(log)} />
      )}
    </div>
  );
}

function ExerciseCard({
  n,
  def,
  state,
  ex,
  onChange,
  onSetDone,
}: {
  n: number;
  def: ExerciseDef;
  state: AppState;
  ex: ExerciseLog;
  onChange: (ex: ExerciseLog) => void;
  onSetDone: () => void;
}) {
  const t = targetFor(state, def);
  const last = exerciseHistory(state.logs, def.id)[0];
  const [noteOpen, setNoteOpen] = useState(!!ex.note);
  const allDone = ex.sets.length > 0 && ex.sets.every((s) => s.done);
  const repLabel = t.repLow === t.repHigh ? `${t.repLow}` : `${t.repLow}–${t.repHigh}`;

  const setSet = (i: number, patch: Partial<SetLog>) => {
    const sets = ex.sets.map((s, j) => {
      if (j === i) return { ...s, ...patch };
      // Ändrad vikt följer med till kommande set som inte är klara
      if (j > i && patch.weight !== undefined && !s.done && s.weight === ex.sets[i].weight) return { ...s, weight: patch.weight };
      return s;
    });
    onChange({ ...ex, sets });
  };

  const toggleDone = (i: number) => {
    const s = ex.sets[i];
    if (!s.done) {
      setSet(i, { done: true, reps: s.reps ?? t.repLow, rir: s.rir ?? t.rir });
      onSetDone();
    } else setSet(i, { done: false });
  };

  return (
    <section className={`card ex-card ${allDone ? "complete" : ""} ${ex.skipped ? "skipped" : ""}`}>
      <div className="ex-head">
        <span className="ex-num">{n}</span>
        <div className="ex-name">
          <h3>{def.name}</h3>
          {def.note && <p className="muted small">{def.note}</p>}
        </div>
      </div>

      <div className="target">
        <div>
          <span className="eyebrow">Mål</span>
          <strong>
            {fmtWeight(t.weight, def.load)} × {repLabel}
            {def.perSide ? "/sida" : ""}
          </strong>
          <span className="muted small">
            {t.sets} set · RIR {t.rir}
          </span>
        </div>
        {last && (
          <div className="last">
            <span className="eyebrow">Förra</span>
            <span className="small">
              {last.sets
                .filter((s) => s.reps)
                .map((s) => `${fmtNum(s.weight ?? 0)}×${s.reps}`)
                .join(", ")}
            </span>
          </div>
        )}
      </div>
      {t.reason && <p className="reason">{t.reason}</p>}

      {ex.skipped ? (
        <button className="btn btn-ghost btn-block" onClick={() => onChange({ ...ex, skipped: false })}>
          Ångra – kör övningen
        </button>
      ) : (
        <div className="sets">
          {ex.sets.map((s, i) => (
            <div key={i} className={`set ${s.done ? "done" : ""}`}>
              <div className="set-main">
                <span className="set-n">{i + 1}</span>
                <Stepper value={s.weight} step={def.increment} unit={def.load === "bw" ? "+kg" : "kg"} placeholder="kg" onChange={(v) => setSet(i, { weight: v })} />
                <Stepper value={s.reps} step={1} unit="reps" placeholder={repLabel} onChange={(v) => setSet(i, { reps: v })} />
                <button className={`done-btn ${s.done ? "on" : ""}`} onClick={() => toggleDone(i)} aria-label="Klar">
                  ✓
                </button>
              </div>
              <div className="rir-row">
                <span className="muted small">RIR</span>
                {[0, 1, 2, 3, 4].map((r) => (
                  <button key={r} className={`chip ${s.rir === r ? "on" : ""}`} onClick={() => setSet(i, { rir: s.rir === r ? null : r })}>
                    {r === 4 ? "4+" : r}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ex-actions">
        {!ex.skipped && (
          <>
            <button
              className="link-btn"
              onClick={() => onChange({ ...ex, sets: [...ex.sets, { ...ex.sets[ex.sets.length - 1], reps: null, rir: null, done: false }] })}
            >
              + Set
            </button>
            {ex.sets.length > 1 && (
              <button className="link-btn" onClick={() => onChange({ ...ex, sets: ex.sets.slice(0, -1) })}>
                − Set
              </button>
            )}
            <button className="link-btn" onClick={() => onChange({ ...ex, skipped: true })}>
              Hoppa över
            </button>
          </>
        )}
        <button className="link-btn" onClick={() => setNoteOpen(!noteOpen)}>
          Anteckning
        </button>
      </div>
      {noteOpen && (
        <textarea
          className="textarea"
          placeholder="T.ex. körde hantlar istället, ont i axeln…"
          value={ex.note ?? ""}
          onChange={(e) => onChange({ ...ex, note: e.target.value })}
        />
      )}
    </section>
  );
}

function FinishSheet({
  session,
  log,
  onChange,
  onClose,
  onSave,
}: {
  session: SessionDef;
  log: WorkoutLog;
  onChange: (l: WorkoutLog) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Sheet title="Hur kändes passet?" onClose={onClose}>
      {session.ratings.map((r) => (
        <ScalePicker
          key={r.id}
          label={r.label}
          value={log.ratings[r.id]}
          min={r.min}
          max={r.max}
          onChange={(v) => onChange({ ...log, ratings: { ...log.ratings, [r.id]: v } })}
        />
      ))}
      <label className="label">Kommentar eller fråga till coachen</label>
      <textarea
        className="textarea"
        placeholder="Hur gick det? Något som störde? Frågor inför nästa pass?"
        value={log.comment}
        onChange={(e) => onChange({ ...log, comment: e.target.value })}
      />
      <button className="btn btn-primary btn-block" onClick={onSave}>
        Spara pass
      </button>
    </Sheet>
  );
}

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const min = Math.floor((now - since) / 60000);
  return <span className="elapsed">{min} min</span>;
}

function RestTimer({ end, onDone, onAdd }: { end: number; onDone: () => void; onAdd: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const left = Math.max(0, Math.ceil((end - now) / 1000));
  useEffect(() => {
    if (left === 0) {
      navigator.vibrate?.(300);
      const id = setTimeout(onDone, 2500);
      return () => clearTimeout(id);
    }
  }, [left, onDone]);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className={`rest ${left === 0 ? "rest-done" : ""}`}>
      <span className="eyebrow">Vila</span>
      <strong>{left === 0 ? "Kör!" : `${mm}:${ss}`}</strong>
      <button className="chip" onClick={onAdd}>
        +30 s
      </button>
      <button className="chip" onClick={onDone}>
        Hoppa
      </button>
    </div>
  );
}
