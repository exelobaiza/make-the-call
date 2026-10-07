# Make the Call

One screen for Marta, who runs a kitesurf school, to decide tomorrow: **run beginner lessons or cancel.**

- **Live:** TODO_DEPLOY_URL
- **Design:** [Figma](https://www.figma.com/design/pjaw6bujRb0oqvBYU3yJIn/make-the-call?node-id=1-5)

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

Read in the order she decides: **answer → what she can adjust → evidence → fine print.**

1. **A lesson window** (morning, midday, afternoon). Each one shows its own verdict and a one-line reason before she picks it, so she can see the alternative without opening anything.
2. **The verdict** — the action first («Book the morning · recheck tomorrow 10:00»), then the word and the single number that decides it («UNSURE · wind 9–20 gusting 31»), then the four gates (direction, tide, waves, wind), then the kit to load.
3. **One hour at a time**, if the window-level answer isn't enough.
4. **A live row** that says what just changed and whether it changes the call.
5. **Cards** — tide (with the curve), waves, wind, air — in the order the gates are checked.
6. **An hour-by-hour table** with every forecast, for when she doesn't trust the summary.

## The two things that can't be skipped

**The layout never jumps.** The feed revises something every 2.5s and nothing moves:

- Every block reserves its height from the first render (the verdict box, the live row, the cards).
- Loading is the same layout with em dashes where the numbers go — not a different skeleton — so the swap can't reflow anything.
- Numbers are monospaced, so a digit changing doesn't push its neighbours.
- "Just updated" lives in a fixed row, and the highlights are a **border colour** and an **outline**, neither of which takes space.
- The one place this got interesting: between 601px and 833px the long "what changed" sentence wraps to two lines, which would make the row change height between revisions. That range uses the short wording instead.

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
| Editing the rules in the UI | They live in one file (`domain/rules.ts`); changing one is changing a number. A settings screen is a different product. |
| Wave period on the card | Doesn't change the call for beginners. Stays in the table as reference. |
| Showing stale data on error | A stale GO is more dangerous than no screen: *"Nothing is shown rather than an old forecast."* |
| Toasts, push, change history | A toast covers or pushes. The live row says what changed in a fixed place, which is what the no-jump rule allows. |
| URL state (`?window=afternoon`) | A real improvement — shareable links, working back button — but not a priority in the budget. First thing I'd add. |

## Assumptions

The brief gives some thresholds and leaves others open. All of them live in [`src/domain/rules.ts`](src/domain/rules.ts), each marked as *brief* or *mine*:

| Rule | Value | Source |
|---|---|---|
| Wind range for a lesson | 12–25 kn | brief |
| Gust gap that makes it unteachable | 10 kn over the average | **mine** — the brief says the gap matters more than either number, not where the line is. Conservative for beginners; Marta can raise it. |
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

Four layers, each one only talking to the next:

```
source/     an adapter — today the mock, tomorrow an API or a socket
domain/     pure functions: data in, decisions and the words for them out
state/      one hook: loads, subscribes, applies revisions, compares verdicts
components/ draw, and nothing else
```

The verdict is **derived state**: it's never stored, it's computed from the data, so it can't say GO while the data says NO-GO. Live revisions go through a reducer that applies one cell immutably and compares the three windows' verdicts before and after — that's where "Still unsure." vs "Afternoon is now a no-go." comes from.

**35 tests** on the domain and the reducer (`pnpm test`): the three windows, the edge of every threshold, a smaller dataset, what the live row says, and the tide chart's geometry.

### Switching to a real API

One file. [`src/source/types.ts`](src/source/types.ts) is the whole contract:

```ts
export interface ForecastSource {
  load(): Promise<Forecast>;
  subscribe(onUpdate: (update: ForecastUpdate) => void): Unsubscribe;
}
```

Write an adapter that fetches and maps the response to `Forecast`, opens a WebSocket in `subscribe`, and change one line in `App.tsx`. Nothing in `domain/`, `state/` or `components/` knows the difference. At that point I'd add zod validation at the boundary, reconnection with backoff, and sequence numbers to drop out-of-order updates.

### Not tied to this dataset

Nothing counts to five. The screen counts whatever forecasts it gets — seven models say "4/7" — windows are resolved by hour label against the data, lookups are by hour and never by position, and the tide curve scales from the day's own maximum. There's a test running everything against a smaller dataset (3 atmospheric models, 1 wave model, fewer hours).

## Accessibility

- Native elements first: `<button>`, `<table>` with `scope` on its headers. The window picker is a disclosure with real buttons, not a hand-rolled listbox — a correct ARIA listbox needs roving tabindex and arrow keys, and `role="option"` on a button inside an `li` is invalid anyway.
- The status icons are decorative; each gate carries its state as text for screen readers ("Direction passes").
- The tide curve is `role="img"` with a sentence describing the day: *"Tide: 2.5 m at 07:00, low of 0.3 m at 13:00… Lesson zone closed under 0.5 m, around 12:00 to 14:00."* Built from the same data that draws it.
- Only the "what changed" text is a live region. The clock is deliberately outside it, so it doesn't announce every second.
- Dark mode follows the system; it's the same tokens with different values, no JavaScript.

## Time

TODO_TIME_SPENT

## Known gaps

- Keyboard focus isn't trapped inside the mobile drawer.
- Tests cover the domain and the reducer; the hook's effects (cancelled loads, subscription cleanup) would need Testing Library with a fake source. First test debt I'd pay.
- `?slow` and `?fail` are read once, at load.
