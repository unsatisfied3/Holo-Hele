# Holo Hele Design System

**Version:** 1.3 (Home + Stop Detail + Route Interaction)  
**Figma reference:** `TheBus_V1` — Home expanded `1:568`, Stop Information `1:1735`, Route Interaction `1:1698`  
**Code tokens:** `app/globals.css`

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

- **Calm and flat** — hairline borders, no decorative shadows.
- **Black + white + charcoal** — brand actions use `--primary` black; secondary text uses the charcoal scale.
- **One accent only** — live arrival green (`--live`); nothing else competes for attention.
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

Defined in `:root` in `app/globals.css`.

### Brand

| Token | CSS variable | Hex | Use |
|-------|--------------|-----|-----|
| Primary | `--primary` | `#000000` | CTAs, map user dot, bus markers, route badge borders |
| On primary | `--on-primary` | `#ffffff` | Text/icons on black fills |
| Ink | `--ink` | `#000000` | Headlines, primary labels, near-term scheduled times |
| Live | `--live` | `#1a7f37` | Estimated arrivals ≤ 20 min, “Now” |
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
| `--canvas-softer` | charcoal-200 | Bottom nav, View button fill, stop action buttons |
| `--hairline` / `--border` | `#e4e4e7` | All dividers and control borders |
| `--surface-pressed` | charcoal-500 | Pressed/disabled fills |

**Do not** reintroduce Figma’s `primary/blue-200` (`#eef4fc`) nav tint or TheBus blue (`#00418D`) on UI chrome — map markers and badges stay **black/white**.

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
| Nav label | 12px (`text-xs`) | 500 | normal | Map / Favorites / Help |
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

**Flat UI — no drop shadows on app components.**

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
| `busStopSign` | 17×21px | Stop list row |
| `busRoute` | 14×17px | Route badge inside preview |
| `chevronDown` | 16px | Sheet expand toggle |
| `zoomIn`, `zoomOut`, `myLocation` | 24px | Map controls |
| `mapNav`, `favorites`, `help` | 24px | Bottom nav |
| `arrowBack` | 24px | Stop detail back link |
| `refresh` | 14px | Stop detail refresh line |
| `schedule` | 20px | Stop detail Schedule action button |
| `place`, `favorite` | 20px | Stop detail icon-only actions |

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

Sheet expanded/collapsed state lives in `HomeScreen` and drives CSS variable `--sheet-height` so map controls track the sheet.

### Map

| Element | Spec |
|---------|------|
| Tiles | CARTO Light (`light_all`) — neutral gray streets, not Figma static screenshot |
| Default zoom | 15 |
| User location | 14px black dot, 3px white border |
| Stop markers | 36px black circle + bus icon; tap → popup with link to `/stops/[id]` |
| Controls | Custom (Leaflet zoom disabled); see [Map controls](#map-controls) |

### Search overlay

| Element | Spec |
|---------|------|
| Position | `top: safe-area + 2.5rem`, horizontal `16px` padding |
| Search bar height | **47px** |
| Search bar radius | `--radius-pill` |
| Search bar border | `1px hairline`, bg `--canvas` |
| Chips | Row below search, `8px` gap, wrap allowed |

### Destination chips (`Chip`)

| Property | Value |
|----------|-------|
| Height | 30px |
| Padding | 8px horizontal |
| Radius | pill |
| Border | hairline |
| Background | canvas |
| Icon + label gap | 8px |

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
| View | Link to `/stops/[id]`, 12px medium, bg `--canvas-softer`, hairline border, 4px radius |

**Route preview row (`RouteArrivalRow`):**

| Property | Value |
|----------|-------|
| Height | 67px |
| Background | `--canvas-muted` (charcoal-100) |
| Left padding | 32px (`pl-8`) — aligns under stop text, not icon |
| Layout | Route badge · headsign · `ArrivalTimeDisplay` (right) |
| Divider | `divide-y divide-hairline` on list |

**Footer timestamp:** When data is loaded, show “Updated {time}” in 12px mute text at bottom of sheet.

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
| Background | `--canvas-softer` (not Figma blue tint) |
| Top border | hairline |
| Items | 3 equal columns: Map, Favorites, Help |
| Icon | 24px Figma asset |
| Label | 12px medium |
| Active state | canvas bg on item, ink text |
| Inactive | body text, hover → canvas bg |
| Visibility | Shown on `/home`, `/favorites`, `/help` only — **hidden on stop detail** |

---

## Route Interaction (tracking)

Route: `/stops/[id]/track/[arrivalId]` · Figma node `1:1698` · Component: `TrackingScreen`

Opened when a rider taps an arrival row on stop detail. Full-bleed map with overlays — not a stacked header + scroll layout.

### Layout stack

1. **Map** — full viewport, CARTO Light tiles  
2. **Top overlay** — white bar, back arrow + centered **“Tracking”**  
3. **Map controls** — right side, above bottom card (`.tracking-map__controls`)  
4. **Bottom floating card** — 320px-wide card on a 375px frame (`27.5px` horizontal inset via `.tracking-summary`), `--radius-xs`, hairline border  
5. **Stops away banner** — centered pill above card (e.g. “8 stops away”)

### Map markers (canonical)

| Element | Spec |
|---------|------|
| Route segment | `--body` polyline through intermediate stop positions (until GTFS shape is wired) |
| Intermediate stops | 12px black dot, white ring — spaced along route |
| Destination stop | 18px black dot, white ring |
| Bus | 40px black circle, white bus icon, **ETA pill** below (e.g. “2 min”) |
| Unavailable GPS | Banner under header; map centers on stop |

### Bottom card

| Element | Spec |
|---------|------|
| Stops away | Banner above card — `{n} stops away` or `Arriving at your stop` |
| Travel time | `Travel Time: {n} min` or `Arriving now` — 12px medium body |
| Route row | Route badge · headsign · stop name · `ArrivalTimeDisplay` |
| Page dots | 4 dots below card (visual only for v1 — carousel deferred) |

Figma’s Route Interaction frame also shows multi-route carousel dots; only the first panel is implemented until directions data exists.

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
| Back | Link to `/home`, 24px `arrowBack`, touch target 40×24px (`w-6`) |
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
| Favorite | Icon only, `aria-label="Save to favorites"` |
| Shared | `rounded-xs`, `border-charcoal-600`, `bg-canvas-softer`, `p-2`, 20px icons |

(Place and Favorite are visual placeholders — not wired yet.)

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
| Tokens | CSS variables | `app/globals.css` |

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
