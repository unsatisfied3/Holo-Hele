# Trip Guidance Reliability Plan

Target: make the Holo Hele **Trip Guidance** flow (`/live-directions/$journeyId`) behave as dependably as Google Maps or Moovit transit navigation for a direct walk–bus–walk trip, within the limits of a foreground web/Tauri app.

Audience: an autonomous coding agent (Codex) working in `c:\Users\t0403\Desktop\HoleHele`.

Last updated: 2026-09-03

---

## 0. How to use this document

1. Read `AGENTS.md`, `DESIGN.md`, and the **Trip planning and guidance** and **Known limitations** sections of `PROJECT_STATE.md` before touching code.
2. Work **one phase at a time, in order**. Each phase ends with a green run of `bun run lint`, `bun run typecheck`, `bun run test:unit`, and the focused Playwright test named in that phase. Do not start the next phase with a red build.
3. Every phase has **Acceptance criteria**. Treat them as the definition of done. Do not claim a criterion is met unless you ran the check.
4. Do not redesign approved screens. Every new UI state in this plan reuses the existing Trip Guidance card, status rows, stage dots, and bottom action bar. New copy goes through `t()` in `lib/i18n.ts` with English and Japanese entries.
5. Never fabricate live data. Anything derived from the schedule or from inference must be labeled with the existing scheduled/estimated vocabulary and icons (`ScheduleIcon` vs `liveSignal`).
6. Keep mock and replay fixtures under `lib/mock/` or a `fixtures/` directory next to their tests, technically isolated from production responses.
7. After each phase, append a dated entry to **Recent changes** in `PROJECT_STATE.md` and update the affected feature/limitation bullets. Keep the edit surgical.
8. If a step is ambiguous, prefer the simplest interpretation that satisfies the acceptance criteria, and note the assumption in your end-of-phase summary.

Commands:

```bash
bun run lint
bun run typecheck
bun run test:unit          # add new test files to this script in package.json
bun run test:smoke         # or: bunx playwright test tests/smoke.spec.ts -g "guidance"
bun run dev                # web on :1420, API on :3001
```

---

## 1. What "as reliable as Google Maps / Moovit" means here

Google Maps and Moovit reach their reliability through four things: (a) a robust state machine that never gets stuck, (b) heavy filtering and map-matching of noisy position data, (c) continuous vehicle tracking with schedule-based fallback when live data drops, and (d) recovery paths for every predictable failure (missed bus, wrong bus, missed stop, off-route walk, app backgrounded).

They also rely on things this app **cannot** have on the web: background location, native activity recognition, fused sensors, and fleet-scale telemetry. Those remain out of scope and are documented in section 9.

### 1.1 Reliability targets (measurable)

All targets are evaluated against the **deterministic replay scenarios** defined in Phase 1, plus a field-test protocol in Phase 5.

| ID | Target | How measured |
|----|--------|--------------|
| R1 | Zero false automatic transitions (walk→wait, wait→onboard, onboard→final walk) in every noisy or adversarial replay scenario. | Unit replay tests |
| R2 | Correct automatic transition within 20 s of the true event in the clean scenario, and within 45 s in the noisy scenario. | Unit replay tests |
| R3 | Onboard stop index never decreases and never skips more than one stop per update unless the vehicle position proves it. | Unit replay tests |
| R4 | Live vehicle continues to be tracked after the bus leaves the boarding stop, through every intermediate stop, until alighting. | Unit + Playwright with mocked API |
| R5 | Total loss of GPS, total loss of HEA, or both, never blanks the card; guidance degrades to labeled scheduled progression and recovers automatically when data returns. | Unit replay + Playwright |
| R6 | Refreshing the page, backgrounding the tab for 5 minutes, or reopening the same journey resumes the same stage and stop index. | Playwright |
| R7 | Missed bus, wrong bus, missed stop, and off-route walking each produce a specific recovery state with an actionable button within 30 s of detection conditions being met. | Unit replay + Playwright |
| R8 | Every automatic decision exposes a confidence level (`high` / `medium` / `low`) that the UI reflects with the existing scheduled/estimated vocabulary. | Unit |

---

## 2. Current implementation and the specific weaknesses to fix

Files that power the flow today:

- `src/routes/live-directions.$journeyId.tsx` — the whole guidance page: location watch, arrivals polling, all transition effects, and rendering, in one 775-line component.
- `lib/trip-guidance.ts` — pure helpers: `boardingProximity`, `nearestStopIndex`, `nextStopProgressIndex`, `hasLikelyBoardedBus`, `hasReachedAlightingStop`, `getOffAlertCopy`, `stopsRemaining`, `roundedWalkingDistance`.
- `lib/trip-guidance.test.ts` — 5 unit tests for those helpers.
- `components/directions/DirectionsMap.tsx` — Leaflet map; `nearestPathIndex` / `remainingPathFromPosition` do naive nearest-vertex matching.
- `server/index.ts` — `/api/arrivals`, `/api/tracking`, `/api/trip-plan`, `/api/walking-directions`. No vehicle-by-number endpoint is exposed to the client.
- `lib/thebus/client.ts` — `fetchStopArrivals`, `fetchVehicleLocation` (exists but only used by `/api/tracking`).
- `server/gtfs.ts` — `getGtfsTripPlan` already returns `rideStopSequence` and a sliced `path.transit` shape.
- `types/transit.ts` — `JourneyOption`, `TheBusArrival`, `JourneyStop`.
- `tests/smoke.spec.ts` — "search flows through trip options, directions, and live guidance" drives the flow with `setGeolocation`.

Concrete defects found in the code (fix these; they are the cheapest reliability wins):

| # | Defect | Where | Why it matters |
|---|--------|-------|----------------|
| D1 | Vehicle tracking only comes from `/api/arrivals?stop=<boardStop>`. Once the bus departs, HEA stops listing that trip at that stop, so `refreshedVehicleLocation` becomes `undefined` for the rest of the ride and progress silently falls back to raw rider GPS. | `live-directions.$journeyId.tsx` lines 223–253 | Breaks R4. This is the single biggest gap versus Google/Moovit. |
| D2 | The boarding-stop dwell `setTimeout` is inside an effect whose deps include `riderLocationAccuracy`. Every GPS update with a different accuracy value clears and re-arms the 3.5 s timer, so with a 1 Hz GPS the timer may never fire. | lines 281–302 | Automatic walk→wait can never happen on a real device. |
| D3 | `boardingEvidenceSamples` increments once per **render** in which `likelyBoarded` is true, not once per new sample; two renders from unrelated state changes can satisfy the 2-sample requirement. | lines 312–329 | Risk of false boarding (R1). |
| D4 | Stop progression uses nearest-stop distance (`nearestStopIndex`) rather than along-route progress. Routes that loop, U-turn, or have paired stops across the street cause ambiguous matches. The `+1` clamp hides but does not fix it. | `lib/trip-guidance.ts` `nextStopProgressIndex` | R3. |
| D5 | Speed from `position.coords.speed` is not sanity-checked; derived speed uses raw consecutive fixes without accuracy weighting, so a GPS jump reads as 20 m/s. | lines 184–196 | False boarding and false progress. |
| D6 | No timestamp/staleness handling for the vehicle position. A 90-second-old HEA position is treated as current. | whole component | Wrong "get off" timing. |
| D7 | No persistence. Refresh or navigation loses stage, stop index, and evidence. Page Visibility is ignored, so throttled timers after backgrounding produce stale decisions. | whole component | R6. |
| D8 | No recovery states: missed bus, wrong bus, missed stop, off-route walking. | whole component | R7. |
| D9 | `journey.tripId` matching depends on `arrival.estimated === true`; scheduled entries for the same trip are ignored, so a temporarily unestimated arrival is treated as "vehicle unavailable" instead of "scheduled". | line 240 | Flicker between live and scheduled labels. |
| D10 | Effects, refs, and state for the algorithm are interleaved with JSX. It is not unit-testable and cannot be replayed. | whole component | Blocks all measurable verification. |

---

## 3. Target architecture

Keep the same routes, components, and visual design. Move the decision logic out of React into a pure, replayable engine.

```
lib/trip-guidance/
  index.ts              re-exports everything (keeps `@/lib/trip-guidance` imports working)
  proximity.ts          current lib/trip-guidance.ts contents, unchanged API
  geometry.ts           projectOntoPath, alongTrackMeters, crossTrackMeters, stopProgressMarks
  signals.ts            RiderSample/VehicleSample types, filterRiderSample, deriveSpeed, isStale
  machine.ts            GuidanceState, GuidanceEvent, reduceGuidance(state, event, journey, config)
  config.ts             all thresholds and durations in one typed object with documented defaults
  copy.ts               getOffAlertCopy + all status-copy selectors (pure, return i18n keys + values)
  persistence.ts        save/load GuidanceState for a journey id in sessionStorage
  replay.ts             runReplay(journey, fixture, config) -> GuidanceTrace  (used by tests and dev replay mode)
  fixtures/             *.json replay scenarios (see Phase 1)
  machine.test.ts, geometry.test.ts, signals.test.ts, replay.test.ts
lib/hooks/
  useGuidanceEngine.ts  React adapter: owns the reducer, location watch, polling, visibility, persistence
src/routes/live-directions.$journeyId.tsx
                        rendering only; reads `engine.state` and dispatches manual events
server/index.ts         + GET /api/vehicle?num=&trip=   (new)   + /api/arrivals unchanged
lib/api/transit.ts      + fetchVehicle(vehicleNumber, tripId)
types/transit.ts        + VehiclePositionResponse, JourneyStop.shapeDistanceMeters (optional)
```

Principles:

- **Pure reducer.** `reduceGuidance` takes `(state, event)` and returns a new state. No timers inside. Time enters only through `event.timestamp` and `tick` events. Every automatic transition is therefore replayable and unit-testable.
- **Evidence over instants.** Transitions are decided from short histories (rolling windows of samples), never from a single reading.
- **Along-track, not nearest.** All progress along the bus ride is measured as meters along `journey.path.transit`, with each `rideStopSequence` stop projected to a mark on that line.
- **Graceful degradation ladder.** For each piece of information the engine records its source: `live-vehicle` → `rider-gps` → `scheduled`. The UI labels accordingly.
- **Manual always wins.** Any manual action sets the stage with `confidence: "manual"` and suppresses contradictory automatic transitions for a cooldown.

---

## 4. Phase 0 — Quick fixes and instrumentation (½ day)

Goal: remove the defects that make the current flow fail on a real device, without changing structure yet.

Steps:

1. **D2** — Replace the `setTimeout` dwell with a timestamp. Store `atStopSince` (ms) in a ref when `boarding.state === "at-stop"` and accuracy ≤ 100; clear it when the state leaves `at-stop`. On each location update, if `Date.now() - atStopSince >= BOARDING_STOP_DWELL_MS`, transition. Apply the same to the alighting dwell.
2. **D3** — Count boarding evidence only when a **new** rider sample arrives (compare `position.timestamp` to the last counted timestamp).
3. **D5** — Reject `position.coords.speed` when it is `null`, `NaN`, negative, or > 35 m/s. When deriving speed from consecutive fixes, ignore pairs where the summed accuracy exceeds the distance moved (i.e., the movement is within noise).
4. **D9** — When looking for `journeyArrival`, match on `arrival.trip === journey.tripId` first, then prefer the `estimated` entry if several exist. Expose whether the matched arrival is estimated so the status row can say "Scheduled" instead of "Vehicle position unavailable".
5. Add a dev-only debug line under the status rows (render only when `import.meta.env.DEV && search.debug === "1"`) showing: rider accuracy, rider speed, vehicle age, boarding state, evidence count, stop index. This is for field testing and is removed from production builds by the `DEV` guard.

Acceptance criteria:

- `bun run test:unit`, `lint`, `typecheck` pass; Playwright "search flows through trip options, directions, and live guidance" still passes.
- Manual test in the in-app browser with Chrome DevTools Sensors: set location at the board stop, keep it there with tiny jitter for 5 s, and confirm the automatic switch to **Wait for**.

---

## 5. Phase 1 — Pure guidance engine, replay harness, and scenario fixtures (2–3 days)

Goal: move all decision logic into `lib/trip-guidance/` as a pure reducer, and prove it with deterministic replays. **No UI behavior change** in this phase beyond the Phase 0 fixes; the page dispatches into the reducer and renders from its state.

### 5.1 Types (`machine.ts`, `signals.ts`)

```ts
export type GuidanceStage = "walk-to-stop" | "wait-for-bus" | "onboard" | "final-walk" | "arrived";

export type Confidence = "high" | "medium" | "low" | "manual";

export interface RiderSample {
  coordinate: JourneyCoordinate;
  accuracyMeters: number;
  speedMetersPerSecond?: number;   // validated, may be undefined
  headingDegrees?: number;
  timestamp: number;                // ms epoch
}

export interface VehicleSample {
  coordinate: JourneyCoordinate;
  tripId: string | null;
  vehicleNumber: string | null;
  timestamp: number;                // HEA timestamp if available, else fetch time
  adherenceMinutes?: number;        // from vehicleJSON if present; negative/positive per HEA docs
  source: "arrivals" | "vehicle";
}

export type GuidanceEvent =
  | { type: "rider"; sample: RiderSample }
  | { type: "rider-status"; status: "disabled" | "permission-required" | "unavailable" | "stale" }
  | { type: "vehicle"; sample: VehicleSample }
  | { type: "vehicle-missing"; timestamp: number; reason: "not-listed" | "error" | "no-key" }
  | { type: "arrival-eta"; stopId: string; tripId: string; minutesUntil: number | null; estimated: boolean; timestamp: number }
  | { type: "tick"; timestamp: number }
  | { type: "manual"; action: "at-stop" | "on-bus" | "off-bus" | "finish" | "back-to-wait" | "switch-trip"; timestamp: number; payload?: unknown }
  | { type: "visibility"; visible: boolean; timestamp: number }
  | { type: "restore"; state: GuidanceState };

export interface GuidanceState {
  stage: GuidanceStage;
  stageEnteredAt: number;
  stageConfidence: Confidence;
  progressSource: "live-vehicle" | "rider-gps" | "scheduled" | "none";
  onboardStopIndex: number;               // index into rideStopSequence
  alongTrackMeters?: number;              // rider/vehicle progress along path.transit
  rider: { latest?: RiderSample; history: RiderSample[]; status: RiderLocationStatus; atStopSince?: number };
  vehicle: { latest?: VehicleSample; history: VehicleSample[]; missingSince?: number; lastEtaMinutes?: number };
  evidence: { boarding: number; alighting: number; lastCountedRiderTs?: number };
  recovery?: RecoveryState;                // Phase 4
  manualCooldownUntil?: number;
}
```

### 5.2 Geometry (`geometry.ts`)

Implement and unit-test:

- `projectOntoPath(path, point)` → `{ segmentIndex, t, alongTrackMeters, crossTrackMeters, snapped }` using equirectangular projection around the point's latitude (Oʻahu is small; accuracy is sufficient). Use `haversineMeters` from `lib/thebus/stops.ts` for cumulative segment lengths.
- `pathCumulativeMeters(path)` → prefix sums, memoized per journey.
- `stopProgressMarks(path, rideStopSequence)` → `alongTrackMeters` for each ride stop, enforced monotonic (if a stop projects behind the previous one because of a loop, search only forward of the previous mark).
- `stopIndexForProgress(marks, alongTrack, currentIndex, passedToleranceMeters)` → largest index whose mark ≤ `alongTrack + tolerance`, clamped to `currentIndex..currentIndex+maxJump`.

Replace `nextStopProgressIndex` usage with along-track progress. Keep the old helper exported for the existing test until Phase 3 removes it.

### 5.3 Signal filtering (`signals.ts`)

- `acceptRiderSample(previous, next, config)`: reject accuracy > `maxUsableAccuracyMeters` (150), reject implied speed > 40 m/s versus the previous accepted sample, reject samples older than the last accepted one.
- `deriveSpeed(previous, next)`: as in Phase 0 step 3, returns `undefined` when movement is within combined accuracy.
- `smoothedCoordinate(history, windowMs)`: accuracy-weighted mean of samples within the window. Use for display and along-track only; use raw for distance-to-stop thresholds with accuracy added as margin.
- `isStale(sample, now, maxAgeMs)`.

### 5.4 Reducer transitions (`machine.ts`)

Encode the existing behavior as explicit rules; every rule records the confidence it produces.

**walk-to-stop → wait-for-bus** (auto, `high`): rider within `boardingReachedMeters + accuracy/2` of the board stop continuously for `boardingDwellMs` (3.5 s), accuracy ≤ 100, and speed < 1.5 m/s or undefined. Manual **I'm at the stop** → `manual`.

**wait-for-bus → onboard**:
- `high`: exact-trip vehicle sample age ≤ 45 s, rider-to-vehicle distance ≤ 110 m for ≥ 3 consecutive rider samples spanning ≥ 8 s, both rider and vehicle along-track increased by ≥ 70 m from the board stop mark, rider speed ≥ 1.8 m/s.
- `medium` (new, schedule-assisted; only when no exact vehicle sample in the last 60 s): rider along-track progress on `path.transit` increased by ≥ 150 m within 60 s, cross-track ≤ 40 m, speed ≥ 4 m/s for ≥ 3 samples, and current time is within [scheduled board time − 3 min, + 25 min] (use `journey.boardStop.time` and `serviceDate`; adjust by last known `scheduleDeviationMinutes`). Shown with the estimated icon and copy "Looks like you're on the bus" with a **Not on the bus** undo action that returns to wait-for-bus with a 2-minute cooldown.
- Manual **I'm on the bus** → `manual`.

**onboard stop progression**: `progressSource` = `live-vehicle` if fresh vehicle sample (≤ 45 s) else `rider-gps` if fresh rider sample with cross-track ≤ 60 m else `scheduled`. Along-track from the chosen source; stop index via `stopIndexForProgress` with `maxJump = 1` for rider-gps and `maxJump = 3` for live-vehicle. For `scheduled`, advance index by scheduled stop times plus known deviation, never past `length - 2` (the final stop requires evidence or manual).

**onboard → final-walk** (auto, `high`): stop index is the final ride stop **and** rider within 90 m of the alight stop for ≥ `alightingDwellMs` (3.5 s), **and** either (a) vehicle sample shows the vehicle ≥ 80 m past the alight mark while rider stays within 90 m, or (b) no vehicle for 60 s and rider speed < 1.5 m/s for ≥ 10 s. Manual **I'm off the bus** → `manual`.

**final-walk → arrived** (auto, `high`): rider within 70 m of destination for 5 s. Also reached by **Finish trip**.

Every automatic transition sets `manualCooldownUntil` for nothing; every manual transition sets it to `now + 120_000` and automatic rules that would move **backwards** or contradict are ignored during the cooldown.

### 5.5 Replay harness (`replay.ts`, `fixtures/`)

Fixture format (JSON, one file per scenario):

```json
{
  "name": "clean-live-trip",
  "journeyFixture": "ala-moana-live",
  "startTimestamp": 1757000000000,
  "events": [
    { "at": 0,     "type": "rider",   "lat": 21.3049, "lng": -157.8569, "accuracy": 12, "speed": 1.3 },
    { "at": 15000, "type": "vehicle", "lat": 21.3100, "lng": -157.8600, "tripId": "T1", "vehicle": "123" },
    { "at": 16000, "type": "vehicle-missing", "reason": "not-listed" },
    { "at": 20000, "type": "tick" }
  ],
  "expect": [
    { "byMs": 65000,  "stage": "wait-for-bus", "confidence": "high" },
    { "byMs": 140000, "stage": "onboard",      "confidence": "high" },
    { "neverBefore": 100000, "stage": "onboard" },
    { "monotonicStopIndex": true },
    { "byMs": 700000, "stage": "final-walk" }
  ]
}
```

`runReplay` feeds events in order (inserting a `tick` every 1 s of fixture time), returns the trace of states, and `replay.test.ts` asserts the `expect` block generically for every fixture in the directory. Build the journey fixture from a saved real `/api/trip-plan` response for Ala Moana Center (store it as `lib/mock/journeys.live-fixture.ts` or JSON; it is test data, not a production path).

Required scenarios (write all of them; each must pass):

1. `clean-live-trip` — everything ideal.
2. `noisy-gps-at-stop` — 8–60 m jitter while standing at the stop for 3 minutes, bus arrives and leaves without the rider (rider must **not** be marked onboard).
3. `bus-passes-while-walking` — rider 200 m away walking toward stop, exact vehicle passes within 100 m at 10 m/s. No boarding.
4. `gps-jump-onboard` — single 400 m teleport then return; stop index must not jump.
5. `gps-lost-onboard` — no rider samples for 4 minutes; live vehicle continues; progress source is `live-vehicle`.
6. `hea-lost-onboard` — no vehicle samples for 4 minutes; rider GPS continues; source is `rider-gps`.
7. `both-lost-onboard` — neither for 3 minutes; source `scheduled`; index advances by schedule but stops before the final stop; recovers when GPS returns.
8. `medium-confidence-boarding` — no HEA key journey; rider accelerates along the route on time; expect `onboard` with `medium`.
9. `loop-route` — shape passes within 60 m of an earlier stop; index must not regress.
10. `cross-street-stop-pair` — a stop on the opposite side of the street 30 m away is not in the sequence; no false progress.
11. `manual-override` — manual **I'm on the bus** then evidence suggests still waiting; state stays onboard for the cooldown.
12. `restore-mid-ride` — `restore` event with onboard state at index 4, then continues correctly.

### 5.6 React adapter (`lib/hooks/useGuidanceEngine.ts`)

- `useReducer` with `reduceGuidance`. Location watch (same permission gate as now: `getLocationPreference`, `canUseLocationWithoutPrompt`; never prompt), TanStack Query polling, and a 1 s `tick` interval all **dispatch events**; they never set stage directly.
- Expose `{ state, dispatchManual, derived }` where `derived` contains display values (remaining stops, remaining minutes, distances, copy keys) computed by pure selectors in `copy.ts`.
- The page component becomes rendering + manual buttons. The stage-dot preview (`stage` for viewing) stays separate from `state.stage` (actual progress), as it is today.

Acceptance criteria:

- All 12 replay fixtures pass, plus geometry and signal unit tests. Add the new test files to `test:unit` in `package.json`.
- Playwright guidance test passes unchanged in behavior.
- `live-directions.$journeyId.tsx` contains no `useEffect` that changes the stage; all transitions come from the reducer (verify by grep for `setStage`/`setJourneyProgress` — the only remaining setter should be for the preview dots).

---

## 6. Phase 2 — Continuous vehicle tracking, freshness, and session resilience (1–2 days)

Goal: fix D1, D6, D7. Keep the live bus for the whole ride and survive refresh/background.

### 6.1 Server: `GET /api/vehicle`

- In `server/index.ts` add `vehicle(url, origin)` handling `?num=<vehicleNumber>&trip=<tripId>`. Use `fetchVehicleLocation` from `lib/thebus/client.ts`. Extend `RawTheBusVehicle` conservatively with any additional HEA fields you can confirm from a real response (`last_message`, `adherence`, `trip`, `route_short_name`). First log one real response in development and only type fields you actually see.
- Response type (`types/transit.ts`):

```ts
export interface VehiclePositionResponse {
  vehicle: string;
  tripId: string | null;            // as reported by HEA for this vehicle right now
  matchesTrip: boolean;             // tripId === requested trip
  location: VehicleLocation | null;
  lastMessageAt?: string;           // ISO if HEA provides it
  adherenceMinutes?: number;
  fetchedAt: string;
  dataSource: "live";
  error?: string;
}
```

- Without an API key return 503 exactly like `/api/tracking`. Mock journeys never call it (guard on `journey.dataSource !== "mock"`).
- Add `fetchVehicle(vehicleNumber, tripId)` to `lib/api/transit.ts`.

### 6.2 Client polling strategy

| Stage | Query | Interval | Purpose |
|-------|-------|----------|---------|
| walk-to-stop, wait-for-bus | `/api/arrivals?stop=<boardStop>` | 15 s | ETA + first vehicle fix; **capture `arrival.vehicle`** into state the first time the exact trip is seen |
| wait-for-bus (vehicle known) | `/api/vehicle?num=&trip=` | 10 s | Higher-cadence position for boarding evidence |
| onboard | `/api/vehicle?num=&trip=` | 10 s | Position for along-track progress |
| onboard | `/api/arrivals?stop=<alightStop>` | 30 s | ETA to alight stop for "Get off in ~N min"; also confirms the trip still serves the alight stop |
| final-walk, arrived | none | — | Stop polling |

Notes:

- HEA rate limits are undocumented; keep the combined request rate ≤ 8/min per session. Pause all polling while `document.visibilityState === "hidden"` (TanStack `refetchIntervalInBackground: false`) and refetch immediately on `visibilitychange` to visible.
- Dispatch `vehicle-missing` when the vehicle endpoint errors or `matchesTrip === false` (the latter feeds Phase 4 "wrong bus / trip reassignment").
- Vehicle staleness: prefer `lastMessageAt` when present; otherwise use `fetchedAt`. The reducer treats samples > 45 s old as not fresh for transitions and > 120 s as missing.

### 6.3 Persistence and lifecycle (`persistence.ts`)

- On every reducer change, save `{ journeyId, tripId, savedAt, state (without histories, capped to last 5 samples) }` to `sessionStorage` key `holohele:guidance:<journeyId>`. Use `sessionStorage` so it dies with the tab but survives refresh; the journey itself is re-resolved by the existing loader (`resolvePlannedJourney`, 30 s plan cache) — if the plan no longer contains the journey id, show the existing not-found handling and drop the saved state.
- On mount, if a saved state exists for the same `journeyId` **and** `tripId` and is < 3 hours old, dispatch `restore`. Then immediately request fresh location and refetch queries so the reducer re-evaluates with current evidence.
- Screen Wake Lock: `navigator.wakeLock?.request("screen")` while stage is not `arrived`; release on unmount; re-request on `visibilitychange` to visible. Catch and ignore failures (Tauri/desktop/unsupported).
- Foreground alerts: when the reducer transitions into "2 stops", "next stop", or "this is your stop", call `navigator.vibrate?.([200, 100, 200])` and, if the existing notification preference is enabled and permission already granted, send a local notification through the existing `lib/notifications.ts` abstraction. Never request permission from this screen.

Acceptance criteria:

- Playwright: mock `/api/arrivals` and `/api/vehicle` with `page.route`, advance geolocation through the ride, and assert the `.journey-bus-marker` remains visible from wait through the last intermediate stop, and that the "Get off in N min" value comes from the alight-stop ETA.
- Playwright: reload mid-ride; stage and stop index are restored.
- Unit: replay `gps-lost-onboard` now uses `vehicle` source events and passes.
- Manual: in the in-app browser, hide the tab for 60 s and return; the status row shows a fresh "Updated now" within 15 s.

---

## 7. Phase 3 — Map-matched progress, get-off timing, and scheduled fallback (1–2 days)

Goal: make onboard guidance accurate and stable (D4), and keep it meaningful when live data is gone (R5).

Steps:

1. **Server marks (optional but preferred):** in `getGtfsTripPlan` (`server/gtfs.ts`) add `shapeDistanceMeters` to each `rideStopSequence` entry using the sliced shape, computed with the same projection as `geometry.ts`. Make the field optional in `JourneyStop` so mock journeys still type-check; the client falls back to `stopProgressMarks` when absent.
2. **Along-track everywhere:** `DirectionsMap` `completedTransit` / `remainingTransit` split uses `projectOntoPath` (snapped point inserted at the split) instead of nearest vertex, so the drawn progress does not jump between vertices on long segments.
3. **Get-off timing:**
   - Remaining minutes = alight-stop live ETA when fresh; else `(remainingAlongTrackMeters / recentVehicleSpeed)` when the vehicle history has ≥ 2 fresh samples and speed 2–20 m/s; else scheduled remaining time from stop times plus last known deviation. Label the source with the existing live/scheduled icons.
   - Warnings fire on along-track thresholds with hysteresis: "Get ready" when ≤ 2 stops **or** ≤ 90 s away, "Get off at the next stop" when the previous stop mark is passed by ≥ 40 m, "This is your stop" when within 120 m before the alight mark or the mark is passed. A warning never downgrades once shown for the same stop index.
4. **Scheduled fallback progression:** when `progressSource === "scheduled"`, compute the expected stop index from `serviceDate` + stop `time` strings + `scheduleDeviationMinutes`. Show the existing "Stop progress is paused" row reworded to "Following the schedule · Live position unavailable" with the schedule icon. Never auto-advance past `length - 2`.
5. Remove `nearestStopIndex`/`nextStopProgressIndex` once nothing uses them, and port their test to the along-track equivalents.

Acceptance criteria:

- Replay scenarios 4, 5, 6, 7, 9, 10 pass with the along-track engine; add `late-bus-scheduled-fallback` (bus 6 min late, both signals lost) asserting the index follows deviation-adjusted times.
- Playwright: the `Get off in` heading and the minutes value update from mocked alight-stop ETA and show the live icon; with the ETA mock removed they show the schedule icon.

---

## 8. Phase 4 — Recovery states and replanning (2 days)

Goal: R7. Each recovery is a `RecoveryState` on the reducer with a detection rule, copy, and one primary action. Reuse the existing status rows and bottom action bar; the recovery replaces the primary button label while active.

```ts
export type RecoveryState =
  | { kind: "missed-bus"; detectedAt: number; nextTrip?: { tripId: string; time: string; minutesUntil: number | null; vehicle: string | null } }
  | { kind: "wrong-bus"; detectedAt: number; observedRoute?: string }
  | { kind: "missed-stop"; detectedAt: number; nextStopIndex: number }
  | { kind: "off-route-walk"; detectedAt: number; leg: "start" | "end" }
  | { kind: "trip-ended-early"; detectedAt: number };
```

Detection rules and actions:

1. **Missed bus** (wait-for-bus): the exact trip disappears from the board-stop arrivals **and** the last vehicle sample was ≥ 80 m past the board mark **and** the rider is still within 90 m of the stop for ≥ 45 s after that. Copy: "Your bus has left this stop." Action **Take the next bus**: pick the next arrival at the same stop with the same `route` and `headsign`; dispatch `manual switch-trip` which replaces `tripId`/`vehicle`, re-requests `/api/trip-plan` with `origin = boardStop` to obtain a consistent `JourneyOption` for the new trip (choose the journey with the same route and board/alight stops), and reloads guidance for it. If no plan matches, fall back to scheduled-only guidance with the new trip and label it. Secondary: **Plan a new trip** → `/plan` with current search params.
2. **Wrong bus** (onboard, `high`/`medium` boarding): for ≥ 3 consecutive rider samples the rider is > 250 m from the exact vehicle while moving ≥ 5 m/s, or the vehicle endpoint reports `matchesTrip === false` twice in a row. Copy: "This may not be your bus." Actions: **I'm on this bus** (keep going, cooldown) / **I'm not on the bus** (back to wait-for-bus, clear evidence).
3. **Missed stop** (onboard): along-track from a fresh source exceeds the alight mark by ≥ 250 m and the rider was not within 90 m of the alight stop with low speed in the last 90 s. Copy: "You passed {stop}." Action **Get off at the next stop**: set alight to the next stop in the trip's GTFS sequence (request `/api/route-schedule` or reuse `rideStopSequence` if longer stops exist; if the sequence ends, offer **Plan a new trip**). Then re-request `/api/walking-directions` from the new alight stop to the destination.
4. **Off-route walking** (walk-to-stop / final-walk): cross-track distance to the active walking path > 60 m for ≥ 2 accepted samples, and the rider is not within 70 m of the target. Automatically re-request `/api/walking-directions` with `originLat/Lng = current rider location` (for the end leg, pass the alight stop as board/alight placeholders and only use `end`). Throttle to once per 30 s and only when the distance to target is > 100 m. No dialog: just refresh the steps and show "Route updated" briefly in the status row.
5. **Trip ended early**: the vehicle endpoint returns a different `tripId` for the same vehicle while the rider is still before the alight stop, twice in a row. Treat as **wrong bus** copy with **Plan a new trip**.

Acceptance criteria:

- Replay fixtures: `missed-bus`, `wrong-bus`, `missed-stop`, `off-route-walk` each reach the expected `recovery.kind` within the R7 window and never trigger in the 12 baseline scenarios.
- Playwright: missed-bus flow with mocked arrivals removes the trip and offers the next same-route arrival; clicking it lands on guidance for the new trip with **Wait for** visible.
- All recovery copy has English and Japanese entries.

---

## 9. Phase 5 — Confidence UI, dev replay mode, field-test protocol, docs (1 day)

1. **Confidence in the UI** (no new components): when a stage was entered with `medium`, append the estimated icon and "Estimated" to the stage heading row and show the undo action in the bottom bar. `low` never causes a transition; it only affects the status row ("Location is imprecise · Move to open sky").
2. **Dev replay mode**: in development only, `?replay=<fixtureName>` on `/live-directions/:id` disables real geolocation/polling and drives the reducer from the fixture at 1× or `&speed=10`. This lets the designer review every state without leaving the desk. Guard with `import.meta.env.DEV`; the production build must tree-shake it (verify by grepping the built bundle for a fixture name).
3. **Field-test protocol** (add to this file as an appendix when done): one real ride on Route 1L or a downtown–Ala Moana direct trip with `?debug=1`, recording: time of each automatic transition vs actual, any false transitions, vehicle sample gaps > 60 s, GPS accuracy distribution. Convert any observed failure into a new replay fixture before fixing it.
4. **Docs**: update `PROJECT_STATE.md` (Trip planning and guidance, Known limitations, Next priorities, Recent changes) and `README.md` if new env vars or endpoints exist.

Acceptance criteria:

- Production bundle contains no replay fixture names.
- `PROJECT_STATE.md` accurately describes what is automatic, what is inferred, and what is still manual.

---

## 10. Configuration defaults (`config.ts`)

Keep every number here, typed and documented. Field testing may tune them; tests import the same object.

```ts
export const guidanceConfig = {
  rider: { maxUsableAccuracyMeters: 150, transitionMaxAccuracyMeters: 100, maxPlausibleSpeedMps: 40, staleAfterMs: 30_000 },
  vehicle: { freshMs: 45_000, missingAfterMs: 120_000, pollMsWaiting: 10_000, pollMsOnboard: 10_000, arrivalsPollMs: 15_000, alightEtaPollMs: 30_000 },
  boarding: { reachedMeters: 70, approachingMeters: 250, dwellMs: 3_500, maxVehicleDistanceMeters: 110, minDepartureMeters: 70, minSpeedMps: 1.8, minSamples: 3, minSpanMs: 8_000 },
  boardingMedium: { minAlongTrackMeters: 150, windowMs: 60_000, maxCrossTrackMeters: 40, minSpeedMps: 4, scheduleWindowBeforeMs: 180_000, scheduleWindowAfterMs: 1_500_000 },
  onboard: { maxCrossTrackMetersForGps: 60, maxJumpGps: 1, maxJumpVehicle: 3, passedToleranceMeters: 40, getReadySeconds: 90, thisIsYourStopMeters: 120 },
  alighting: { reachedMeters: 90, dwellMs: 3_500, vehiclePastMeters: 80, noVehicleFallbackMs: 60_000, lowSpeedMps: 1.5, lowSpeedMs: 10_000 },
  destination: { reachedMeters: 70, dwellMs: 5_000 },
  recovery: { missedBusPastMeters: 80, missedBusWaitMs: 45_000, wrongBusDistanceMeters: 250, wrongBusSamples: 3, missedStopPastMeters: 250, offRouteCrossTrackMeters: 60, offRouteSamples: 2, rerouteThrottleMs: 30_000 },
  manualCooldownMs: 120_000,
} as const;
```

---

## 11. Out of scope (document, do not attempt)

These are what separate a foreground web/Tauri prototype from Google Maps/Moovit, and they need product, privacy, and platform decisions first:

- Background location, background get-off notifications, and native activity recognition (needs a mobile shell such as Tauri Mobile or Capacitor plus OS permissions and battery policy).
- Multi-leg/transfer routing and transfer-risk rerouting (depends on the `JourneyOption` multi-leg refactor listed in `PROJECT_STATE.md` Next priorities #5–6).
- Crowd-sourced or fleet-wide vehicle prediction. HEA positions are the only live source; their update cadence and latency bound what any client can do.
- Turn-by-turn voice guidance for walking legs.

---

## 12. Working checklist for the agent

Copy this into your task tracker and tick items as you go.

- [ ] Phase 0: D2, D3, D5, D9 fixed; dev debug row; all checks green; manual dwell test done.
- [ ] Phase 1: `lib/trip-guidance/` created with `index.ts` re-exports; geometry, signals, machine, copy, replay; 12 fixtures pass; `useGuidanceEngine` wired; page has no stage-changing effects; `test:unit` script updated.
- [ ] Phase 2: `/api/vehicle` + `fetchVehicle`; polling table implemented; visibility pause/refetch; `sessionStorage` restore; wake lock; vibration/local notification on get-off warnings; Playwright reload test.
- [ ] Phase 3: along-track marks (server optional field + client fallback); map split snapped; get-off timing with source labels; scheduled fallback progression; old nearest-stop helpers removed.
- [ ] Phase 4: five recovery states with detection, copy (EN/JA), actions; replan via existing endpoints; fixtures and Playwright for missed bus.
- [ ] Phase 5: confidence UI; dev replay mode tree-shaken; field-test appendix; `PROJECT_STATE.md` and `README.md` updated.
- [ ] Final: `bun run lint && bun run typecheck && bun run test:unit && bun run build` green; focused Playwright guidance tests green; end-of-task summary per `AGENTS.md`.
