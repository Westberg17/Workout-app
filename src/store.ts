import { useEffect, useState } from "react";
import { computeTarget, startTarget } from "./progression";
import { defaultProgram, importedLogs } from "./program";
import type { AppState, ExerciseDef, ExerciseLog, SessionDef, Target, WorkoutLog } from "./types";

const KEY = "pass-app-state-v1";

export function localDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Alla loggade förekomster av en övning, nyast först. */
export function exerciseHistory(logs: WorkoutLog[], exerciseId: string, excludeLogId?: string): ExerciseLog[] {
  return [...logs]
    .filter((l) => l.id !== excludeLogId)
    .sort((a, b) => b.startedAt - a.startedAt)
    .map((l) => l.exercises.find((e) => e.exerciseId === exerciseId && !e.skipped && e.sets.some((s) => s.reps)))
    .filter((e): e is ExerciseLog => !!e);
}

export function findSession(state: AppState, id: string | null | undefined): SessionDef | undefined {
  return state.program.sessions.find((s) => s.id === id);
}

export function targetFor(state: AppState, def: ExerciseDef): Target {
  return state.targets[def.id] ?? startTarget(def);
}

/** Räkna fram nya mål för alla övningar i ett avslutat pass. */
export function applyLog(state: AppState, log: WorkoutLog): Record<string, Target> {
  const session = findSession(state, log.sessionId);
  const targets = { ...state.targets };
  if (!session) return targets;
  for (const def of session.exercises) {
    const exLog = log.exercises.find((e) => e.exerciseId === def.id);
    const history = exerciseHistory(state.logs, def.id, log.id);
    const t = computeTarget(def, exLog, { history, ratings: log.ratings });
    if (t) targets[def.id] = t;
  }
  return targets;
}

function initialState(): AppState {
  const base: AppState = {
    version: 1,
    program: defaultProgram,
    logs: [],
    targets: {},
    active: null,
    settings: { apiKey: "", model: "claude-haiku-5-5", autoAnalyze: true, restSeconds: 120 },
  };
  let st = base;
  for (const log of importedLogs) {
    st = { ...st, targets: applyLog(st, log), logs: [...st.logs, log] };
  }
  // Biceps kördes med hantlar på fel gym – utgå från senaste maskinresultat istället.
  st.targets["biceps-curl"] = {
    weight: 20,
    repLow: 11,
    repHigh: 12,
    sets: 2,
    rir: 2,
    reason: "Senaste maskinresultat: 20 kg × 10 (RIR 1) – sikta på 11–12.",
    source: "start",
    trend: "same",
  };
  return st;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch {
    /* ignorerar trasig data */
  }
  return initialState();
}

export function saveState(st: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch (e) {
    console.error("Kunde inte spara", e);
  }
}

export function resetState(): AppState {
  const st = initialState();
  saveState(st);
  return st;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);
  useEffect(() => saveState(state), [state]);
  useEffect(() => {
    // Be iOS/Chrome att inte rensa lagringen automatiskt (stöd varierar).
    navigator.storage?.persist?.().catch(() => undefined);
  }, []);
  return [state, setState] as const;
}

export function newWorkout(state: AppState, session: SessionDef): WorkoutLog {
  return {
    id: uid(),
    sessionId: session.id,
    sessionName: session.name,
    kind: session.kind,
    date: localDate(),
    startedAt: Date.now(),
    warmupDone: session.warmup.map(() => false),
    finisherDone: session.finisher.map(() => false),
    exercises: session.exercises.map((def) => {
      const t = targetFor(state, def);
      return {
        exerciseId: def.id,
        name: def.name,
        sets: Array.from({ length: t.sets }, () => ({ weight: t.weight, reps: null, rir: null, done: false })),
      };
    }),
    cardio: session.kind === "cardio" || session.kind === "climb" ? { minutes: null, effort: null, notes: "" } : undefined,
    ratings: {},
    comment: "",
  };
}

export function exportJson(state: AppState): string {
  return JSON.stringify({ ...state, settings: { ...state.settings, apiKey: "" } }, null, 2);
}

export function importJson(text: string, current: AppState): AppState {
  const parsed = JSON.parse(text) as AppState;
  if (!parsed || parsed.version !== 1 || !parsed.program || !Array.isArray(parsed.logs)) {
    throw new Error("Filen ser inte ut som en backup från appen.");
  }
  return { ...parsed, settings: { ...parsed.settings, apiKey: current.settings.apiKey || parsed.settings.apiKey } };
}
