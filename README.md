# Marta's Forecast — Starter

Starter for the Design Engineer take-home. You're building the **one screen**
Marta — who runs a kitesurfing school — uses each evening to decide tomorrow:
**run lessons or cancel.** She's an expert kiter and a layperson in meteorology.

> Read the accompanying **brief (PDF)** for the full task, Marta's rules, and
> what we evaluate. This README only covers how to run it and what's provided.

## Quick start

This project uses **pnpm** (`corepack enable`, or `npm i -g pnpm`). Node ≥ 20.19.

```bash
pnpm install
pnpm dev         # http://localhost:5173
```

Other scripts: `pnpm build`, `pnpm preview`, `pnpm lint`, `pnpm typecheck`, `pnpm format`.

## The task, in short

**There is no prescribed layout and no feature checklist.** Turn tomorrow's
forecast into a screen Marta can make a go / no-go call from in seconds, and dig
deeper when she doesn't trust it. **Cut what she doesn't need — then say what you
cut, and why, in your README.** The brief has her rules and how it's judged.

## What's provided

Import the forecast directly, or go through the mock backend for real async states:

```ts
import { forecast } from "./data";
import { loadForecast, subscribeToForecast } from "./lib/forecast";

// Initial load — drives loading / error states.
const data = await loadForecast();          // ~900ms
await loadForecast({ fail: true });         // rejects → error state

// Live feed — one model revises one field for one afternoon hour at a time.
const stop = subscribeToForecast((u) => {
  // u.modelId, u.hour, u.field, u.value — patch that one cell in place.
});
stop();                                     // call on cleanup
```

The data is **one spot, tomorrow, hour by hour (07:00–19:00)**:

- **Five atmospheric models** (`forecast.atmospheric`, keyed by model id) covering
  wind average, gust, direction, temperature, cloud and rain. They agree in the
  morning and **disagree about the afternoon**.
- **Two wave models** (`forecast.wave`) with wave height and period — they don't
  fully agree either.
- **Tide** (`forecast.tide`) as its own source, with a low that exposes the sandbar.
- A **live feed** that keeps revising the afternoon while she's watching.
- No real networking to build.

Two things you can't skip (see the brief): refresh **without the layout jumping**,
and **tell her the models disagree** about the afternoon — without teaching her
what a model is.

## Project structure

```
src/
  App.tsx              # empty shell — start here
  data/                # forecast.ts (the mock data) + types
  lib/forecast.ts      # loadForecast() + subscribeToForecast()
  styles/              # neutral starter tokens + minimal reset
```

## Notes

- Uses **pnpm**, React, TypeScript, Vite. AI tools are allowed and encouraged.
- `src/styles/tokens.css` is a small, neutral palette. The visual identity is yours.
- This is a fictional assessment, used only for candidate evaluation.
