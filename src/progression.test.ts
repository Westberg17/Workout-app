import { describe, expect, it } from "vitest";
import { computeTarget } from "./progression";
import type { ExerciseDef, ExerciseLog } from "./types";

const def: ExerciseDef = { id: "x", name: "X", sets: 2, repMin: 8, repMax: 10, rir: 2, increment: 2.5, load: "kg" };
const log = (...sets: [number, number, number | null][]): ExerciseLog => ({
  exerciseId: "x",
  name: "X",
  sets: sets.map(([weight, reps, rir]) => ({ weight, reps, rir, done: true })),
});

describe("computeTarget", () => {
  it("ökar vikten när alla set når toppen", () => {
    const t = computeTarget(def, log([80, 10, 2], [80, 10, 2]))!;
    expect(t.weight).toBe(82.5);
    expect(t.trend).toBe("up");
  });
  it("dubbelt steg när det var väldigt lätt", () => {
    expect(computeTarget(def, log([80, 10, 4], [80, 10, 4]))!.weight).toBe(85);
  });
  it("behåller vikten men höjer repsmålet inom intervallet", () => {
    const t = computeTarget(def, log([80, 9, 2], [80, 8, 2]))!;
    expect(t.weight).toBe(80);
    expect(t.repLow).toBe(9);
  });
  it("ingen ökning om toppen nåddes nära failure", () => {
    const t = computeTarget(def, log([80, 10, 0], [80, 10, 0]))!;
    expect(t.weight).toBe(80);
  });
  it("ingen ökning vid lågt passbetyg", () => {
    expect(computeTarget(def, log([80, 10, 2], [80, 10, 2]), { ratings: { feel: 3 } })!.weight).toBe(80);
  });
  it("deload efter två missar i rad", () => {
    const prev = log([80, 6, 1], [80, 6, 0]);
    const t = computeTarget(def, log([80, 7, 1], [80, 6, 0]), { history: [prev] })!;
    expect(t.weight).toBe(72.5);
    expect(t.trend).toBe("down");
  });
  it("en miss → behåll", () => {
    expect(computeTarget(def, log([80, 7, 1], [80, 6, 0]))!.weight).toBe(80);
  });
  it("olika vikter i seten → ingen ökning", () => {
    expect(computeTarget(def, log([80, 10, 2], [75, 10, 2]))!.weight).toBe(80);
  });
  it("kroppsvikt → lägger på extra vikt", () => {
    const bw: ExerciseDef = { ...def, load: "bw", repMin: 15, repMax: 20 };
    expect(computeTarget(bw, log([0, 20, null], [0, 20, null]))!.weight).toBe(2.5);
  });
  it("fixed-övning (hopp) progressar inte", () => {
    const jump: ExerciseDef = { ...def, load: "bw", fixed: true, repMin: 3, repMax: 3 };
    const t = computeTarget(jump, log([0, 3, 3], [0, 3, 3], [0, 3, 3]))!;
    expect(t.weight).toBe(0);
    expect(t.trend).toBe("same");
  });
  it("tom logg → null", () => {
    expect(computeTarget(def, { exerciseId: "x", name: "X", sets: [] })).toBeNull();
  });
});
