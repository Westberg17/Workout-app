import { describe, expect, it } from "vitest";
import { PROGRAM_VERSION, defaultProgram } from "./program";
import { migrate } from "./store";
import type { AppState } from "./types";

describe("migrate", () => {
  it("byter till nytt program men behåller loggar och mål", () => {
    const old = {
      version: 1,
      program: { sessions: [], schedule: {} },
      logs: [{ id: "a" }],
      targets: { squat: { weight: 100 } },
      active: null,
      settings: { apiKey: "k", model: "m", autoAnalyze: true, restSeconds: 90 },
    } as unknown as AppState;
    const st = migrate(old);
    expect(st.programVersion).toBe(PROGRAM_VERSION);
    expect(st.program).toBe(defaultProgram);
    expect(st.logs).toHaveLength(1);
    expect(st.targets.squat.weight).toBe(100);
    expect(st.settings.apiKey).toBe("k");
  });
  it("rör inte ett redan uppdaterat tillstånd", () => {
    const st = { version: 1, programVersion: PROGRAM_VERSION } as AppState;
    expect(migrate(st)).toBe(st);
  });
});
