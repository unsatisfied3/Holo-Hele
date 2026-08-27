# Holo Hele Design System

**Version:** 2.0 (Island-wide stop map)
**Figma reference:** `TheBus_V1` — Home expanded `1:568`, Stop Information `1:1735`, Route Interaction `1:1698`  
**Code tokens:** `src/styles.css` (imports the canonical token definitions)

This document is the **single source of truth** for Holo Hele UI. It merges the shipped home and stop detail pages with the Figma wireframes and **resolves known Figma inconsistencies** so designers and developers do not re-litigate them screen by screen.

---

## How to use this doc

| Priority | Source | Use for |
|----------|--------|---------|
| 1 | **This document + `globals.css`** | Colors, spacing, component specs, intentional deviations |
| 2 | **Implemented components** | Exact class names, behavior, states |
| 3 | **Figma `TheBus_V1`** | Layout IA, copy patterns, icon shapes — not pixel-perfect export |

When Figma and the app disagree, follow the **Resolution** column in [Figma inconsistencies](#figma-inconsistencies-resolved) unless this doc says otherwise.

---

## Product principles

Holo Hele is a **mobile-first Oʻahu transit app**. The home screen is a map with a draggable nearby-stops sheet — riders should scan stop names, route badges, and arrival times in seconds outdoors.

- **Calm and clear** — hairline borders and elevation only where the map needs surface separation.
- **Transit blue is the brand** — use it for primary actions, current navigation, route geometry, and selected states.
- **Live green is semantic** — reserve it for real-time arrival status, never decoration.
- **Text-first** — every map marker has a text equivalent in the sheet.
- **Never fake live data** — when TheBus API is configured, show live data or an error; do not silently fall back to sample arrivals.

---

## App shell

| Property | Value |
|----------|-------|
| Max width | `430px` centered (`.app-shell`) |
| Height | `100dvh` |
| Background | `--canvas` (`#ffffff`) by default; stop detail uses `--canvas-soft` |
| Side borders | `1px solid --hairline` on desktop preview |
| Safe areas | Respect `env(safe-area-inset-top/bottom)` on overlays and nav |

The shell simulates a phone frame on desktop; content is full-bleed inside it.

**Home + tab screens** use `AppShell` (`components/layout/AppShell.tsx`) — main content plus bottom nav.

**Stop detail** (`/stops/[id]`) uses a standalone `.app-shell.bg-canvas-soft` layout — **no bottom nav** — full-height scroll for arrivals.

---

## Color tokens

Defined in `:root` in `src/styles.css` and its imported token stylesheet.

### Brand

| Token | CSS variable | Hex | Use |
|-------|--------------|-----|-----|
| Primary | `--primary` | `#000000` | CTAs, map user dot, bus markers, route badge borders |
| On primary | `--on-primary` | `#ffffff` | Text/icons on black fills |
| Ink | `--ink` | `#000000` | Headlines, primary labels, near-term scheduled times |
| Live | `--live` | `#1a7f37` | Estimated arrivals ≤ 20 min, “Now” |
| Detour | `--alert` | `#765000` | Detour icons and labels on `--alert-subtle` yellow |
| Closure | `--closure` | `#9f1239` | Stop-closure icons and labels on `--closure-subtle` red |
| Transit route | `--transit-blue` | `#0055a5` | Tracking/directions route geometry and active map markers only |
| Body | `--body` | `#5e5a65` (charcoal-800) | Secondary text, muted arrival times |

### Charcoal scale (from Figma, used app-wide)

| Token | Hex | Typical use |
|-------|-----|-------------|
| `--charcoal-100` | `#fafafa` | Route preview row background (`--canvas-muted`) |
| `--charcoal-200` | `#f4f4f5` | View button, action chips, bottom nav (`--canvas-softer`) |
| `--charcoal-300` | `#ebeceb` | Page soft background (`--canvas-soft`), line tag pills |
| `--charcoal-500` | `#cbcbcb` | Stop detail hero bottom border |
| `--charcoal-600` | `#afafaf` | Stop detail action button borders |
| `--charcoal-700` | `#858585` | Placeholder, mute text (`--mute`) |
| `--charcoal-800` | `#5e5a65` | Body / secondary text (`--body`) |
| `--charcoal-900` | `#09090b` | Sheet title emphasis |

### Semantic surfaces

| Token | Maps to | Use |
|-------|---------|-----|
| `--canvas` | white | Cards, sheet, search bar, map controls, stop header, arrival list |
| `--canvas-muted` | charcoal-100 | Route arrival preview rows |
| `--canvas-soft` | charcoal-300 | Stop detail page background, hover states, map fallback bg |
| `--canvas-softer` | charcoal-200 | View button fill and stop action buttons |
| `--hairline` / `--border` | `#e4e4e7` | All dividers and control borders |
| `--surface-pressed` | charcoal-500 | Pressed/disabled fills |

Transit blue identifies branded actions, routes, selected states, and current
navigation. Neutral controls and list rows may use `--charcoal-700` for their
focus outline; its contrast against white remains visible without implying a
selected blue state. Hover surfaces remain neutral gray (`--canvas-soft`); do
not tint list rows or chips blue.

---

## Typography

**Single family:** Inter (400 / 500 / 600 / 700).  
Figma mixes Inter and Roboto on nav labels and arrival times — **use Inter everywhere**.

| Role | Size | Weight | Line height | Example |
|------|------|--------|-------------|---------|
| Sheet title | 16px (`text-base`) | 600 | normal | “Nearby Stops” |
| Stop page title | 16px (`text-base`) | 600 | normal | “Stop” (nav bar) |
| Stop name (detail) | 18px (`text-lg`) | 500 | snug | Stop hero heading |
| Stop name (list) | 14px (`text-sm`) | 500 | snug | Stop row title |
| Body / metadata | 12px (`text-xs`) | 400 | normal | ID, walk time, lines, refresh |
| Route headsign | 14px (`text-sm`) | 500 | snug | Preview / arrival row |
| Arrival time | 14px (`text-sm`) | 600 | normal | “Now”, “8 min”, scheduled time |
| Scheduled caption | 9px | 500 | tight | “Scheduled time” |
| Nav label | 12px (`text-xs`) | 500 | normal | Map / Favorites / Settings |
| Search placeholder | 14px (`text-sm`) | 400 | normal | “Where to?” |
| Chip label | 14px (`text-sm`) | 500 | normal | Home / Work / Other |
| Line tag | 12px (`text-xs`) | 400 | normal | Route numbers in Lines section |

Headings (`h1–h3`) use weight **700** globally. Transit row titles use **500**, not 700.

---

## Radius & spacing

| Token | Value | Use |
|-------|-------|-----|
| `--radius-xs` | `4px` | View button, route badge, line tags, stop action buttons |
| `--radius-md` | `8px` | Map controls, nav item hover, focus rings |
| `--radius-xl` | `16px` | Sheet top corners |
| `--radius-pill` | `999px` | Search bar, destination chips |

**Spacing base:** 4px grid. Common values: `8px` gap (chips), `12px` gap (rows), **`16px` horizontal padding** (`px-4`) on sheet rows, stop detail header, refresh bar, line tags, and arrival rows; `32px` left indent for route previews (`pl-8`).

---

## Elevation

**Flat UI — no drop shadows on app components.** The selected Home map stop is
the intentional exception: it uses a primary-blue glow to remain visible over
the basemap without adding a second selection ring.

| Figma | Holo Hele |
|-------|-----------|
| M3 elevation on search, chips, map frame, zoom, sheet | **Hairline border only** (`border-hairline`) |
| Sheet shadow `0 -4px 16px rgba(191,191,191,0.25)` | **Top border + `--radius-xl` corners** — separation from map via border, not shadow |

Leaflet default control shadows are overridden to `none` in `globals.css`. Stop detail refresh bar and scroll container explicitly set `box-shadow: none`.

---

## Icons

Static assets live in **`public/icons/figma/`** via `FigmaIcon` and `lib/figma-icons.ts`. Do not add Material/Lucide icons for home/stop UI.

**Tintable row icons** use inline SVG components in `components/icons/FigmaIcon.tsx` so they inherit text color:

| Component | Size | Use |
|-----------|------|-----|
| `LiveSignalIcon` | 10×10px (`h-2.5 w-2.5`) | All estimated arrivals — green when near, `--body` when far |
| `ScheduleIcon` | 11×11px | Scheduled arrivals — ink when near, `--body` when far |
| `FigmaIcon` | varies | Static assets (search, nav, badges, etc.) |

| Asset name | Size context | Use |
|------------|--------------|-----|
| `search` | 24px | Search bar |
| `home`, `work`, `other` | 18px | Destination chips |
| `busStopSign` | 15×14px source, scaled proportionally | Stop list rows and stop markers in text-based directions |
| `busRoute` | 14×17px | Route badge inside preview |
| `chevronDown` | 16px | Sheet expand toggle |
| `zoomIn`, `zoomOut`, `myLocation` | 24px | Map controls |
| `mapNav`, `favorites` + inline `SettingsIcon` | 24px | Bottom nav |
| `arrowBack` | 24px | Stop detail back link |
| `refresh` | 14px | Stop detail refresh line |
| `schedule` | 20px | Stop detail Schedule action button |
| `place`, `favorite` | 20px | Stop detail icon-only actions |
| `placeFilled` | 16px | Filled Places result icon in Search |

**Bus stop badge & route badge:** `4px` radius, `1px` border on top/left/right, **`3px` bottom border** (`border-b-[3px]`), black border color — matches Figma route/stop sign frames.

**Map bus marker:** 36px black circle, 2px white ring, white bus icon (20px).

---

## Arrival time display

Shared component: `ArrivalTimeDisplay` — used on home preview rows and stop detail arrival list. Pass `colorNearLive` on both screens.

**Near threshold:** `minutesUntil ≤ 20` (or `0` → “Now”).

| Condition | Icon | Text color | Display |
|-----------|------|------------|---------|
| Live estimate, 0 min | Green `LiveSignalIcon` | `--live` | “Now” |
| Live estimate, 1–20 min | Green `LiveSignalIcon` | `--live` | `{n} min` |
| Live estimate, > 20 min | Muted `LiveSignalIcon` | `--body` | `{n} min` |
| Live estimate, no minutes | Muted `LiveSignalIcon` | `--body` | `{stopTime}` |
| Scheduled, ≤ 20 min | `ScheduleIcon` | `--ink` | Time + “Scheduled time” caption |
| Scheduled, > 20 min or no minutes | Muted `ScheduleIcon` | `--body` | Time + “Scheduled time” caption |

Green is reserved for **estimated** near-term arrivals only. The live wave icon is always shown for estimated rows; scheduled rows always use the clock icon.

---

## Home screen anatomy

Stack order (bottom → top):

1. **Map** — full bleed, z-index 0  
2. **Nearby stops sheet** — z-index 1000, bottom-anchored  
3. **Search overlay** — z-index 1000, top  
4. **Map controls** — z-index 400, right side above sheet  
5. **Bottom nav** — inside `AppShell`, z-index 1100  

Sheet expanded/collapsed and selected-stop states live in `HomeScreen` and drive CSS variable `--sheet-height` so map controls track the active sheet. Home opens in the compact, map-first state shown in the Figma reference.

### Map

| Element | Spec |
|---------|------|
| Tiles | CARTO Light (`light_all`) — neutral gray streets, not Figma static screenshot |
| Default zoom | 15 |
| User location | 14px brand-blue dot, 3px white border, soft blue halo |
| Stop markers | Below zoom 16: compact white/blue stop dots, thinned by screen grid; verified representative stops at official transit centers are prioritized as 28px white/blue bus icons, while colliding centers still obey grid thinning. Zoom 16+: 36px white circle with brand-blue border and bus icon. Tap → selected-stop sheet; selected marker keeps the same size and uses a `0 0 12px` primary-blue glow with no tinted outer ring |
| Controls | Custom (Leaflet zoom disabled); see [Map controls](#map-controls) |

Home uses the official active GTFS feed for nearby stop locations and scheduled
services. When the TheBus API key is configured, the closest stops are enriched
with live arrivals; scheduled times remain visually distinct from estimates.
The map loads the complete official Oʻahu stop list once, but renders only stops
inside the current viewport. At wider zooms it keeps one compact marker per
screen grid cell to prevent overlap and excessive DOM work; neighborhood zoom
16 shows every visible stop with the full marker. Selecting a marker outside the
nearby set requests that stop's arrivals on demand instead of preloading service
data for the entire island.

### Search overlay

| Element | Spec |
|---------|------|
| Position | `top: safe-area + 2.5rem`, horizontal `16px` padding |
| Search bar height | **49px** |
| Search bar radius | `--radius-pill` |
| Search bar surface | `1px hairline`, bg `--canvas`, no shadow |
| Chips | Row below search, `8px` gap, wrap allowed |

### Destination chips (`Chip`)

| Property | Value |
|----------|-------|
| Height | 32px |
| Padding | 10px horizontal |
| Radius | pill |
| Border | hairline |
| Background | canvas |
| Icon + label gap | 8px |
| Elevation | None; use a hairline border and subtle press animation |

### Nearby stops sheet

| Property | Value |
|----------|-------|
| Expanded max height | ~52% of home screen (`--sheet-height-expanded`) |
| Collapsed | Header row only (~3rem, `--sheet-height-collapsed`) |
| Top corners | `--radius-xl` |
| Top edge | `border-t hairline` |
| Background | `--canvas` |
| Transition | `max-height 0.25s ease-out` on expand/collapse |

**Sheet header (toggle button):**

- Full width, centered title “Nearby Stops”, semibold 16px  
- Chevron rotates 180° when expanded  
- Bottom border hairline  

**List structure (canonical — supersedes Figma collapsed mock):**

For **each** nearby stop, in order:

1. **Stop row** — 94px min height, white background  
2. **Up to 3 route preview rows** — muted background, indented  

Figma’s collapsed frame only shows previews under the first stop; **the app shows previews for every stop** so riders see arrivals without opening stop detail.

**Stop row (`StopListItem`):**

| Zone | Spec |
|------|------|
| Height | 94px |
| Padding | 16px horizontal, 10px vertical |
| Icon | Bus stop sign badge (left) |
| Title | Stop name, 14px medium |
| Meta line 1 | `ID {id} • {n} min walk` — 12px body |
| Meta line 2 | `Lines: {comma-separated}` — truncate with ellipsis after ~11 routes |
| Interaction | The full row is one keyboard-accessible link to `/stops/[id]`; “View” is its trailing visual affordance |

**Route preview row (`RouteArrivalRow`):**

| Property | Value |
|----------|-------|
| Height | 67px |
| Background | `--canvas-muted` (charcoal-100) |
| Left padding | 32px (`pl-8`) — aligns under stop text, not icon |
| Layout | Route badge · headsign · `ArrivalTimeDisplay` (right) |
| Divider | `divide-y divide-hairline` on list |

**Footer timestamp:** When data is loaded, show “Updated {time}” in 12px mute text at bottom of sheet.

### Selected-stop sheet

Tapping a map marker replaces the nearby-stops sheet with the Figma-style stop summary (`Home Page-2.png`):

- One header row: brand-blue stop ID badge beside the stop name
- Service count on its own line below the header (`12 SERVICES` pattern)
- Up to 12 routes in a **4×3 grid** of light-gray rounded cells; each cell contains a blue route badge and the next arrival time
- 6px gutters between grid cells; compact, non-interactive cells are ~32px tall
- Primary brand-blue **Arrivals** and outlined **Direction** buttons at the bottom
- Keep 24px of vertical space between the service grid and action buttons
- A visible handle button closes the summary and restores Nearby Stops
- The persistent bottom navigation is hidden while this focused summary is open

### Map controls

Position: right `16px`, bottom **`calc(var(--sheet-height) + 1rem)`** — follows sheet expand/collapse via `.home-screen__map-controls` in `globals.css`.

| Control | Size | Style |
|---------|------|-------|
| Zoom group | 48×80px total | 8px radius, hairline border, stacked ± |
| Zoom buttons | 48×40px each | Divider between |
| My location | 48×48px | 8px radius, hairline, canvas bg |

Figma uses 2px radius and shadows on these — **use 8px + hairline, no shadow**.

### Bottom nav

| Property | Value |
|----------|-------|
| Height | ~56px + safe area |
| Background | `--canvas` (white) |
| Top border | hairline |
| Items | 3 equal columns: Map, Favorites, Settings |
| Icon | 24px Figma asset |
| Label | 12px medium |
| Active state | brand-blue icon and text; no tinted tile |
| Inactive | body text, hover → `--canvas-soft` |
| Visibility | Shown on `/home`, `/favorites`, `/settings` only — **hidden on stop detail** |

### Favorites

Route: `/favorites`. Layout follows the Figma Flow 4 reference: centered title,
pill search, working Buses/Stops tabs, and compact saved rows. Both saved stops
and preview bus favorites are stored locally; preview favorites are seeded only
when their storage key has never been initialized, so riders can still remove
every item. The heart button removes an item, stop rows open arrivals, and bus
rows open a route-filtered arrivals page. Schedule actions lead to a line chooser
and the official GTFS daily schedule. Scheduled times are explicitly labeled and
never presented as live data. Empty and no-search-match states link back to the
map when appropriate.

Favorites color and state treatment:

- The active tab uses `--brand-blue-subtle` with `--brand-blue` text; inactive
  tabs remain neutral.
- Saved rows use compact circular `--brand-blue-subtle` icons with blue glyphs.
- Every saved item shows a filled blue heart. The outline heart is reserved for
  an unsaved state on detail pages.
- Two saved stop examples may retain disruption treatments for portfolio
  demonstration. They use the matching official notice while it remains active
  and switch to a clearly labeled demo fallback afterward. They stay inside the
  normal Stops list with no separate section blade. The Buses list contains only
  actual saved bus definitions; it does not turn affected route IDs into buses.
- Opening either saved disruption example shows the standard semantic alert
  blade directly below the Stop navigation bar and above the stop name/actions,
  matching the Route 1L hierarchy. Its View action opens that stop's specific
  demo explanation and returns to the originating stop.
- Dividers begin after the leading icon, matching the Figma list rhythm.
- Opening a saved stop carries its Favorites origin through stop and schedule
  pages, so Back returns to the selected **Stops** tab instead of the map.
- Keep the header and search surface flat; the app-wide no-shadow rule overrides
  the Figma header elevation.

Schedule pages use the official active GTFS daily departures for the selected
stop and line. The line and direction are stated once in the schedule header;
rows show only departure times to avoid repeating the same bus name. “Choose
another line” and the “Today” or “Tomorrow” date control use the shared
pale-blue action treatment with a softened blue outline and primary-blue
content. When a route has no more arrivals today, its empty state links to the
actual next-day GTFS schedule; the selected day remains active when changing
lines.
The bundled preview metadata for seeded favorite stop IDs mirrors the same
official feed so names and coordinates remain consistent before API data loads.

### Settings

Route: `/settings`. Combines the app preferences with the Figma
`More Information.png` structure:

- Centered title, compact Holo Hele logo, and the real package version
- **Preferences:** language, location, and service-alert notifications. The location switch represents the
  rider’s preference and stays on when device permission is blocked; show a
  clear permission message while map screens continue using their fallback.
  Notification permission is requested only after the rider turns Service
  alerts on. When enabled, a secondary pale-blue test button appears.
- **Resources:** FAQ, fares and passes, videos, system map, and rider alerts
- **TheBus:** phone, report, website, and rating links
- **Legal:** terms and privacy

Rows use 52–56px touch targets, hairline dividers, monochrome icons, neutral
gray hover states, and blue chevrons. The persistent bottom navigation is white
with a blue active state.

### Rider alerts

Route: `/alerts`. The Settings resource opens this in-app page instead of
leaving Holo Hele. Detours and reroutes use dark `--alert` amber on
`--alert-subtle` yellow. Notices that explicitly say service is closed,
suspended, or unavailable use dark `--closure` red on `--closure-subtle` red,
even when TheBus categorizes them as Weather, Road Work, or another cause.
Other notices retain the restrained brand-blue treatment.
Details remain text-first for affected lines, stops, and rider guidance. The
Affected Lines and Affected Stops headings share the same 12px uppercase,
semibold body-color style; route badges and stop text remain visually distinct.
Bus-detail alert banners remain flat with no bottom border, matching the Figma
reference.
Bus empty-state schedule links reuse the pale-blue action-button treatment
instead of the black pill CTA.
Banner View actions open `/alerts/[alertId]` for only the selected notice.
Back returns to the originating bus, stop, or route when context is available;
otherwise it returns to the Rider Alerts list.

Current notices come from the official TheBus Service Disruption page through
the Bun API and refresh at a five-minute cadence. Loading, empty, stale, and
unavailable states remain inside the alerts surface and never block other
transit features. Route pages use exact normalized route IDs. A bus favorite or
bus detail alert must match both its exact route and saved stop; a whole-stop
closure with no route list affects every bus at that stop. Stop alerts require
an explicit official stop number and say whether the entire stop is closed or
only the named routes are temporarily skipping that stop. Route-specific copy
uses “Line 1L is temporarily skipping this stop.” or the plural equivalent;
the curated weather example uses “Weather is affecting Line 65 service near
this stop.”
Demonstration disruptions remain isolated in `lib/mock/service-alerts.ts` and
never enter the live API response. During portfolio simulation they use the
same alert presentation as current disruptions, without visible demo markers.
Affected favorite buses and stops show the same compact warning state and link
to the in-app alert page. Never modify real arrival times to imply a delay from
any alert data.
When a demo query is active, its selected scenario appears before the live
Service Disruptions section so the requested Route 1L or Stop 437 example is
immediately visible.
The seeded Stop 437 favorite and its detail page surface a route-specific
skipped-stop scenario when no live alert exists: Route 1L temporarily does not
serve Stop 437, but the stop remains open to other routes. It is modeled as
`stop-skipped`, not a whole-stop closure.
Compact Favorites warnings, banners, and detail headers use the same semantic
yellow detour or red closure treatment.
Favorites uses terse impact labels—`STOP SKIPPED · 1L`, `STOP SKIPPED · 3, 7`,
and `WEATHER DISRUPTION · 65`—while stop banners and alert details use complete
rider-facing sentences.

---

## Route Interaction (tracking)

Route: `/stops/[id]/track/[arrivalId]` · Figma node `1:1698` · Component: `TrackingScreen`

Opened when a rider taps an arrival row on stop detail. Full-bleed map with overlays — not a stacked header + scroll layout.

### Layout stack

1. **Map** — full viewport, CARTO Light tiles  
2. **Top overlay** — white bar, back arrow + centered **“Tracking”**  
3. **Bottom floating carousel** — 320px-wide cards on a 375px frame (`27.5px` horizontal inset via `.tracking-summary`), `--radius-md`, hairline border
4. **Pagination** — interactive dots beneath the card when multiple live buses are trackable

### Map markers (canonical)

| Element | Spec |
|---------|------|
| Full route | Dark `--transit-blue` polyline from the active vehicle through the remaining known trip stops |
| Approach segment | Light-blue overlay from the active vehicle through upcoming stops to the rider’s selected stop |
| Direction arrow | Blue arrow offset 18px beside the route near the selected stop; points toward the next trip stop, or along the final approach when no later stop is available |
| Intermediate stops | 12px white dot, blue ring — sourced from the active trip’s GTFS sequence |
| Destination stop | 18px white dot with a dark-blue ring, distinct from the rider’s filled location dot |
| User location | 28px fixed-size blue dot with white ring and pale halo; shown only when location access is enabled and layered above route and stop markers at every zoom |
| Stop callout | Hidden by default; selecting any route stop reveals its name, ID, and a link to stop detail |
| Bus | 44px white circle, blue bus icon, **blue ETA pill** (e.g. “2 min”) |
| Unavailable GPS | Banner under header; map centers on stop |

The server indexes TheBus’s official active GTFS feed by trip. Live tracking
never substitutes synthetic named stops: when GTFS is unavailable, the direct
vehicle-to-destination line remains and unknown intermediate stops are omitted.
Mock mode uses separate, explicit stop-sequence fixtures.

### Bottom card

| Element | Spec |
|---------|------|
| Route row | Route badge · headsign · stop name · `ArrivalTimeDisplay` |
| Status footer | Clock icon + status. Exact sequence and >2 stops: `Stops away: {n}`; within 2 stops or ETA-only: `Arrives in {n} min`; zero: `Arriving now` |
| Swipe | Native horizontal scroll snap; settling on a card updates the tracking URL and map |
| Page dots | One accessible button per available live bus; hidden when only one bus is trackable |

## Search and trip planning

The trip-planning flow follows the seven approved Figma frames for saved and
focused search, categorized results, Plan Trip, Direction, and both Live
Direction states while keeping official, live, and fallback data states
visually explicit.

- `/search` filters categorized buses, stops, and places; an empty query shows
  saved stops and recent buses. Stop suggestions are debounced and come from
  the active official GTFS stop index, with a short result cap and scheduled
  line metadata. Bus and place suggestions remain curated until general route
  pages and a geocoder are available.
- `/routes/[routeId]` opens a map-led route overview with route identity, the
  official GTFS shape, every scheduled stop, and a vertically connected stop
  sequence. The Hawaiʻi Kai example uses Route 1L and labels GTFS times as
  scheduled; live estimates remain distinct and require the TheBus AppID.
- Route-map endpoints remain visible at every zoom. Intermediate stop markers
  are compact 8px hollow circles and appear at zoom 11+, keeping the full-route
  view readable while preserving every GTFS stop when riders inspect an area.
- Selecting a Place result starts the trip-planning preview; Bus and Stop
  results continue into their existing detail flows.
- `/plan?destination=...` requests current direct trip options from the active
  TheBus GTFS feed when origin and destination coordinates are available. Cards
  and empty/unavailable states sit on a white `--canvas` page background.
  Cards
  use a compact transit-results hierarchy: total duration at left, whole-trip
  departure and arrival times, walk–route–walk sequence, and boarding status and
  stop. Options share one continuous list without separate recommended and
  alternative headings or tags. The card does not repeat a separate boarding-time
  icon or value above the route sequence; a live option relies on its colored
  countdown treatment instead of repeating a **Live** label. Its compact boarding
  summary uses **In {n} min · from {stop}** and may wrap to two lines, prefixed by **Early** or
  **Delayed** only when the live estimate differs from schedule by at least two
  minutes. **Scheduled** and **Simulated** remain explicit. Route headsign
  details appear after opening an option to keep the results list easy to scan.
  Warning and critical service
  alerts appear only on options whose route is affected. A failed official
  request shows a retry state before the clearly labeled simulated preview;
  loading and no-direct-trip states remain text-accessible and never leave a
  blank screen. The options list uses 16px screen-edge spacing; cards use 12px
  horizontal padding and a compact duration column so boarding details retain
  as much readable width as possible. Trip cards use `--radius-md`, and all
  boarding and alert copy wraps without line clamping. The departure control
  opens a mobile bottom sheet for **Now**, **Leave**, or **Arrive**. Leave and
  Arrive accept a time, update the compact button label, and use
  scheduled GTFS service rather than presenting future results as live. The
  closed control defaults to **Leave by {current time}** rather than a separate
  **Depart now** label. Choosing **Now** inside the time sheet resets the
  selection to the rider's current time and restores live planning. The sheet
  always opens on **Leave** with the time editor visible; it does not expose a
  separate date field. Time is selected through an inline, accessible
  hour–minute–AM/PM wheel that echoes familiar mobile transit pickers while
  retaining Holo Hele tokens and focus states. A selected time that has already
  passed is treated as the next day's occurrence. Selecting **Now** keeps the
  wheel visible and snaps all three columns back to the current time. **Now** is
  disabled while the picker already matches the current minute. A secondary
  **Time / Date** switch keeps upcoming-day selection separate from the wheel;
  past combinations are blocked with a plain-language recovery message.
  adjacent filter reorders options by **Best route**, **Least walking**, or
  **Fewest transfers**. Because this release supports direct trips only, the
  fewest-transfer choice may preserve the existing order. Both controls retain
  the compact Figma button treatment with chevrons; filters appear in a bordered,
  shadow-free menu and the time selection uses a separate white bottom sheet.
  The filter button remains labeled **Filter by** and exposes its current choice
  accessibly.
- Opening Plan Trip never triggers a new browser permission prompt. It silently
  uses location only when geolocation permission is already granted; otherwise
  it uses the labeled downtown preview origin. New permission requests remain
  attached to explicit onboarding and Settings actions.
- `/directions/[journeyId]` is the itinerary-led **Trip Details** screen. A
  compact, control-free route overview map provides geographic context without
  competing with the content. The summary makes departure, arrival, duration,
  modes, and live-versus-scheduled status immediately scannable. Below it, the
  complete walk–ride–walk timeline uses content-column dividers that do not cut
  across its vertical route rail. It follows the trip summary directly without
  a redundant **Trip itinerary** heading. Walking summaries expand into
  separated direction steps, an approximate-routing caution, and a destination
  cue. Mode icons sit with their labels so the rail remains continuous and its
  walking-versus-transit segments align cleanly. The bus number, route destination/name, ride duration,
  and stop count share one expandable ride section; opening it reveals the
  scheduled stop sequence and times without exposing stop IDs in the primary
  itinerary.
  Preview-origin implementation labels such as “Downtown Honolulu preview” and
  “Approximate device location” are not exposed here; an older fallback journey
  uses the neutral **Starting point** label, while permission-backed journeys
  use **Your location**.
  Matching service disruptions appear above the timeline. **Start** and
  **Favorite** remain in a sticky bottom action row; **Start** continues into
  the separate Live Direction experience.
- `/live-directions/[journeyId]` provides deterministic, manually switchable
  walking and onboard guidance states. The accessible middle progress control,
  labeled **I’m on the bus**, is the explicit boarding confirmation; the app
  does not infer boarding from GPS alone.

Official options use active service calendars, scheduled stop sequences and
route shapes. An HEA estimate is attached only when its trip ID exactly matches
the planned GTFS trip; unmatched options remain scheduled. Walking distances
use approximate stop proximity and straight map connectors, not street-level or
turn-by-turn routing. This first release supports direct bus trips only.

---

## Stop detail screen

Route: `/stops/[id]` · Figma node `1:1735` · Component: `StopDetailScreen`

Full-height layout without bottom nav. Page background `--canvas-soft`; list and header blocks use `--canvas`.

### Layout stack (top → bottom)

1. **Header card** — white, `border-b border-charcoal-500`  
2. **Scroll region** — `flex-1 overflow-y-auto`, soft gray background  
   - Sticky refresh bar  
   - Lines section (`LineTags`)  
   - Arrivals list  

### Nav bar (`StopDetailHeader`)

| Element | Spec |
|---------|------|
| Padding | `px-4`, top safe-area + 12px |
| Back | Context-aware link: `/favorites?tab=stops` when opened from saved stops, otherwise `/home`; 24px `arrowBack`, touch target 40×24px (`w-6`) |
| Title | “Stop”, centered, 16px semibold |
| Spacer | `w-6` right balance |
| Divider | `border-b border-hairline` below nav row |

### Stop hero

| Element | Spec |
|---------|------|
| Padding | `px-4 pb-4 pt-6` |
| Stop name | 18px medium, ink |
| Stop ID | 12px body, `Stop {id}` |
| Actions | Right-aligned row, 6px gap |

**Action buttons:**

| Button | Style |
|--------|-------|
| Schedule | Icon + “Schedule” label, `px-2`, gap 4px |
| Place | Icon only, `aria-label="Show stop on map"` |
| Favorite | Icon only, toggles `aria-label` and `aria-pressed`; selected state uses primary fill |
| Shared | `rounded-xs`, soft `--brand-blue-border` outline, brand-blue text/icons, `bg-brand-blue-subtle`, `p-2`, 20px icons; hover uses `bg-brand-blue-soft` |

(Place remains a visual placeholder. Favorite is persisted locally.)

### Refresh bar

| Property | Value |
|----------|-------|
| Position | Sticky top of scroll area, `z-10` |
| Background | `--canvas-soft` (matches page — no shadow) |
| Padding | `px-4 py-1.5` |
| Icon | 14px refresh, body color |
| Copy | `Last refresh: **{relative time}**` — label body, value bold ink |
| Live polling | Re-fetch every **30s** when `dataSource === "live"` |
| Relative time | Updates every second (“N seconds/minutes ago”) |

### Lines section (`LineTags`)

| Property | Value |
|----------|-------|
| Background | `--canvas` |
| Padding | `px-4 py-4` |
| Title | “Lines”, 14px bold |
| Tags | Wrap row, 4px gap; each tag `bg-canvas-soft`, 2px radius, 12px ink text |

### Arrivals list

| Property | Value |
|----------|-------|
| Background | `--canvas` |
| Divider | `divide-y divide-hairline` |
| Row (`StopArrivalItem`) | Min 67px, `px-4 py-3`, route badge + headsign + `ArrivalTimeDisplay` |
| Row layout | Same pattern as home `RouteArrivalRow` (without muted bg / indent) |

### Stop detail states

| State | Pattern |
|-------|-----------|
| Loading | Centered “Loading arrivals…” on white list area |
| Error | Centered error message — **no silent mock fallback** when API key is set |
| Empty | “No upcoming arrivals for this stop.” |
| Live | Auto-refresh; relative timestamp in refresh bar |

---

## Interface states (home)

Every data-driven surface needs:

| State | Pattern |
|-------|-----------|
| Loading | Centered 14px body text (“Loading nearby stops…”) |
| Empty | Centered explanation, no blank sheet |
| Error | Body text message; **never** swap in mock data when live API is configured |
| No API key | Server may return sample data for development preview |
| Live | No banner; arrival colors per [Arrival time display](#arrival-time-display) |

Focus: `outline-2 outline-primary outline-offset-2` on interactive elements.

Touch targets: minimum **40px** height on buttons and links.

---

## Figma inconsistencies (resolved)

| Topic | Figma `TheBus_V1` | Holo Hele (canonical) | Why |
|-------|-------------------|------------------------|-----|
| Shadows | M3 drops on search, chips, map, controls, sheet | **None** — hairlines only | Cleaner outdoor legibility; already shipped |
| Nav background | `#eef4fc` blue tint | **`--canvas-softer`** gray | Keeps black/white/charcoal system |
| Typography | Inter + Roboto mix | **Inter only** | One stack, simpler |
| Live green | `#0c9000` | **`--live` `#1a7f37`** | Slightly deeper green, WCAG-friendly on white |
| Far live icon | Gray waves in Figma | **`LiveSignalIcon` in `--body`** | Same shape, muted when > 20 min |
| Scheduled icon | Clock in Figma | **`ScheduleIcon`**, muted when far | Matches live/scheduled tone rules |
| Map | Static basemap image | **CARTO Light tiles** | Real pan/zoom |
| User dot | Blue composite | **Black 14px dot** | Matches `--primary` |
| Bus map pins | Blue circle | **Black circle, white bus** | Brand consistency |
| Search radius | 28px stadium | **`--radius-pill`** | Matches chips; Figma uses 28px |
| Route previews | Only under first stop in short sheet | **Up to 3 per stop** | Better scanability |
| Preview row height | ~47px content in frame | **67px** row | Matches implemented tap targets |
| Zoom / location radius | 2px / 28px pill | **8px** on controls | Unified control family |
| Map controls position | Fixed offset | **Tracks sheet** via `--sheet-height` | Controls stay above sheet when collapsed |
| Material icons | `ArrowDropDown` in sheet | **Figma chevron asset** | Icon set consistency |
| TheBus blue on icons | `#00418D` on some exports | **Black icons** on white/black UI | Avoid third brand color |
| Stop detail padding | Mixed px-7 in early frames | **`px-4` throughout** | Aligns header, lines, and rows |
| Stop detail nav | Gray bar in some exports | **White header card** + charcoal bottom border | Shipped pattern |

When updating Figma, align frames to this table — not the other way around.

---

## Component → file map

| UI block | Component | Path |
|----------|-----------|------|
| Home layout | `HomeScreen` | `components/home/HomeScreen.tsx` |
| App shell + nav | `AppShell`, `BottomNav` | `components/layout/` |
| Search + chips | `SearchOverlay`, `SearchBar`, `QuickDestinationChips` | `components/transit/`, `components/ui/` |
| Sheet | `NearbyStopsSheet` | `components/transit/NearbyStopsSheet.tsx` |
| Stop row | `StopListItem` | `components/transit/StopListItem.tsx` |
| Route preview | `RouteArrivalRow` | `components/transit/RouteArrivalRow.tsx` |
| Arrival time | `ArrivalTimeDisplay` | `components/transit/ArrivalTimeDisplay.tsx` |
| Stop detail page | `StopDetailScreen` | `components/stops/StopDetailScreen.tsx` |
| Route tracking | `TrackingScreen` | `components/tracking/TrackingScreen.tsx` |
| Stop header | `StopDetailHeader` | `components/stops/StopDetailHeader.tsx` |
| Stop arrival row | `StopArrivalItem` | `components/stops/StopArrivalItem.tsx` |
| Lines tags | `LineTags` | `components/stops/LineTags.tsx` |
| Map | `TransitMap`, `MapControls` | `components/map/` |
| Icons | `FigmaIcon`, `LiveSignalIcon`, `ScheduleIcon`, badges | `components/icons/FigmaIcon.tsx` |
| Tokens | CSS variables | `src/styles.css` |

---

## Do's and Don'ts

### Do

- Use semantic tokens (`text-body`, `bg-canvas-muted`, `border-hairline`) — not raw hex in components.
- Keep route badges and stop signs on the **black thick-bottom border** pattern.
- Show **live vs scheduled** distinctly; use `--live` only for estimated near-term arrivals.
- Always show the live wave icon on estimated rows — mute it (`text-body`) when > 20 min.
- Always show the clock icon on scheduled rows — mute when not near-term.
- Preserve **94px stop row + indented preview rows** rhythm on home.
- Keep **horizontal padding at `px-4`** aligned across stop header, lines, refresh bar, and arrival rows.

### Don't

- Add drop shadows to app components.
- Use blue accent colors for chrome or icons.
- Mix icon libraries on transit screens.
- Hide failed API data behind mock arrivals when TheBus API key is configured.
- Reduce preview rows to first-stop-only (regression).
- Use Roboto or Material icons in new work.
- Show bottom nav on stop detail (full-height arrivals focus).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-17 | v1.0 — Home + Stop canonical spec; Figma inconsistency table; replaces Uber marketing `DESIGN.md` |
| 2026-07-17 | v1.1 — Full stop detail spec; arrival icon tone rules (`LiveSignalIcon` / `ScheduleIcon`); map controls track sheet; removed mock banner; live refresh + sticky refresh bar; `px-4` alignment |
| 2026-07-17 | v1.2 — Route Interaction tracking screen (`1:1698`); full-bleed map, floating card, route line + ETA bus marker |
| 2026-07-17 | v1.3 — Route Interaction Figma alignment: 320px card inset, `--radius-xs`, stops-away banner, route stop dots (12px / 18px) |
| 2026-07-17 | v1.4 — GTFS-backed route stops, click-only stop callouts, swipeable bus carousel, dynamic distance wording, full-row Home links, and combined Settings / More Information structure |
| 2026-07-17 | v1.5 — Restored compact tracking pagination, neutral-gray hover states, and a white persistent bottom navigation |
| 2026-08-14 | v1.6 — Completed Favorites buses/stops tabs, locally persisted preview favorites, bus detail, line selection, and official GTFS daily schedules |
| 2026-08-16 | v1.7 — Added live Service Disruption states, exact contextual alert matching, visibly separate demo scenarios, and opt-in service-notification controls |
| 2026-08-16 | v1.8 — Required route-plus-stop matching for bus alerts, clarified whole versus route-specific stop closures, added semantic yellow/red alert colors, and introduced single-alert detail pages |
| 2026-08-17 | v1.9 — Added two persistent saved-stop disruption examples with live-notice precedence and labeled demo fallbacks; kept route-only alert entries out of Buses |
| 2026-08-18 | v1.9 — Extended the Stop 1712 and Stop 1016 demo states to top-positioned stop-detail alert blades with specific View explanations |
| 2026-08-19 | v2.0 — Added all official Oʻahu GTFS stops to Home with viewport filtering, zoom-aware compact markers, and on-demand selected-stop service loading |
