# F1 Pit Wall · Engineering Dashboard

**Live site:** <https://enzoabuliak.github.io/F1PitWall/>

A real-time Formula 1 race engineering dashboard inspired by the Ferrari pit wall.
Pulls **real F1 data** from OpenF1 (live timing + telemetry) and the Ergast/Jolpica
mirror (driver & constructor championships).

## Demo data

When no Grand Prix is currently live, the dashboard falls back to the most recent
session reported by OpenF1. The header explicitly shows the session state:

- `● LIVE` — race is happening right now and timing is flowing
- `○ UPCOMING` — session is on the calendar but hasn't started
- `◼ REPLAY` — session has finished; data is the historical archive
- `○ OFFLINE` — no race state available

The screenshots and walkthrough below were captured during the
**2026 Canadian Grand Prix** at Circuit Gilles Villeneuve, Montreal
(session_key `11291`).

## Architecture

```
backend/   FastAPI + aiohttp polling layer over OpenF1 + Ergast
frontend/  Next.js 16 (App Router) + Zustand + Framer Motion + Recharts
desktop/   Native macOS .app — tiny Swift WKWebView shell around the live URL
```

## Run as a native macOS app

```bash
cd desktop
./build.sh
open "dist/F1 Pit Wall.app"
```

Produces a ~250 KB universal `.app` (arm64 + x86_64). See `desktop/README.md`
for menus, keyboard shortcuts, and how to point it at a local dev server.

### Backend (`backend/`)

- `services/openf1_service.py` — polls OpenF1 every second for timing,
  driver positions, intervals, laps, stints, and weather. Computes
  `session_status` (`live` / `upcoming` / `finished`) from the session
  date range vs UTC now.
- `services/ergast_service.py` — Ergast (via the Jolpica mirror) for
  driver & constructor championship standings and last-race results.
- `cache/memory_cache.py` — async TTL cache with background cleanup.
- `routes/live.py` — `/race-state`, `/timing`, `/telemetry/{driver}`,
  `/drivers`, `/teams`.
- `routes/championship.py` — `/drivers`, `/constructors`, `/last-race`.

### Frontend (`frontend/`)

Three pages, each subscribing to the live data hook:

- `/` — Live race dashboard: timing tower, weather widget, session header
- `/telemetry` — Driver telemetry: select a driver, see throttle / brake /
  speed / RPM area charts, gear, DRS state
- `/team` — Team dashboard: pick a team, see both drivers' telemetry side
  by side, plus constructor standing, driver championship positions,
  season wins, nationality, and the full constructor championship table

State is split across four Zustand stores: `raceStore`, `timingStore`,
`telemetryStore` (per-driver circular buffer, 60 frames), `uiStore`.

## Running

The dashboard runs in two modes:

**Static mode** — the live site at `enzoabuliak.github.io/F1PitWall` runs
entirely in the browser. The Next.js app calls OpenF1 and Ergast directly
(both serve CORS-open APIs) so no backend is needed. The static export is
built by `.github/workflows/deploy.yml` whenever `frontend/**` changes on
`main`.

**Dev mode** — a local FastAPI backend with proper caching, WebSocket
streaming, and stronger rate-limit handling. Used during development and
recommended for live races.

To run the dev backend:

### Backend

```bash
cd backend
python3.13 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001
```

API docs at <http://127.0.0.1:8001/docs>.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://127.0.0.1:8001`. Override
with `NEXT_PUBLIC_API_BASE` in `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8001
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8001/api/live/stream
```

Open <http://localhost:3000>.

## Notes

- `/intervals` returns tens of thousands of rows for a completed session;
  the polling cycle takes ~20s for an archived race vs ~1s for a live one.
  Cache TTLs (`backend/config.py`) are tuned for the live case.
- OpenF1 reports sentinel values (e.g. throttle/brake both 100%, speed 0)
  in the final telemetry frame of a session — that's the API, not the
  dashboard. Real values appear once a race is live.
- During a live race the WebSocket stream at `/api/live/stream` pushes
  updates; the frontend hook (`useLiveData`) auto-falls back to HTTP
  polling if the socket drops.

## Design

- Matte black background (`#1a1a1a`), Ferrari red accent (`#DC0000`),
  LED-style monospace green numbers (`#00ff9c`)
- Glassmorphism panels (white/5 over backdrop-blur-xl)
- Team color stripes on every driver/team chip, sourced from OpenF1
- Bento-grid layout per page
