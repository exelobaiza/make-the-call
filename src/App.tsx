import { useMemo, useState } from "react";
import { cardForChange } from "./domain/change";
import type { GateKey } from "./domain/types";
import { tableRows } from "./domain/tableRows";
import { buildView } from "./domain/view";
import { WINDOWS, windowForHour, type WindowKey } from "./domain/windows";
import { AirCard } from "./components/AirCard";
import { ErrorState } from "./components/ErrorState";
import { ForecastTable } from "./components/ForecastTable";
import { HourStrip } from "./components/HourStrip";
import { Header, type Mode } from "./components/Header";
import { StatusRow } from "./components/StatusRow";
import { TideCard } from "./components/TideCard";
import { WavesCard } from "./components/WavesCard";
import { WindCard } from "./components/WindCard";
import { Verdict } from "./components/Verdict";
import { VerdictLoading } from "./components/VerdictLoading";
import { WindowPicker } from "./components/WindowPicker";
import { mockSource } from "./source/mockSource";
import { useForecast } from "./state/useForecast";

export default function App() {
  const forecast = useForecast(mockSource);
  // UI state: what Marta picked. It has nothing to do with the forecast's lifecycle.
  const [mode, setMode] = useState<Mode>("summary");
  const [windowKey, setWindowKey] = useState<WindowKey | null>(null);
  const [hour, setHour] = useState<string | null>(null);

  const data = forecast.status === "ready" ? forecast.data : null;
  // Marta's choice wins; until she makes one, the window the data suggested at load.
  const key = windowKey ?? (forecast.status === "ready" ? forecast.suggestedWindow : WINDOWS[0].key);
  // Everything on screen is computed from the data. Memoised so a repeated
  // update — same data by reference — doesn't recompute it.
  const view = useMemo(() => (data ? buildView(data, key, hour) : null), [data, key, hour]);
  // Only built when the table is on screen: it evaluates all 13 hours.
  const table = useMemo(
    () => (data && mode === "table" ? { rows: tableRows(data), hours: data.hours } : null),
    [data, mode],
  );

  const change = forecast.status === "ready" ? forecast.lastChange : null;
  const changed = cardForChange(change);
  /**
   * A card lights up only if the revision landed on an hour that is on screen.
   * The feed revises afternoon hours; while Marta is looking at the morning,
   * none of the numbers she can see moved, so nothing should blink at her.
   */
  const onScreen = (h: string) =>
    hour === null ? (view?.hours.some((shown) => shown.hour === h) ?? false) : hour === h;
  const freshAt = (card: "wind" | "waves") =>
    change !== null && changed === card && onScreen(change.hour) ? change.at : null;

  /** The gate that explains the verdict paints its card's border with the status colour. */
  const deciding = (...gates: GateKey[]) =>
    view && gates.includes(view.verdict.deciding) ? view.verdict.status : null;

  function pickWindow(next: WindowKey) {
    setWindowKey(next);
    setHour(null);
  }

  /** From the tide curve: the hour carries its window with it. */
  function pickHour(next: string) {
    const window = windowForHour(next);
    if (window !== null) setWindowKey(window);
    setHour(next);
  }

  return (
    // Frame 115:2 (wide 1600): the content caps at 1320 and centres, so the
    // outer box — padding included — stops at 1400.
    <div className="mx-auto max-w-[1400px] px-4 pb-10 tablet:px-10">
      <Header status={forecast.status} mode={mode} onMode={setMode} />

      <main className="mt-3 tablet:mt-4">
        {forecast.status === "error" ? (
          <ErrorState onRetry={forecast.retry} />
        ) : (
          <section className="border border-border-default bg-surface-card p-4 tablet:p-6">
            <h2 className="meta pb-[6px]">Tomorrow · lesson window</h2>
            <WindowPicker options={view?.windows ?? []} value={key} onChange={pickWindow} />
            {view ? <Verdict view={view} /> : <VerdictLoading />}

            {view ? (
              <>
                <h2 className="meta mt-4">Check a single hour</h2>
                <HourStrip hours={view.hours} selected={hour} onSelect={setHour} />
              </>
            ) : null}

            <StatusRow
              loading={forecast.status === "loading"}
              lastUpdateAt={forecast.status === "ready" ? forecast.lastUpdateAt : null}
              lastChange={forecast.status === "ready" ? forecast.lastChange : null}
              windowKey={key}
            />
          </section>
        )}

        {view && table ? (
          <section className="mt-3 border border-border-default bg-surface-card p-4 tablet:p-6">
            <ForecastTable
              rows={table.rows}
              hours={table.hours}
              highlight={hour === null ? view.hours.map((h) => h.hour) : [hour]}
              lastChange={forecast.status === "ready" ? forecast.lastChange : null}
              forecasts={view.cards.wind.agreement.n}
            />
          </section>
        ) : null}

        {view && mode === "summary" ? (
          <>
            <section className="mt-3 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
              <TideCard tide={view.cards.tide} deciding={deciding("tide")} onPickHour={pickHour} />
              <WavesCard
                waves={view.cards.waves}
                deciding={deciding("waves")}
                freshAt={freshAt("waves")}
              />
              <WindCard
                wind={view.cards.wind}
                deciding={deciding("wind", "dir")}
                freshAt={freshAt("wind")}
                onSeeHours={() => setMode("table")}
              />
              <AirCard air={view.cards.air} />
            </section>

            <p className="mt-4 text-[12px] text-text-tertiary">
              Rain and cloud are left out: they don't change the call. Storms aren't in this data, so
              check the radar on the day.
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
