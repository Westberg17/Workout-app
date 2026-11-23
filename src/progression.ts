import type { ExerciseDef, ExerciseLog, SetLog, Target } from "./types";

/** Avrunda till närmaste viktsteg (t.ex. 2,5 kg). */
export function roundTo(value: number, step: number): number {
  const s = step > 0 ? step : 0.5;
  return Math.round(value / s) * s;
}

/** Set som faktiskt genomförts (har reps ifyllt). */
export function workingSets(log: ExerciseLog | undefined): SetLog[] {
  if (!log || log.skipped) return [];
  return log.sets.filter((s) => s.reps != null && s.reps > 0);
}

export function fmtWeight(w: number | null | undefined, load: "kg" | "bw"): string {
  if (load === "bw") {
    if (!w) return "KV";
    return `KV + ${fmtNum(w)} kg`;
  }
  if (w == null) return "– kg";
  return `${fmtNum(w)} kg`;
}

export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("sv-SE", { maximumFractionDigits: 2 });
}

export function startTarget(def: ExerciseDef): Target {
  return {
    weight: def.load === "bw" ? 0 : null,
    repLow: def.repMin,
    repHigh: def.repMax,
    sets: def.sets,
    rir: def.rir,
    reason: def.load === "bw" ? "Ny övning – börja med kroppsvikt." : "Ny övning – hitta en vikt där du landar på mål-RIR.",
    source: "start",
    trend: "new",
  };
}

interface Context {
  /** Tidigare loggar för samma övning, nyast först (exklusive den aktuella). */
  history?: ExerciseLog[];
  /** Passbetyg från det aktuella passet. */
  ratings?: Record<string, number>;
}

function hadMissAtWeight(log: ExerciseLog, def: ExerciseDef): boolean {
  const ws = workingSets(log);
  if (ws.length === 0) return false;
  const top = Math.max(...ws.map((s) => s.weight ?? 0));
  const atTop = ws.filter((s) => (s.weight ?? 0) === top);
  return Math.min(...atTop.map((s) => s.reps ?? 0)) < def.repMin;
}

/**
 * Dubbel progression med RIR-styrning:
 *  - Alla set på toppvikten når toppen av repintervallet och ansträngningen är rimlig → öka vikten.
 *  - Under botten av intervallet två pass i rad → sänk ~10 % (deload).
 *  - Annars: behåll vikten och sikta på fler reps.
 *  - Lågt passbetyg/energi (≤ 4 av 10) blockerar viktökning.
 */
export function computeTarget(def: ExerciseDef, log: ExerciseLog | undefined, ctx: Context = {}): Target | null {
  const ws = workingSets(log);
  if (ws.length === 0) return null; // inget att basera på – behåll tidigare mål
  if (def.fixed) {
    return {
      weight: def.load === "bw" ? 0 : Math.max(...ws.map((s) => s.weight ?? 0)),
      repLow: def.repMin,
      repHigh: def.repMax,
      sets: def.sets,
      rir: def.rir,
      reason: "Kvalitet före mängd – maximal fart och höjd varje rep.",
      source: "rule",
      trend: "same",
    };
  }

  const isBw = def.load === "bw";
  const top = Math.max(...ws.map((s) => s.weight ?? 0));
  const atTop = ws.filter((s) => (s.weight ?? 0) === top);
  const minRepsAtTop = Math.min(...atTop.map((s) => s.reps ?? 0));
  const rirs = ws.map((s) => s.rir).filter((r): r is number => r != null);
  const avgRir = rirs.length ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null;

  const allAtTop = atTop.length === ws.length;
  const enoughSets = ws.length >= def.sets;
  const hitTopOfRange = allAtTop && enoughSets && minRepsAtTop >= def.repMax;
  const tooHard = avgRir != null && avgRir < def.rir - 1;
  const veryEasy = avgRir != null && avgRir >= def.rir + 2;

  const r = ctx.ratings ?? {};
  const lowDay = [r.feel, r.energy].some((v) => v != null && v <= 4);

  const base = { sets: def.sets, rir: def.rir, source: "rule" as const };
  const repUnit = def.perSide ? " reps/sida" : " reps";
  const w = (x: number) => fmtWeight(x, def.load);

  if (hitTopOfRange && !tooHard && !lowDay) {
    const step = veryEasy ? def.increment * 2 : def.increment;
    const next = isBw ? top + step : roundTo(top + step, def.increment);
    return {
      ...base,
      weight: next,
      repLow: def.repMin,
      repHigh: def.repMax,
      trend: "up",
      reason: veryEasy
        ? `Alla set i toppen av intervallet med god marginal (RIR ${fmtNum(avgRir!)}) → dubbelt steg till ${w(next)}.`
        : `Alla set nådde ${def.repMax}${repUnit} → öka till ${w(next)} och börja om på ${def.repMin}–${def.repMax}.`,
    };
  }

  if (hitTopOfRange && (tooHard || lowDay)) {
    return {
      ...base,
      weight: top,
      repLow: def.repMax,
      repHigh: def.repMax,
      trend: "same",
      reason: lowDay
        ? `Toppen av intervallet nådd, men passet kändes tungt – upprepa ${w(top)} och öka när det sitter.`
        : `Toppen nådd men nära failure (RIR ${fmtNum(avgRir!)}) – upprepa ${w(top)} med bättre marginal innan ökning.`,
    };
  }

  if (minRepsAtTop < def.repMin) {
    const prev = ctx.history?.[0];
    const secondMiss = prev ? hadMissAtWeight(prev, def) : false;
    if (secondMiss && !isBw && top > 0) {
      const next = Math.min(top - def.increment, roundTo(top * 0.9, def.increment));
      return {
        ...base,
        weight: next,
        repLow: def.repMin + 1,
        repHigh: def.repMax,
        trend: "down",
        reason: `Under ${def.repMin}${repUnit} två pass i rad → sänk ~10 % till ${w(next)} och bygg upp igen.`,
      };
    }
    return {
      ...base,
      weight: top,
      repLow: def.repMin,
      repHigh: def.repMax,
      trend: "same",
      reason: `${minRepsAtTop}${repUnit} är under intervallet (${def.repMin}–${def.repMax}) – behåll ${w(top)} och sikta på minst ${def.repMin}.`,
    };
  }

  const aim = Math.min(def.repMax, minRepsAtTop + 1);
  return {
    ...base,
    weight: top,
    repLow: aim,
    repHigh: def.repMax,
    trend: "same",
    reason: allAtTop
      ? `Behåll ${w(top)} – sikta på ${aim}+${repUnit} i alla set.`
      : `Alla set på ${w(top)} och ${aim}+${repUnit} innan ökning.`,
  };
}
