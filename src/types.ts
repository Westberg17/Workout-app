export type SessionKind = "strength" | "cardio" | "climb" | "mobility";

export interface ExerciseDef {
  id: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  /** Mål-RIR (reps kvar i tanken) */
  rir: number;
  /** Viktökning i kg när progression sker */
  increment: number;
  /** "kg" = extern vikt, "bw" = kroppsvikt (vikt = extra belastning) */
  load: "kg" | "bw";
  /** Reps räknas per sida/ben */
  perSide?: boolean;
  /** Ingen automatisk progression (t.ex. hopp) */
  fixed?: boolean;
  note?: string;
}

export interface RatingDef {
  id: string;
  label: string;
  min: number;
  max: number;
}

export interface SessionDef {
  id: string;
  name: string;
  short: string;
  kind: SessionKind;
  focus?: string;
  warmup: string[];
  exercises: ExerciseDef[];
  /** Avslutning: t.ex. kondition efter benpass, nedvarvning */
  finisher: string[];
  ratings: RatingDef[];
}

/** 0 = söndag ... 6 = lördag (som Date.getDay()) */
export type Schedule = Record<number, string | null>;

export interface Program {
  sessions: SessionDef[];
  schedule: Schedule;
}

export interface SetLog {
  weight: number | null;
  reps: number | null;
  rir: number | null;
  done: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  sets: SetLog[];
  skipped?: boolean;
  note?: string;
}

export interface CardioLog {
  minutes: number | null;
  effort: number | null;
  notes: string;
}

export interface WorkoutLog {
  id: string;
  sessionId: string;
  sessionName: string;
  kind: SessionKind;
  date: string; // YYYY-MM-DD
  startedAt: number;
  finishedAt?: number;
  warmupDone: boolean[];
  finisherDone: boolean[];
  exercises: ExerciseLog[];
  cardio?: CardioLog;
  ratings: Record<string, number>;
  comment: string;
  imported?: boolean;
  ai?: AIAnalysis;
}

export interface Target {
  weight: number | null;
  repLow: number;
  repHigh: number;
  sets: number;
  rir: number;
  /** Kort motivering på svenska */
  reason: string;
  source: "rule" | "ai" | "start";
  trend: "up" | "same" | "down" | "new";
}

export interface AIExerciseAdvice {
  exerciseId: string;
  weight: number | null;
  repLow: number;
  repHigh: number;
  reason: string;
}

export interface AIAnalysis {
  createdAt: number;
  model: string;
  summary: string;
  adjustments: AIExerciseAdvice[];
  tips: string[];
  applied: boolean;
  usage?: { input: number; output: number };
}

export interface Settings {
  apiKey: string;
  model: string;
  autoAnalyze: boolean;
  restSeconds: number;
}

export interface AppState {
  version: 1;
  /** Vilken version av standardprogrammet som är inläst */
  programVersion?: number;
  program: Program;
  logs: WorkoutLog[];
  /** Nästa mål per övnings-id */
  targets: Record<string, Target>;
  active: WorkoutLog | null;
  settings: Settings;
}
