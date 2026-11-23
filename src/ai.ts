import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import { fmtNum } from "./progression";
import { findSession, targetFor } from "./store";
import type { AIAnalysis, AppState, ExerciseLog, WorkoutLog } from "./types";

const AdviceSchema = z.object({
  summary: z.string(),
  adjustments: z.array(
    z.object({
      exerciseId: z.string(),
      weight: z.number().nullable(),
      repLow: z.number(),
      repHigh: z.number(),
      reason: z.string(),
    })
  ),
  tips: z.array(z.string()),
});

const SYSTEM = `Du är en erfaren styrke- och hypertrofitränare. Du analyserar ett avslutat gympass och justerar nästa pass.
Mål: hypertrofi, estetisk kropp, god rörlighet och långsiktig hälsa. Klättrar också ~1 gång/vecka.
Du får: passets loggade set (vikt×reps@RIR), betyg (1–10, högre = bättre), kommentar, föregående pass och appens regelbaserade förslag för nästa pass.
Regler:
- Appens förslag är dubbel progression. Föreslå bara en justering (adjustments) när du har ett tydligt skäl att avvika – annars lämna listan tom.
- Använd exakt exerciseId från indata. weight i kg (för kroppsviktsövningar = extra belastning, 0 = bara kroppsvikt).
- Var försiktig med ländryggen om betyget för den sjunker.
- Svara på eventuella frågor i kommentaren.
- Skriv på svenska, kort och konkret: summary max 3 meningar, max 3 tips.`;

function fmtSets(e: ExerciseLog): string {
  if (e.skipped) return `hoppades över${e.note ? ` (${e.note})` : ""}`;
  const sets = e.sets
    .filter((s) => s.reps)
    .map((s) => `${fmtNum(s.weight ?? 0)}×${s.reps}${s.rir != null ? `@${s.rir}` : ""}`)
    .join(", ");
  return `${sets || "ej loggad"}${e.note ? ` (${e.note})` : ""}`;
}

function fmtRatings(log: WorkoutLog): string {
  return Object.entries(log.ratings)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
}

/** Bygger en kompakt textbeskrivning – håller nere antalet tokens. */
export function buildPrompt(state: AppState, log: WorkoutLog): string {
  const session = findSession(state, log.sessionId);
  const lines: string[] = [];
  lines.push(`PASS: ${log.sessionName} (${log.date})`);
  if (log.kind === "strength" && session) {
    lines.push("Övning [id] plan | idag | appens förslag nästa gång");
    for (const def of session.exercises) {
      const e = log.exercises.find((x) => x.exerciseId === def.id);
      const t = targetFor(state, def);
      const kv = def.load === "bw" ? " (KV)" : "";
      lines.push(
        `${def.name}${kv} [${def.id}] ${def.sets}×${def.repMin}–${def.repMax}${def.perSide ? "/sida" : ""} RIR${def.rir} steg ${fmtNum(def.increment)} | ${
          e ? fmtSets(e) : "ej loggad"
        } | ${t.weight == null ? "?" : fmtNum(t.weight)} kg × ${t.repLow}–${t.repHigh}`
      );
    }
  }
  if (log.cardio) {
    lines.push(`Tid: ${log.cardio.minutes ?? "?"} min, ansträngning ${log.cardio.effort ?? "?"}/10. ${log.cardio.notes}`);
  }
  lines.push(`Betyg: ${fmtRatings(log) || "inga"}`);
  if (log.comment) lines.push(`Kommentar: ${log.comment}`);

  const prev = state.logs
    .filter((l) => l.sessionId === log.sessionId && l.id !== log.id)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 2);
  for (const p of prev) {
    lines.push(`\nFÖREGÅENDE ${p.imported ? "(importerad)" : p.date}: ` + p.exercises.map((e) => `${e.name}: ${fmtSets(e)}`).join("; "));
    if (Object.keys(p.ratings).length) lines.push(`Betyg: ${fmtRatings(p)}`);
  }
  return lines.join("\n");
}

export async function analyzeWorkout(state: AppState, log: WorkoutLog): Promise<AIAnalysis> {
  const { apiKey, model } = state.settings;
  if (!apiKey) throw new Error("Lägg in din Claude API-nyckel under Inställningar.");

  // Nyckeln ligger bara i din telefon och skickas direkt till Anthropic.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  let response;
  try {
    response = await client.messages.parse({
      model,
      max_tokens: 4000,
      system: SYSTEM,
      output_config: { effort: "low", format: zodOutputFormat(AdviceSchema) },
      messages: [{ role: "user", content: buildPrompt(state, log) }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new Error("API-nyckeln godkändes inte. Kontrollera den under Inställningar.");
    if (err instanceof Anthropic.RateLimitError) throw new Error("För många anrop just nu – försök igen om en stund.");
    if (err instanceof Anthropic.APIConnectionError) throw new Error("Ingen kontakt med Claude. Är du offline? Försök igen senare.");
    if (err instanceof Anthropic.APIError) throw new Error(`Claude svarade med fel ${err.status ?? ""}: ${err.message}`);
    throw err;
  }

  if (response.stop_reason === "refusal") throw new Error("Claude avböjde att analysera passet.");
  if (response.stop_reason === "max_tokens") throw new Error("Svaret blev för långt och klipptes av – försök igen.");
  const out = response.parsed_output;
  if (!out) throw new Error("Kunde inte tolka svaret från Claude.");

  const session = findSession(state, log.sessionId);
  const validIds = new Set(session?.exercises.map((e) => e.id) ?? []);
  return {
    createdAt: Date.now(),
    model,
    summary: out.summary,
    adjustments: out.adjustments.filter((a) => validIds.has(a.exerciseId)),
    tips: out.tips.slice(0, 3),
    applied: false,
    usage: { input: response.usage.input_tokens, output: response.usage.output_tokens },
  };
}
