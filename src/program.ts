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
  focus: "Lats, övre bröst & armar",
  warmup: upperWarmup,
  exercises: [
    ex("lat-pulldown", "Latsdrag", 3, 8, 10, { note: "Full stretch i toppen, dra mot övre bröstet." }),
    ex("incline-db-press", "Lutande hantelpress", 3, 8, 12, { increment: 2, note: "Djup stretch i botten." }),
    ex("chest-supported-row", "Chest-supported row", 3, 10, 12, { note: "Om maskinen är dålig: kör enarms kabelrodd istället." }),
    ex("lateral-raise", "Sidolyft (kabel eller hantlar)", 3, 12, 15, { rir: 1, increment: 1, note: "Kontrollerat, ingen sving." }),
    ex("face-pull", "Face pulls", 2, 12, 15),
    ex("incline-curl", "Lutande hantelcurl", 3, 10, 12, { increment: 1 }),
    ex("skullcrusher", "Skullcrushers (EZ-stång)", 3, 8, 12, { note: "Sänk stången bakom huvudet för mer stretch." }),
  ],
  finisher: [],
  ratings: [energy, feel, back, shoulders],
};

export const lowerA: SessionDef = {
  id: "lower-a",
  name: "Underkropp A",
  short: "U-A",
  kind: "strength",
  focus: "Knäböj, framsida lår & armfinisher",
  warmup: [
    "5 min lugn cykel",
    "Ankelmobilitet 1×10/sida",
    "90/90 höftrotationer 1×10",
    "Glute bridges 1×15",
    "2–3 uppvärmningsset knäböj",
  ],
  exercises: [
    ex("box-jump", "Boxhopp", 3, 3, 3, { load: "bw", fixed: true, rir: 3, note: "Maxhöjd, kliv ner. Pigg och snabb – inte trött." }),
    ex("squat", "Knäböj", 3, 6, 8, { note: "Så djupt du kan med neutral rygg." }),
    ex("lying-leg-curl", "Liggande lårcurl", 3, 10, 12),
    ex("leg-extension", "Benspark", 3, 10, 15),
    ex("step-up", "Step-ups", 2, 10, 12, { perSide: true, increment: 2 }),
    ex("standing-calf", "Stående vadpress", 3, 10, 15, { note: "Paus 1–2 s i nedersta läget." }),
    ex("tibialis", "Tibialis raises", 2, 15, 20, { load: "bw", increment: 2.5, note: "Superset med Pallof press." }),
    ex("pallof", "Pallof press", 2, 10, 12, { perSide: true, increment: 1.25 }),
    ex("db-curl", "Armfinisher: Hantelcurl", 2, 10, 12, { increment: 1, note: "Superset med overhead triceps – ingen vila emellan." }),
    ex("overhead-triceps", "Armfinisher: Triceps overhead (kabel)", 2, 10, 15),
  ],
  finisher: [],
  ratings: [energy, feel, back, legs],
};

export const upperB: SessionDef = {
  id: "upper-b",
  name: "Överkropp B",
  short: "Ö-B",
  kind: "strength",
  focus: "Bröst, axlar & armar",
  warmup: [...upperWarmup, "Thoracic rotations 1×8/sida"],
  exercises: [
    ex("machine-chest-press", "Bröstpress i maskin", 3, 8, 12),
    ex("cable-fly", "Kabelflyes, stående", 3, 12, 15, { note: "Låt armarna gå bakåt till full stretch." }),
    ex("cable-row-single", "Enarms kabelrodd, sittande", 2, 10, 12, { perSide: true }),
    ex("shoulder-press", "Axelpress (maskin eller hantlar)", 2, 8, 12),
    ex("cable-lateral-behind", "Kabelsidolyft bakom kroppen", 3, 12, 15, { rir: 1, increment: 1.25, perSide: true }),
    ex("y-raise", "Y-raise i kabel (nedre trapezius)", 2, 12, 15, { increment: 1.25, note: "Lätt vikt, armarna i ett Y, skulderbladen ner och bak." }),
    ex("triceps-pushdown", "Rope triceps pushdown", 3, 10, 12),
    ex("hammer-curl", "Hammercurl", 3, 10, 12, { increment: 1 }),
    ex("reverse-curl", "Omvänd curl", 2, 12, 15, { increment: 1, note: "Bra för armbågarna vid klättring." }),
  ],
  finisher: [],
  ratings: [energy, feel, back, shoulders],
};

export const lowerB: SessionDef = {
  id: "lower-b",
  name: "Underkropp B + kondition",
  short: "U-B",
  kind: "strength",
  focus: "Höft, baksida lår, mage & kondition",
  warmup: [
    "5 min cykel",
    "World's greatest stretch 1×5/sida",
    "90/90 höftrotationer 1×10",
    "Glute bridges 1×15",
    "2 lätta uppvärmningsset trap bar",
  ],
  exercises: [
    ex("trap-bar-deadlift", "Marklyft med trap bar (högt grepp)", 3, 5, 8, { increment: 5, note: "Avbryt direkt om ländryggen känns som med RDL." }),
    ex("leg-curl", "Sittande lårcurl", 3, 10, 12, { note: "Kör den på Nordic." }),
    ex("walking-lunge", "Gående utfallssteg", 2, 10, 12, { perSide: true, increment: 2 }),
    ex("abductor", "Abduktormaskin", 2, 12, 15, { increment: 5 }),
    ex("adductor", "Adduktormaskin", 2, 12, 15, { increment: 5 }),
    ex("seated-calf", "Sittande vadpress", 2, 12, 20),
    ex("cable-crunch", "Kabelcrunch", 3, 10, 15, { note: "Runda ryggen, dra armbågarna mot knäna." }),
  ],
  finisher: ["Kondition 20 min: 4×4 min hårt / 3 min lugnt, eller 8×20 s backsprint"],
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
  focus: "Hela kroppen på ~15 min, lugnt tempo",
  warmup: [],
  exercises: [],
  finisher: [
    "Katt–ko 1×8 (rygg, mjukt)",
    "World's greatest stretch 1×4/sida (höft, ljumske, bröstrygg)",
    "90/90 höftrotationer 1×8/sida",
    "Couch stretch 1×45 s/sida (höftböjare, framsida lår)",
    "Hamstringsstretch liggande med band 1×45 s/sida",
    "Djup knäböjshållning 2×30 s (fotled, höft)",
    "Vadstretch mot vägg 1×30 s/sida",
    "Thread the needle 1×6/sida (bröstrygg)",
    "Bröststretch i dörrkarm 1×30 s/sida",
    "Häng från stång 2×20–30 s (axlar, avlastar ryggen)",
    "Fingerextension med gummiband 2×20 (klättring)",
    "Underarm & handled 1×30 s/sida (klättring)",
  ],
  ratings: [],
};

/** Höj när standardprogrammet ändras – appen byter då program men behåller loggar och mål. */
export const PROGRAM_VERSION = 2;

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
