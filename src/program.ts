import type { ExerciseDef, Program, RatingDef, SessionDef, WorkoutLog } from "./types";

const ex = (
  id: string,
  name: string,
  sets: number,
  repMin: number,
  repMax: number,
  opts: Partial<ExerciseDef> = {}
): ExerciseDef => ({ id, name, sets, repMin, repMax, rir: 2, increment: 2.5, load: "kg", ...opts });

const energy: RatingDef = { id: "energy", label: "Energi", min: 1, max: 10 };
const feel: RatingDef = { id: "feel", label: "Passkänsla", min: 1, max: 10 };
const back: RatingDef = { id: "back", label: "Ländrygg (10 = helt bra)", min: 1, max: 10 };
const legs: RatingDef = { id: "legs", label: "Benens känsla", min: 1, max: 10 };
const shoulders: RatingDef = { id: "shoulders", label: "Axlar", min: 1, max: 10 };
const fingers: RatingDef = { id: "fingers", label: "Fingrar/armbågar", min: 1, max: 10 };

const upperWarmup = [
  "5 min cykel eller roddmaskin",
  "Band external rotations 1×15",
  "Band pull-aparts 1×15",
  "Scapular push-ups 1×10",
  "Wall slides 1×8",
];

export const upperA: SessionDef = {
  id: "upper-a",
  name: "Överkropp A",
  short: "Ö-A",
  kind: "strength",
  focus: "Rygg & bröst – tyngre basövningar",
  warmup: upperWarmup,
  exercises: [
    ex("lat-pulldown", "Latsdrag", 3, 8, 10, { note: "Full stretch i toppen, dra mot övre bröstet." }),
    ex("machine-chest-press", "Bröstpress i maskin", 3, 8, 12),
    ex("chest-supported-row", "Chest-supported row", 3, 10, 12, { note: "Låt skulderbladen glida fram i botten." }),
    ex("lateral-raise", "Sidolyft (maskin eller kabel)", 3, 10, 15, { rir: 1, increment: 1.25 }),
    ex("face-pull", "Face pulls", 2, 12, 15),
    ex("biceps-curl", "Bicepscurl (maskin)", 2, 10, 12),
    ex("triceps-pushdown", "Rope triceps pushdown", 2, 10, 12),
  ],
  finisher: [],
  ratings: [energy, feel, back, shoulders],
};

export const lowerA: SessionDef = {
  id: "lower-a",
  name: "Underkropp A",
  short: "U-A",
  kind: "strength",
  focus: "Knäböj & framsida lår",
  warmup: [
    "5 min lugn cykel",
    "Ankelmobilitet 1×10/sida",
    "90/90 höftrotationer 1×10",
    "Glute bridges 1×15",
    "Bird dogs 1×8/sida",
    "2–3 uppvärmningsset knäböj",
  ],
  exercises: [
    ex("squat", "Knäböj", 3, 6, 8, { note: "Så djupt du kan med neutral rygg – rörlighet under belastning." }),
    ex("leg-curl", "Lårcurl (sittande om det finns)", 2, 10, 12),
    ex("leg-extension", "Benspark", 2, 10, 15),
    ex("step-up", "Step-ups", 2, 10, 12, { perSide: true, increment: 2, note: "Endast om smärtfritt." }),
    ex("standing-calf", "Stående vadpress", 2, 12, 15, { note: "Paus 1–2 s i nedersta läget." }),
    ex("tibialis", "Tibialis raises", 2, 15, 20, { load: "bw", increment: 2.5 }),
  ],
  finisher: [],
  ratings: [energy, feel, back, legs],
};

export const upperB: SessionDef = {
  id: "upper-b",
  name: "Överkropp B",
  short: "Ö-B",
  kind: "strength",
  focus: "Press, axlar & armar i långa muskellängder",
  warmup: [...upperWarmup, "Thoracic rotations 1×8/sida"],
  exercises: [
    ex("incline-db-press", "Lutande hantelpress", 3, 8, 12, { increment: 2, note: "Djup stretch i botten." }),
    ex("cable-row-single", "Enarms kabelrodd, sittande", 2, 10, 12, { perSide: true, note: "Lätt drag – klättringen tar mycket rygg." }),
    ex("shoulder-press", "Axelpress (maskin eller hantlar)", 2, 8, 12),
    ex("cable-lateral-behind", "Kabelsidolyft bakom kroppen", 3, 12, 15, { rir: 1, increment: 1.25, perSide: true }),
    ex("overhead-triceps", "Triceps overhead extension (kabel)", 3, 10, 12),
    ex("incline-curl", "Lutande hantelcurl", 2, 10, 12, { increment: 1 }),
    ex("hanging-leg-raise", "Hängande benlyft", 2, 8, 15, { load: "bw", increment: 2.5, note: "Bonus: dekomprimerar ryggen." }),
  ],
  finisher: [],
  ratings: [energy, feel, back, shoulders],
};

export const lowerB: SessionDef = {
  id: "lower-b",
  name: "Underkropp B + kondition",
  short: "U-B",
  kind: "strength",
  focus: "Höft, baksida & enbens – rörlighet i djupa lägen",
  warmup: [
    "5 min cykel",
    "World's greatest stretch 1×5/sida",
    "Cossack squats 1×6/sida",
    "90/90 höftrotationer 1×10",
    "Glute bridges 1×15",
  ],
  exercises: [
    ex("bulgarian-split-squat", "Bulgarian split squat", 3, 8, 12, { perSide: true, increment: 2, note: "Långt steg = mer säte & höftböjarstretch." }),
    ex("hip-thrust", "Hip thrust", 3, 8, 12, { increment: 5 }),
    ex("db-rdl", "Rumänska marklyft med hantlar", 2, 10, 12, { increment: 2, note: "Lätt och kontrollerat. Hoppa över om ländryggen säger nej." }),
    ex("adductor", "Adduktormaskin", 2, 12, 15, { increment: 5 }),
    ex("seated-calf", "Sittande vadpress", 2, 12, 20),
    ex("pallof", "Pallof press", 2, 10, 12, { perSide: true, increment: 1.25 }),
  ],
  finisher: ["Kondition 20 min: 4×4 min hårt / 3 min lugnt (cykel, rodd eller löpband)"],
  ratings: [energy, feel, back, legs],
};

export const cardio: SessionDef = {
  id: "cardio",
  name: "Kondition",
  short: "Kond",
  kind: "cardio",
  focus: "Intervaller eller lugn distans",
  warmup: ["5–10 min lugn uppvärmning"],
  exercises: [],
  finisher: [
    "Alt. 1: 4×4 min hårt (~85–95 % av maxpuls) med 3 min lugnt mellan",
    "Alt. 2: 30–45 min lugnt, du ska kunna prata",
    "5 min nedvarvning",
  ],
  ratings: [energy, feel],
};

export const climb: SessionDef = {
  id: "climb",
  name: "Klättring",
  short: "Klätt",
  kind: "climb",
  focus: "Teknik, styrka & grepp",
  warmup: ["10 min lätta leder/problem", "Fingrar: gradvis belastning", "Axlar: band pull-aparts 1×15"],
  exercises: [],
  finisher: ["Antagonist: 2×15 armhävningar", "Underarmsstretch 1 min"],
  ratings: [energy, feel, fingers],
};

export const mobility: SessionDef = {
  id: "mobility",
  name: "Vila & rörlighet",
  short: "Vila",
  kind: "mobility",
  focus: "15–20 min lugn rörlighet",
  warmup: [],
  exercises: [],
  finisher: [
    "Katt–ko 1×10",
    "90/90 höftrotationer 2×8/sida",
    "Couch stretch 2×45 s/sida",
    "Duvan (pigeon) 2×45 s/sida",
    "Djup knäböjshållning 3×30 s",
    "Vad/ankel mot vägg 2×30 s/sida",
    "Thread the needle 2×8/sida",
    "Häng från stång 3×20–30 s",
  ],
  ratings: [],
};

export const defaultProgram: Program = {
  sessions: [upperA, lowerA, upperB, lowerB, climb, cardio, mobility],
  schedule: {
    1: "upper-a", // måndag
    2: "lower-a", // tisdag
    3: "mobility", // onsdag
    4: "climb", // torsdag
    5: "upper-b", // fredag
    6: "lower-b", // lördag
    0: "mobility", // söndag
  },
};

/* ---------- Importerade loggar (från dina ChatGPT-anteckningar) ---------- */

const s = (weight: number | null, reps: number | null, rir: number | null) => ({ weight, reps, rir, done: true });

export const importedLogs: WorkoutLog[] = [
  {
    id: "import-upper",
    sessionId: "upper-a",
    sessionName: "Överkropp (importerad)",
    kind: "strength",
    date: "",
    startedAt: 1,
    finishedAt: 1,
    warmupDone: [],
    finisherDone: [],
    imported: true,
    exercises: [
      { exerciseId: "lat-pulldown", name: "Latsdrag", sets: [s(80, 9, 2), s(75, 10, 1)] },
      { exerciseId: "machine-chest-press", name: "Bröstpress i maskin", sets: [s(70, 10, 2), s(70, 10, 2)] },
      { exerciseId: "lateral-raise", name: "Sidolyft", sets: [s(10, 12, 2), s(10, 12, 2), s(10, 12, 1)] },
      { exerciseId: "chest-supported-row", name: "Chest-supported row", sets: [s(65, 10, 2), s(65, 10, 2)] },
      { exerciseId: "reverse-pec-deck", name: "Reverse pec deck", sets: [], skipped: true, note: "Hoppade över – kändes redundant med face pulls." },
      { exerciseId: "face-pull", name: "Face pulls", sets: [s(20, 12, 2), s(20, 14, 1)] },
      { exerciseId: "biceps-curl", name: "Bicepscurl", sets: [s(15, 10, 2)], note: "Fel gym – körde hantlar 15 kg istället för maskin." },
      { exerciseId: "triceps-pushdown", name: "Rope triceps pushdown", sets: [s(35, 12, 2), s(35, 10, 2)] },
    ],
    ratings: { energy: 8, back: 7, shoulders: 8, feel: 8 },
    comment: "",
  },
  {
    id: "import-lower",
    sessionId: "lower-a",
    sessionName: "Underkropp (importerad, söndag)",
    kind: "strength",
    date: "",
    startedAt: 2,
    finishedAt: 2,
    warmupDone: [],
    finisherDone: [],
    imported: true,
    exercises: [
      { exerciseId: "squat", name: "Knäböj", sets: [s(100, 8, 2), s(100, 8, 1)] },
      { exerciseId: "leg-curl", name: "Lårcurl", sets: [s(57.5, 11, 2), s(57.5, 11, 1)] },
      { exerciseId: "leg-extension", name: "Benspark", sets: [s(80, 10, 1), s(80, 8, 1)] },
      { exerciseId: "step-up", name: "Step-ups", sets: [s(5, 11, 2), s(5, 10, 2)] },
      { exerciseId: "standing-calf", name: "Stående vadpress", sets: [s(60, 12, 2), s(60, 12, 1)] },
      { exerciseId: "tibialis", name: "Tibialis raises", sets: [s(0, 20, null), s(0, 20, null)] },
    ],
    ratings: { energy: 8, back: 7, legs: 8, feel: 9 },
    comment:
      "Riktigt bra pass en söndagsmorgon. Känner mig stark, uthållig och bra. Ska vi höja tibialis nästa vecka? Detta benpass var mycket bättre än det schemalagda.",
  },
];
