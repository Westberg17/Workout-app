import { useState } from "react";
import { History, LogDetail } from "./components/History";
import { ProgramEditor } from "./components/ProgramEditor";
import { Settings } from "./components/Settings";
import { Today } from "./components/Today";
import { Workout } from "./components/Workout";
import { applyLog, findSession, newWorkout, useAppState } from "./store";
import type { AppState, SessionDef, WorkoutLog } from "./types";

type Tab = "today" | "history" | "program" | "settings";

export default function App() {
  const [state, setState] = useAppState();
  const [tab, setTab] = useState<Tab>("today");
  const [inWorkout, setInWorkout] = useState(false);
  const [openLog, setOpenLog] = useState<{ id: string; fresh: boolean } | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const runAnalysis = async (st: AppState, log: WorkoutLog) => {
    setAiBusy(log.id);
    setAiError(null);
    try {
      // AI-modulen (SDK) laddas först när den behövs – snabbare appstart
      const { analyzeWorkout } = await import("./ai");
      const ai = await analyzeWorkout(st, log);
      setState((s) => ({ ...s, logs: s.logs.map((l) => (l.id === log.id ? { ...l, ai } : l)) }));
    } catch (e) {
      setAiError((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  };

  const start = (session: SessionDef) => {
    setState((s) => ({ ...s, active: newWorkout(s, session) }));
    setInWorkout(true);
  };

  const finish = (log: WorkoutLog) => {
    const done = { ...log, finishedAt: Date.now() };
    const withLog: AppState = { ...state, logs: [...state.logs, done], active: null };
    const next: AppState = { ...withLog, targets: applyLog(withLog, done) };
    setState(() => next);
    setInWorkout(false);
    setTab("history");
    setOpenLog({ id: done.id, fresh: true });
    if (next.settings.autoAnalyze && next.settings.apiKey && done.kind !== "mobility") void runAnalysis(next, done);
  };

  const applyAI = (log: WorkoutLog) => {
    if (!log.ai) return;
    const session = findSession(state, log.sessionId);
    setState((s) => {
      const targets = { ...s.targets };
      for (const a of log.ai!.adjustments) {
        const def = session?.exercises.find((e) => e.id === a.exerciseId);
        const prev = targets[a.exerciseId];
        if (!def) continue;
        const trend = prev?.weight != null && a.weight != null ? (a.weight > prev.weight ? "up" : a.weight < prev.weight ? "down" : "same") : "same";
        targets[a.exerciseId] = { weight: a.weight, repLow: a.repLow, repHigh: a.repHigh, sets: def.sets, rir: def.rir, reason: a.reason, source: "ai", trend };
      }
      return { ...s, targets, logs: s.logs.map((l) => (l.id === log.id && l.ai ? { ...l, ai: { ...l.ai, applied: true } } : l)) };
    });
  };

  if (inWorkout && state.active) {
    return (
      <Workout
        state={state}
        log={state.active}
        onChange={(log) => setState((s) => ({ ...s, active: log }))}
        onFinish={finish}
        onCancel={() => setInWorkout(false)}
      />
    );
  }

  const detail = openLog && state.logs.find((l) => l.id === openLog.id);

  let body;
  if (detail) {
    body = (
      <LogDetail
        state={state}
        log={detail}
        justFinished={openLog!.fresh}
        backLabel={openLog!.fresh ? "Klar" : "Historik"}
        onBack={() => {
          if (openLog!.fresh) setTab("today");
          setOpenLog(null);
          setAiError(null);
        }}
        aiBusy={aiBusy === detail.id}
        aiError={aiError}
        onAnalyze={() => runAnalysis(state, detail)}
        onApplyAI={() => applyAI(detail)}
        onDelete={() => {
          setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== detail.id) }));
          setOpenLog(null);
        }}
      />
    );
  } else if (tab === "today") {
    body = <Today state={state} onStart={start} onResume={() => setInWorkout(true)} />;
  } else if (tab === "history") {
    body = <History state={state} onOpen={(id) => setOpenLog({ id, fresh: false })} />;
  } else if (tab === "program") {
    body = <ProgramEditor state={state} setState={setState} />;
  } else {
    body = <Settings state={state} setState={setState} />;
  }

  const tabs: [Tab, string, string][] = [
    ["today", "Idag", "◉"],
    ["history", "Historik", "≡"],
    ["program", "Program", "▦"],
    ["settings", "Inställn.", "⚙"],
  ];

  return (
    <div className="app">
      <main>{body}</main>
      <nav className="tabbar">
        {tabs.map(([id, label, icon]) => (
          <button
            key={id}
            className={`tab ${tab === id && !detail ? "on" : ""}`}
            onClick={() => {
              setOpenLog(null);
              setTab(id);
            }}
          >
            <span className="tab-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
