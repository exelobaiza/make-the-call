![Make the Call — Cracken design engineer take-home](public/og.jpg)

# Make the Call

One screen for Marta, who runs a kitesurf school, to decide tomorrow: **run beginner lessons or cancel.**

- **Live:** https://make-the-call.exelobaiza.dev/
- **Design:** [Figma](https://www.figma.com/design/sYw1bToHQDlHJL3KluPpMr/make-the-call)

The brief has one line that shaped everything: *she'll cancel if she's confident; what she can't stand is being unsure at seven.* So the screen never just answers — when it can't be sure, it still tells her what to do meanwhile.

## Running it

Needs **pnpm** (`corepack enable`) and Node ≥ 20.19.

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

`pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm build`

**Two switches for the demo**, which also work on the deploy:

- `?slow` — stretches the initial load to 4s, to see the loading state.
- `?fail` — makes the load fail, to see the error state.

## What's on the screen

Read in the order she decides: **answer → what she can adjust → evidence → fine print.** A lesson window with its verdict and the action to take, the kit to load, a live row for what just changed, one card per condition, and an hour-by-hour table for when she doesn't trust the summary.

## The two things that can't be skipped

**The layout never jumps.** The feed revises something every 2.5s and nothing moves:

- Every block reserves its height from the first render (the verdict box, the live row, the cards).
- Loading is the same layout with em dashes where the numbers go — not a different skeleton — so the swap can't reflow anything.
- Numbers are monospaced, so a digit changing doesn't push its neighbours.
- "Just updated" lives in a fixed row, and the highlights are a **border colour** and an **outline**, neither of which takes space.

**It says the forecasts disagree, without teaching her what a model is.** It counts heads: «2/5 Steady · 2/5 Too gusty · 1/5 Too light», with a bar per row. Never a model name — "One forecast raised its 17:00 gusts", not "ICON". No percentages either: "2 of 5 forecasts" needs no statistics.

## What I cut, and why

The rule: **if it doesn't change tomorrow's call, it's not on the main screen.**

| Cut | Why |
|---|---|
| Model names (ECMWF, ICON…) | She doesn't care which one says what, only how many agree. The brief says not to teach her what a model is. |
| Rain and cloud | They don't change the call. Said once, in the footer. |
| Spot and day pickers | One school, one beach, one question: tomorrow. |
| Custom hour ranges | The three windows come from where conditions actually change (the tide closes midday, the forecasts split in the afternoon). Less freedom, one click to the answer. |
| Percentages and probabilities | "2 of 5 forecasts" is understood without statistics. |
| Wave period on the card | Doesn't change the call for beginners. Stays in the table as reference. |
| Showing stale data on error | A stale GO is more dangerous than no screen, so the error state shows nothing rather than an old forecast. |
| Toasts, push, change history | A toast covers or pushes. The live row says what changed in a fixed place, which is what the no-jump rule allows. |

## Assumptions

The brief gives some thresholds and leaves others open. All of them live in [`src/domain/rules.ts`](src/domain/rules.ts), each marked as *brief* or *mine*:

| Rule | Value | Source |
|---|---|---|
| Wind range for a lesson | 12–25 kn | brief |
| Gust gap that makes it unteachable | 10 kn over the average | **mine** — the brief says the gap matters more than either number, not where the line is. Conservative for beginners; one number to change in `rules.ts`. |
| Wave limit | 1 m | brief |
| Low tide closes the lesson zone | under 0.5 m | **mine** — the brief says the sandbar shows at low tide, not at what height |
| The beach faces | west (270°) | **mine** — spot setting |
| Direction | within 70° of onshore passes, 70–90° is borderline, beyond that it blows offshore | **mine** |
| Full wetsuit | under 16 °C | threshold **mine**; the brief asks for the wetsuit call |
| Kite size | by gust midpoint, ~75 kg rider, one size down under 15 °C | **mine** |
| Recheck time | 10:00 | **mine** — when the morning runs update, the afternoon is clearer |

Two more judgement calls worth stating:

- **Missing data is never a GO.** An hour with no forecasts, a missing tide reading or an empty window all come out as UNSURE. Absence of evidence isn't evidence that it's fine.
- **Tide is a fact, not a forecast.** There are no models disagreeing about it, so it's never "unsure" — only if the reading is missing.

Some copy is derived rather than taken from the Figma: the reasons under each window, the explanations behind each table row label, and the live-update sentences. They're all built from the rules, so changing a threshold rewrites them too.

## How it's built

Four layers — `source/` (the mock today, an API or socket tomorrow, behind one interface in [`src/source/types.ts`](src/source/types.ts)), `domain/` (pure functions that decide and word the decision), `state/` (one hook that loads, subscribes and compares verdicts) and `components/` (draw, nothing else). The verdict is derived, never stored, so it can't disagree with the data. Nothing assumes this dataset: forecasts are counted, not fixed at five, and there's a test against a smaller one. **35 tests** on the domain and the reducer.

## Accessibility

- Native elements first: `<button>`, a real `<table>` with `scope` on its headers.
- The tide curve is `role="img"` with a sentence describing the day, built from the same data that draws it.
- Only the "what changed" text is a live region; the clock stays outside it so it doesn't announce every second.

## Time

About 6 hours, spread over three days (~2h a day). The build itself fit roughly in the suggested 3–4; the rest went into research and into trying different options and scenarios for Marta before settling on this one.

## Known gaps

- URL state (`?window=afternoon`) for shareable links and a working back button. First thing I'd add.
- Keyboard focus isn't trapped inside the mobile drawer.
- Tests cover the domain and the reducer; the hook's effects (cancelled loads, subscription cleanup) would need Testing Library with a fake source.
- `?slow` and `?fail` are read once, at load.
