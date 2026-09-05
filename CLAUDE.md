# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page tool for building NFL player-prop odds CSV files for import into a bookmaker's trading system. It fetches live odds from The Odds API and player/team assignments from a Supabase database, lets the user pick a game, curate players/markets, tweak prices, and export a CSV in a specific internal format ("Sifra" sheet layout with Datum/Vreme/Sifra/Domacin/Gost/1/X/2/GR/U/O/Yes/No columns).

There is no build step and no test suite. The app is a static `index.html` (Tailwind via CDN, vanilla JS, no framework/bundler) backed by Netlify serverless functions.

## Architecture

- **[index.html](index.html)** — the entire frontend: markup, styles, and all JS logic in one inline `<script>` block. No modules, no build tooling. Open it directly or serve it via Netlify dev; there's no separate frontend build.
- **[netlify/functions/](netlify/functions/)** — Netlify Functions (Node, CommonJS) act as a thin proxy/backend:
  - `get-events.js`, `get-odds.js` — proxy to The Odds API (`api.the-odds-api.com/v4`). API keys never reach the browser: `API_KEYS` env var holds a comma-separated pool, and a random key is picked per invocation (basic key rotation to spread rate limits). Both return `{ data, usageInfo }` where `usageInfo` surfaces the `x-requests-remaining`/`x-requests-used` response headers plus an obfuscated key prefix, which the frontend displays.
  - `get-players.js`, `update-players.js` — read/upsert player→team assignments in a Supabase `players` table (`SUPABASE_URL` / `SUPABASE_ANON_KEY` env vars). `update-players.js` upserts on conflict `name`.
  - Required env vars (set in Netlify, not in the repo): `API_KEYS`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- **[nfl_players.json](nfl_players.json)** — a static seed/export snapshot of player→team data. The live source of truth at runtime is Supabase (via `get-players`), not this file.

## Frontend data flow (in index.html)

1. On load, `loadNflPlayersData()` fetches player/team pairs from `/.netlify/functions/get-players`, then synthesizes extra "special" entries per team: `"{team} defensive td"` and `"{team} D/ST"` so team-level defensive markets can be added like players.
2. "Fetch Upcoming Games" calls `/.netlify/functions/get-events?sport=americanfootball_nfl`. Results are cached in `sessionStorage` (`nflEvents`) to avoid burning API quota on repeat visits.
3. Selecting a game calls `/.netlify/functions/get-odds` for that event (markets = every key in `marketsMap`, regions `us,eu`, decimal odds), also cached in `sessionStorage` (`nflOdds_<eventId>`).
4. **"Force Reload API Key"** button clears the `nflEvents`/`nflOdds_*` sessionStorage cache and re-triggers the current fetch, forcing a new random API key pick — use this to work around one exhausted key in the pool.
5. `processGameDataForBuilder()` collapses odds across bookmakers into `allPlayersData`, using a **per-market bookmaker priority list** (e.g. kicking points prefers BetMGM > Bovada > Fanatics > DraftKings > Pinnacle; sacks prefers BetOnline > FanDuel > DraftKings > Pinnacle > Caesars > BetMGM; everything else defaults to Pinnacle > Caesars > DraftKings). When changing which bookmaker's line "wins" for a market, edit the relevant priority array here.
6. Two tabs render from the same underlying data:
   - **CSV Builder** (`builder-tab-content`): pick a team + players to include, edit lines/prices inline, then Preview/Export/Reset. State lives in `selectedDataForExport` (player → array of market entries), edited in place by `handleDataChange`.
   - **All Odds** (`all-odds-tab-content`): a full comparison grid of every market/player across every bookmaker, with per-row "Add" (adds to the CSV builder) and "Dodeli tim" (assign team, for players missing a team) actions.
7. Assigning a team to a player updates local `nflPlayersData` immediately and POSTs to `update-players` to persist to Supabase; a toast confirms success.
8. CSV generation (`generateCsvData`) requires a selected team (used in the `LEAGUE_NAME` row) and a non-empty export list, then maps each market to a fixed-width row. Special-cased market name formatting lives in `formatMarketNameForCsv` (e.g. `player_anytime_td` → "Touchdown Scorers", non-total names get a "Total " prefix by default).

## Language note

UI copy is bilingual: most labels are English, but the team-assignment modal, toast, and error messages around player/team persistence are in Serbian (e.g. "Dodeli tim igraču", "Igrač je uspešno sačuvan u bazi"). Match the existing language when editing a given section rather than translating wholesale.

## Working locally

No dependencies are needed to edit/preview `index.html` directly (open it in a browser), but the Netlify functions require `netlify dev` (or equivalent) with `API_KEYS`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` set, since `index.html` calls `/.netlify/functions/*` relative paths. `package.json` only declares dependencies for the functions (`@supabase/supabase-js`, `node-fetch`); there is no lint/test/build script configured.
