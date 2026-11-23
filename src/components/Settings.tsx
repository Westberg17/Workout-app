import { useRef, useState } from "react";
import { exportJson, importJson, localDate, resetState } from "../store";
import type { AppState } from "../types";
import { Stepper } from "./ui";

const MODELS = [
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 – billigast (rekommenderas)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 – smartare, dyrare" },
];

export function Settings({ state, setState }: { state: AppState; setState: (f: (s: AppState) => AppState) => void }) {
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<AppState["settings"]>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const doExport = async () => {
    const json = exportJson(state);
    const name = `pass-backup-${localDate()}.json`;
    const file = new File([json], name, { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch {
      /* användaren avbröt delning – fall tillbaka till nedladdning */
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="screen">
      <header className="page-head">
        <span className="eyebrow">Appen</span>
        <h1>Inställningar</h1>
      </header>

      <section>
        <h2 className="section-title">AI-coach (Claude)</h2>
        <div className="card form">
          <label className="label">API-nyckel</label>
          <div className="key-row">
            <input
              className="input"
              type={showKey ? "text" : "password"}
              autoComplete="off"
              placeholder="sk-ant-…"
              value={state.settings.apiKey}
              onChange={(e) => set({ apiKey: e.target.value.trim() })}
            />
            <button className="chip" onClick={() => setShowKey(!showKey)}>
              {showKey ? "Dölj" : "Visa"}
            </button>
          </div>
          <p className="muted tiny">
            Nyckeln sparas bara i den här telefonen och skickas direkt till Anthropic. Den följer inte med i backupfilen. Skapa gärna en egen nyckel för appen
            med en låg månadsgräns i Claude Console.
          </p>
          <label className="label">Modell</label>
          <select className="select" value={state.settings.model} onChange={(e) => set({ model: e.target.value })}>
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="field-row">
            <span>Analysera automatiskt efter varje pass</span>
            <button className={`chip ${state.settings.autoAnalyze ? "on" : ""}`} onClick={() => set({ autoAnalyze: !state.settings.autoAnalyze })}>
              {state.settings.autoAnalyze ? "På" : "Av"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Pass</h2>
        <div className="card">
          <div className="field-row">
            <span>Vilotimer</span>
            <Stepper value={state.settings.restSeconds} step={15} unit="s" onChange={(v) => set({ restSeconds: v ?? 120 })} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Data</h2>
        <div className="card form">
          <p className="muted small">All data ligger i telefonen. Ta en backup då och då – t.ex. till iCloud Drive via Dela-menyn.</p>
          <button className="btn btn-ghost btn-block" onClick={doExport}>
            Exportera backup
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => fileRef.current?.click()}>
            Importera backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const next = importJson(await f.text(), state);
                setState(() => next);
                setMsg("Backup importerad ✓");
              } catch (err) {
                setMsg((err as Error).message);
              }
              e.target.value = "";
            }}
          />
          {msg && <p className="small">{msg}</p>}
          {confirmReset ? (
            <button className="btn btn-danger btn-block" onClick={() => setState(() => resetState())}>
              Bekräfta: radera allt och börja om
            </button>
          ) : (
            <button className="link-btn danger" onClick={() => setConfirmReset(true)}>
              Återställ appen
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
