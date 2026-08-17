# Holo Hele — Project State

Last updated: 2026-08-16

## Project overview

Holo Hele is a mobile-first redesign prototype for finding and understanding Oʻahu public transit. It currently demonstrates onboarding, nearby stops, stop arrivals, route and vehicle maps, saved transit information, schedules, service-alert presentation, and a simulated trip-planning flow. It runs as a responsive web app and can also be packaged in a Tauri 2 desktop shell.

## Tech stack

- **Framework:** React 19 with Vite
- **Language:** TypeScript
- **Runtime/API server:** Bun
- **Styling:** Tailwind CSS 4 utilities, shared CSS variables in `src/styles.css`, and Inter fonts
- **Maps:** Leaflet and React Leaflet with CARTO Light tiles/OpenStreetMap attribution
- **State management:** React state and TanStack Query
- **Routing:** TanStack Router with file-based routes
- **Transit APIs:** TheBus official GTFS feed; optional TheBus HEA arrivals and vehicle endpoints
- **Desktop packaging:** Tauri 2 with Rust
- **Testing/tooling:** Playwright, ESLint, and TypeScript

## Current app structure

The React client lives in `src/` and `components/`. File routes render pages; reusable UI lives under `components/`. `lib/` contains API calls, persistence, TheBus integration, and mock fixtures. `server/index.ts` exposes a read-only Bun API, while `server/gtfs.ts` indexes official GTFS data in memory. Shared types are in `types/transit.ts`, and `src-tauri/` contains the desktop wrapper.

## Implemented features

- **Onboarding** — A timed landing screen advances to language selection and optional location permission. Choices persist locally.
- **Nearby stops** — Uses device coordinates or downtown Honolulu as fallback. It shows ten official GTFS stops; an HEA key enriches up to four with live arrivals.
- **Stop details** — Loads a bundled preview stop or any stop available from GTFS, displays lines and arrivals, distinguishes scheduled from estimated times, and refreshes live arrivals every 30 seconds.
- **Vehicle tracking** — For live arrivals, combines HEA vehicle data with a GTFS trip sequence, route geometry, remaining stop markers, approach line, and stops-away information. Live tracking refreshes every 15 seconds and includes loading/error states.
- **Route details** — The Hawaiʻi Kai Route 1L example loads an official GTFS trip, shape, stops, and times. Other route URLs show a preview-unavailable state.
- **Schedules** — Favorite stop and bus flows can open official GTFS daily departures for today or tomorrow and choose a line. Times are scheduled, not live estimates.
- **Favorites** — Saved buses and curated stops have searchable Buses/Stops tabs, filled-heart saved states, context-aware back navigation, and local persistence.
- **Rider alerts** — An in-app page and contextual Route 1L alert use a static demonstration fixture.
- **Search** — Categorizes buses, stops, and places from curated preview records.
- **Trip planning and guidance** — Route options, directions, and live-direction screens form a complete demonstrational UI flow; journey routes and timing are simulated.
- **Settings** — Persists language/location preferences and links to TheBus resources, legal pages, and rider alerts.

## User flows

### Onboarding

Landing splash → choose language → allow or decline location → Home map.

### Familiar trip

Nearby map or favorite stop → stop arrivals → select a trackable live arrival → vehicle tracking map.

### Search by route

Search → select Hawaiʻi Kai Route 1L → official GTFS route map and complete scheduled stop sequence.

### Saved transit and schedules

Favorites → bus or stop → choose Schedule/line → view today’s departures; an ended bus service can open tomorrow’s schedule.

### Unfamiliar trip preview

Search for a curated place → simulated journey options → directions → simulated live guidance.

### Disrupted trip preview

Favorite Route 1L or its bus page → detour indicator → in-app rider-alert details.

## Data sources

### TheBus official GTFS

Provides stops, routes, trips, stop times, calendars, shapes, and scheduled service. It is downloaded from `thebus.org` on first use and cached for the server process. It powers nearby stops, scheduled arrivals, route details, tracking stop sequences, and daily schedules. It is scheduled—not live—and has no timed refresh.

### TheBus HEA API

Provides estimated arrivals and vehicle positions when `THEBUS_API_KEY` is configured. It supports stop details, nearby-stop enrichment, and tracking. Without it, the app uses official scheduled GTFS data. HEA does not provide disruptions here.

### CARTO Light / OpenStreetMap

Provides basemap tiles. Transit markers and overlays come from Holo Hele data.

### Browser geolocation

Provides rider coordinates after permission; otherwise maps use a fixed downtown Honolulu center.

## Live data vs mock data

### Live

- HEA arrivals and vehicle locations, only when a valid server-side API key is configured.
- Browser geolocation while permission is enabled and the app is open.

### Scheduled official data

- GTFS nearby stops, route shapes, stop sequences, service calendars, stop times, and today/tomorrow schedules.

### Mock / prototype

- Route 1L detour alert in `lib/mock/service-alerts.ts`.
- Search bus/place records and all journey options/timings in `lib/mock/journeys.ts`.
- Favorite bus definitions in `lib/mock/favorites.ts`.
- Deterministic tracking arrivals, positions, and stop sequences used when directly exercising known mock fixture IDs without an HEA key.

### Hybrid

- Nearby stops always originate from GTFS; with an HEA key, only the closest four are enriched with HEA arrivals. A failed HEA request retains scheduled data and reports that results may be incomplete.
- Live tracking uses HEA for the selected vehicle and GTFS for route shape/stop order. If GTFS matching fails, the UI does not invent named live stops.

## Favorites

Stops can be toggled from stop detail, and the four predefined bus favorites can be toggled from their bus pages. IDs are stored under separate `localStorage` keys and persist in the same browser and origin; there is no account or cross-device synchronization. Default preview favorites appear only while a storage key is uninitialized, so removing all items remains persistent.

The Favorites screen and empty-query Search screen consume saved stops. Bus detail and schedule flows consume saved bus definitions. A dynamically loaded GTFS stop ID can be stored, but the Favorites list currently resolves only the curated stops in `lib/thebus/stops.ts`, so other saved stops may not appear.

## Alerts and disruptions

The app has one static Route 1L “Detour in effect” fixture. It is matched by preview bus ID, appears in Favorites and on the bus page, and opens `/alerts` with affected line, stop, and rider guidance. No live alert feed, update polling, expiration logic, or alternative-route calculation exists. The presentation copy is realistic for demonstrations, but the source is explicitly marked preview-only in code.

## Notifications

Notifications are not implemented. There is no native Tauri notification plugin, browser Notification/Push API usage, permission flow, service worker, backend device-token store, event trigger, or test-notification control. The app cannot notify riders while open, backgrounded, or closed.

## Important UX decisions

- Live estimated arrivals and scheduled GTFS times use different icons and color rules; green is reserved for near-term live estimates.
- Live stop arrivals refresh automatically every 30 seconds, and tracking refreshes every 15 seconds.
- Search presents buses, stops, and places together, while clearly labeling trip planning as simulated.
- Route names use exact normalized values so Route `1` and Route `1L` remain distinct.
- Important map information also appears in text-based sheets or lists.
- Service disruptions are surfaced in the rider’s saved context instead of changing real arrival times.
- The visual language follows `DESIGN.md`: mobile-first, flat surfaces, shared tokens, Inter typography, and restrained transit blue.

## Important files

- `DESIGN.md` — canonical design and interaction rules
- `src/router.tsx` and `src/routes/` — route registration and page flows
- `src/styles.css` — design tokens and global responsive/map styles
- `components/home/HomeScreen.tsx` — home map, nearby stops, and selected-stop state
- `components/stops/StopDetailScreen.tsx` — arrivals and live refresh behavior
- `components/tracking/TrackingScreen.tsx` — tracking queries, location, carousel, and states
- `src/routes/favorites.tsx` — saved buses/stops UI
- `src/routes/schedule.tsx` — today/tomorrow GTFS schedule flow
- `lib/favorites.ts` and `lib/onboarding.ts` — local persistence
- `lib/api/transit.ts` — browser-to-Bun API client
- `lib/thebus/client.ts` — HEA arrivals and vehicle client
- `server/index.ts` and `server/gtfs.ts` — API endpoints and GTFS indexing
- `lib/mock/` — clearly separated demonstration fixtures
- `types/transit.ts` — shared data contracts

## Persistence

`localStorage` stores onboarding completion, selected language, location preference, favorite stop IDs, and favorite bus IDs. Storage is per browser and origin; `localhost`, `127.0.0.1`, and a LAN address do not share it. TanStack Query data is memory-only. The GTFS index is memory-only on the Bun server. There is no database, login, IndexedDB store, offline cache, or persisted alert/notification state.

## Demo functionality

- Open `/buses/1l-437` or the Route 1L favorite to demonstrate a contextual detour and in-app alert details.
- Open `/routes/1l-hawaii-kai` to demonstrate the official scheduled Hawaiʻi Kai route map and stop sequence.
- Search for “Ala Moana” and continue through Plan Trip to demonstrate simulated directions and live guidance.
- With no HEA key, known fixture URLs such as `/stops/1280/track/mock-1280-a1` exercise mock tracking directly.
- Clearing the two favorites storage keys restores the seeded favorite buses and stops.

## Known limitations

- No production service-alert source or push notifications.
- Trip planning, place search, directions, and guidance are simulated and limited to curated fixtures.
- Route detail is implemented only for the Hawaiʻi Kai Route 1L preview.
- Search uses five curated stops, two buses, and three places rather than full GTFS/geocoding search.
- Favorites do not sync across browsers/devices, bus favorites are preset-only, and non-curated saved stops may be hidden.
- HEA live enrichment is limited to the four closest nearby stops.
- GTFS is cached for the lifetime of the API process and is not refreshed on a timer.
- Selecting another language persists the preference but does not translate the current English interface.
- Location and live updates work only while the app is running and depend on permissions/connectivity.
- The repository contains desktop Tauri packaging, but no verified production mobile release workflow.

## Current bugs / issues

- Playwright smoke tests cannot currently run because the expected Chromium binary is not installed; run `bun x playwright install chromium` first.

## Next priorities

1. Connect and clearly attribute a production service-alert source.
2. Decide notification use cases, permission timing, delivery platform, and backend before implementing push notifications.
3. Replace simulated search/trip planning with full GTFS search plus a real routing/geocoding service.
4. Generalize route details and bus favorites beyond the current curated examples.
5. Make favorites resolve arbitrary GTFS stops and add account sync only if cross-device persistence is required.
6. Install the Playwright browser and update stale smoke-test assertions.

## Recent changes

### 2026-08-16

- Added this verified project-state snapshot.
- Updated the Settings smoke test to match the intentionally removed Reset onboarding control.
- Added official next-day GTFS schedule loading and preserved the selected day through line selection.
- Documented the current alert, favorites, location, and notification boundaries.

### 2026-08-14

- Completed the Favorites buses/stops flow, local favorite persistence, bus detail pages, line selection, and official daily schedules.
- Added the contextual Route 1L demonstration disruption and in-app Rider Alerts screen.

### 2026-07-17

- Created the initial Holo Hele prototype commit.
- Subsequent working-tree changes migrated the client from Next.js to Vite/TanStack Router with a Bun API and Tauri shell, and expanded maps, tracking, onboarding, settings, search, and route flows.

## Notes for future developers / AI

- Treat `DESIGN.md` as the visual source of truth and reuse its tokens/components.
- Never label GTFS scheduled times as live or modify real arrival data to support demo alerts.
- Keep HEA credentials server-side; production clients should use `VITE_API_BASE_URL` to reach the deployed Bun API.
- Route comparisons must preserve exact identities such as `1` versus `1L`.
- Keep mock data under `lib/mock/` and visibly separate simulated product flows from production sources.
- Update only the affected sections of this file after meaningful feature or architecture changes, and append a dated Recent changes entry.
