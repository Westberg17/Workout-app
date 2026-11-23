import { useState } from "react";
import { fmtNum, fmtWeight } from "../progression";
import { findSession, targetFor } from "../store";
import type { AppState, WorkoutLog } from "../types";
import { TrendBadge } from "./ui";

export function History({ state, onOpen }: { state: AppState; onOpen: (id: string) => void }) {
  const logs = [...state.logs].sort((a, b) => b.startedAt - a.startedAt);
  return (
    <div className="screen">
      <header className="page-head">
        <span className="eyebrow">{logs.filter((l) => !l.imported).length} loggade pass</span>
        <h1>Historik</h1>
      </header>
      <div className="list">
        {logs.map((l) => (
          <button key={l.id} className="card list-item" onClick={() => onOpen(l.id)}>
            <div>
              <span className="eyebrow">{l.imported ? "Importerad från ChatGPT" : fmtDate(l.date)}</span>
              <strong>{l.sessionName}</strong>
              <span className="muted small">
                {l.exercises.reduce((n, e) => n + e.sets.filter((s) => s.reps).length, 0)} set
                {l.ratings.feel != null && ` · passkänsla ${l.ratings.feel}/10`}
                {l.ai && " · AI-analys"}
              </span>
            </div>
            <span className="chev">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short" });
}

interface DetailProps {
  state: AppState;
  log: WorkoutLog;
  onBack: () => void;
  backLabel: string;
  justFinished?: boolean;
  aiBusy: boolean;
  aiError: string | null;
  onAnalyze: () => void;
  onApplyAI: () => void;
  onDelete?: () => void;
}

export function LogDetail({ state, log, onBack, backLabel, justFinished, aiBusy, aiError, onAnalyze, onApplyAI, onDelete }: DetailProps) {
  const session = findSession(state, log.sessionId);
  const [confirmDel, setConfirmDel] = useState(false);
  const sets = log.exercises.reduce((n, e) => n + e.sets.filter((s) => s.reps).length, 0);
  const volume = log.exercises.reduce((n, e) => n + e.sets.reduce((m, s) => m + (s.reps ?? 0) * (s.weight ?? 0), 0), 0);
  const isLatest = !state.logs.some((l) => l.sessionId === log.sessionId && l.startedAt > log.startedAt);
  const minutes = log.finishedAt && !log.imported ? Math.round((log.finishedAt - log.startedAt) / 60000) : null;

  return (
    <div className="screen">
      <header className="page-head">
        <button className="link-btn back" onClick={onBack}>
          ‹ {backLabel}
        </button>
        <span className="eyebrow">{log.imported ? "Importerad" : fmtDate(log.date)}</span>
        <h1>{justFinished ? "Bra jobbat! 💪" : log.sessionName}</h1>
      </header>

      <div className="stats">
        {minutes != null && (
          <div className="stat">
            <strong>{minutes}</strong>
            <span>min</span>
          </div>
        )}
        {sets > 0 && (
          <div className="stat">
            <strong>{sets}</strong>
            <span>set</span>
          </div>
        )}
        {volume > 0 && (
          <div className="stat">
            <strong>{fmtNum(Math.round(volume))}</strong>
            <span>kg volym</span>
          </div>
        )}
        {log.ratings.feel != null && (
          <div className="stat">
            <strong>{log.ratings.feel}</strong>
            <span>känsla</span>
          </div>
        )}
      </div>

      {log.kind === "strength" && session && isLatest && (
        <section>
          <h2 className="section-title">Nästa gång</h2>
          <div className="card">
            {session.exercises.map((def) => {
              const t = targetFor(state, def);
              const done = log.exercises.find((e) => e.exerciseId === def.id);
              return (
                <div key={def.id} className="next-row">
                  <div className="next-top">
                    <strong>{def.name}</strong>
                    <TrendBadge trend={t.trend} />
                  </div>
                  <div className="next-mid">
                    <span className="muted small">
                      Idag:{" "}
                      {done?.skipped
                        ? "hoppade över"
                        : done?.sets
                            .filter((s) => s.reps)
                            .map((s) => `${fmtNum(s.weight ?? 0)}×${s.reps}${s.rir != null ? `@${s.rir}` : ""}`)
                            .join(", ") || "–"}
                    </span>
                    <span className="next-target">
                      {fmtWeight(t.weight, def.load)} × {t.repLow === t.repHigh ? t.repLow : `${t.repLow}–${t.repHigh}`}
                    </span>
                  </div>
                  <p className="reason">
                    {t.source === "ai" && <span className="ai-tag">AI</span>} {t.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Coach-analys</h2>
        <div className="card ai-card">
          {log.ai ? (
            <>
              <p>{log.ai.summary}</p>
              {log.ai.tips.length > 0 && (
                <ul className="bullets">
                  {log.ai.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              )}
              {log.ai.adjustments.length > 0 && (
                <div className="ai-adj">
                  <span className="eyebrow">Föreslagna justeringar</span>
                  {log.ai.adjustments.map((a) => {
                    const def = session?.exercises.find((e) => e.id === a.exerciseId);
                    return (
                      <div key={a.exerciseId} className="adj">
                        <strong>
                          {def?.name ?? a.exerciseId}: {fmtWeight(a.weight, def?.load ?? "kg")} × {a.repLow}–{a.repHigh}
                        </strong>
                        <span className="muted small">{a.reason}</span>
                      </div>
                    );
                  })}
                  {!log.ai.applied ? (
                    <button className="btn btn-primary btn-block" onClick={onApplyAI}>
                      Använd AI-förslagen
                    </button>
                  ) : (
                    <p className="muted small">✓ Förslagen är inlagda som nästa mål.</p>
                  )}
                </div>
              )}
              <p className="muted tiny">
                {log.ai.model}
                {log.ai.usage && ` · ${log.ai.usage.input + log.ai.usage.output} tokens`}
              </p>
            </>
          ) : aiBusy ? (
            <p className="muted pulse">Analyserar passet…</p>
          ) : (
            <>
              {aiError && <p className="error">{aiError}</p>}
              {!state.settings.apiKey && <p className="muted small">Lägg in en Claude API-nyckel under Inställningar för att få en analys.</p>}
              <button className="btn btn-ghost btn-block" disabled={!state.settings.apiKey} onClick={onAnalyze}>
                Analysera med AI
              </button>
            </>
          )}
        </div>
      </section>

      {Object.keys(log.ratings).length > 0 && (
        <section>
          <h2 className="section-title">Betyg</h2>
          <div className="card rating-list">
            {session?.ratings.map((r) =>
              log.ratings[r.id] != null ? (
                <div key={r.id} className="field-row">
                  <span>{r.label}</span>
                  <strong>{log.ratings[r.id]}</strong>
                </div>
              ) : null
            )}
            {log.comment && <p className="comment">”{log.comment}”</p>}
          </div>
        </section>
      )}

      {log.cardio && (
        <section>
          <h2 className="section-title">Pass</h2>
          <div className="card">
            <p>
              {log.cardio.minutes ?? "?"} min · ansträngning {log.cardio.effort ?? "?"}/10
            </p>
            {log.cardio.notes && <p className="muted">{log.cardio.notes}</p>}
          </div>
        </section>
      )}

      {onDelete && !justFinished && (
        <div className="danger-zone">
          {confirmDel ? (
            <button className="btn btn-danger btn-block" onClick={onDelete}>
              Bekräfta: radera passet
            </button>
          ) : (
            <button className="link-btn danger" onClick={() => setConfirmDel(true)}>
              Radera pass
            </button>
          )}
        </div>
      )}
    </div>
  );
}
