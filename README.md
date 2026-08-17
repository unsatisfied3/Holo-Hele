# Holo Hele

Holo Hele is a mobile-first Oʻahu transit app built with React, TanStack Router,
TanStack Query, Vite, Bun, and Tauri 2.

## Prerequisites

- [Bun](https://bun.sh/)
- [Rust](https://rustup.rs/) and the
  [Tauri system prerequisites](https://v2.tauri.app/start/prerequisites/)
  for desktop builds
- On Windows, Visual Studio Build Tools with the Desktop development with C++
  workload and Windows SDK

## Local setup

1. Run `bun install`.
2. Run `bun x playwright install chromium` if you will run browser tests.
3. Copy `.env.example` to `.env.local`.
4. Add `THEBUS_API_KEY` for live arrivals, or leave the placeholder/variable
   unset to use the official GTFS stop locations and scheduled services.
5. Run `bun run dev` for the browser app and Bun API.
6. Open `http://localhost:1420`.

Use `bun run tauri:dev` to launch the desktop app. The Tauri command starts the
same Vite and Bun development services automatically.

## Commands

- `bun run dev` — browser app and API in watch mode
- `bun run build` — type-check and build the browser app
- `bun run api` — Bun API only
- `bun run lint` — ESLint
- `bun run test:smoke` — mobile route and keyboard smoke test
- `bun run typecheck` — TypeScript
- `bun run tauri:dev` — Tauri development app
- `bun run tauri:build` — production desktop bundle

## Production deployment

The TheBus key must remain on the Bun server. Deploy `server/index.ts` as a
Bun service, set `THEBUS_API_KEY` and `API_ALLOWED_ORIGINS` there, and build the
web and Tauri clients with `VITE_API_BASE_URL` set to that HTTPS service.

The static web build is emitted to `dist/`. Configure the web host to fall back
to `index.html` for client-side routes such as `/stops/:id`.
