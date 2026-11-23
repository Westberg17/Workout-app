import { fmtWeight } from "../progression";
import { findSession, localDate, targetFor } from "../store";
import type { AppState, SessionDef } from "../types";
import { Checklist } from "./ui";

const DAYS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
const DAYS_LONG = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];

/** Datum för veckans dagar, måndag först. */
export function weekDates(today = new Date()): Date[] {
  const d = new Date(today);
  const offset = (d.getDay() + 6) % 7; // mån = 0
  d.setDate(d.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x;
  });
}

interface Props {
  state: AppState;
  onStart: (s: SessionDef) => void;
  onResume: () => void;
}

export function Today({ state, onStart, onResume }: Props) {
  const now = new Date();
  const todayKey = localDate(now);
  const week = weekDates(now);
  const weekKeys = week.map((d) => localDate(d));
  const doneThisWeek = state.logs.filter((l) => !l.imported && weekKeys.includes(l.date));
  const todaySession = findSession(state, state.program.schedule[now.getDay()]);
  const doneToday = doneThisWeek.filter((l) => l.date === todayKey);

  // Pass som var schemalagda tidigare i veckan men inte körts (schemat "rullar")
  const missed = week
    .filter((d) => localDate(d) < todayKey)
    .map((d) => findSession(state, state.program.schedule[d.getDay()]))
    .filter((s): s is SessionDef => !!s && s.kind !== "mobility")
    .filter((s) => !doneThisWeek.some((l) => l.sessionId === s.id));

  const others = state.program.sessions.filter((s) => s.id !== todaySession?.id && !missed.some((m) => m.id === s.id));

  return (
    <div className="screen">
      <header className="page-head">
        <span className="eyebrow">
          {DAYS_LONG[now.getDay()]} {now.getDate()} {now.toLocaleDateString("sv-SE", { month: "long" })}
        </span>
        <h1>{todaySession ? (todaySession.kind === "mobility" ? "Vilodag" : "Dagens pass") : "Fri dag"}</h1>
      </header>

      <div className="week">
        {week.map((d) => {
          const key = localDate(d);
          const s = findSession(state, state.program.schedule[d.getDay()]);
          const done = doneThisWeek.some((l) => l.date === key);
          return (
            <div key={key} className={`day ${key === todayKey ? "today" : ""} ${done ? "done" : ""} ${key < todayKey ? "past" : ""}`}>
              <span className="day-name">{DAYS[d.getDay()]}</span>
              <span className="day-dot" />
              <span className="day-sess">{s?.short ?? "–"}</span>
            </div>
          );
        })}
      </div>

      {state.active && (
        <button className="card resume" onClick={onResume}>
          <span className="eyebrow">Pågående pass</span>
          <strong>{state.active.sessionName}</strong>
          <span className="resume-cta">Fortsätt →</span>
        </button>
      )}

      {doneToday.length > 0 && (
        <div className="card done-card">
          <span className="eyebrow">Klart idag</span>
          <strong>{doneToday.map((l) => l.sessionName).join(", ")} ✓</strong>
        </div>
      )}

      {todaySession && <SessionHero state={state} session={todaySession} onStart={onStart} disabled={!!state.active} />}

      {missed.length > 0 && (
        <section>
          <h2 className="section-title">Ej körda denna vecka</h2>
          <div className="pill-row">
            {missed.map((s) => (
              <button key={s.id} className="pill pill-warn" disabled={!!state.active} onClick={() => onStart(s)}>
                {s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Kör ett annat pass</h2>
        <div className="pill-row">
          {others.map((s) => (
            <button key={s.id} className="pill" disabled={!!state.active} onClick={() => onStart(s)}>
              {s.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SessionHero({ state, session, onStart, disabled }: { state: AppState; session: SessionDef; onStart: (s: SessionDef) => void; disabled: boolean }) {
  return (
    <section className="card hero">
      <span className="eyebrow">{session.focus}</span>
      <h2 className="hero-title">{session.name}</h2>

      {session.exercises.length > 0 && (
        <ol className="plan">
          {session.exercises.map((def) => {
            const t = targetFor(state, def);
            return (
              <li key={def.id}>
                <span className="plan-name">{def.name}</span>
                <span className="plan-target">
                  {t.weight == null && def.load === "kg" ? "hitta vikt" : fmtWeight(t.weight, def.load)}
                  <span className="muted">
                    {" "}
                    · {t.sets}×{t.repLow === t.repHigh ? t.repLow : `${t.repLow}–${t.repHigh}`}
                  </span>
                  {t.trend === "up" && <span className="up-arrow"> ↑</span>}
                  {t.trend === "down" && <span className="down-arrow"> ↓</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {session.kind === "mobility" && <Checklist items={session.finisher} done={session.finisher.map(() => false)} onToggle={() => onStart(session)} />}
      {(session.kind === "cardio" || session.kind === "climb") && (
        <ul className="bullets">
          {session.finisher.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}

      <button className="btn btn-primary btn-block" disabled={disabled} onClick={() => onStart(session)}>
        {session.kind === "mobility" ? "Starta rörlighetspass" : "Starta pass"}
      </button>
    </section>
  );
}
