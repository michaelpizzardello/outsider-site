# Architecture Overview

This project uses Next.js (App Router) with Shopify as the primary data source and is deployed on Vercel. The goals of this architecture are: clarity, modularity, and ease of navigation while keeping styling and functionality stable.

The approach is incremental: we stabilise working routes (Home and Exhibitions index), clean up confusing areas (Exhibition detail subcomponents), and then evolve towards a clear feature‑oriented structure.

## High‑Level Structure

- `app/` — Route files (server by default)
  - Colocate only route‑specific helpers/components that aren’t reused elsewhere.
  - Prefer server components for pages; use client components only when interactivity is required.
- `components/` — Reusable UI components
  - Global layout: header, footer, container, navigation.
  - Domain components: grouped by feature (e.g. `components/exhibition/*`).
  - Client components are explicitly marked with "use client" at the top.
- `lib/` — Server‑side utilities and data access
  - Shopify client and typed helpers.
  - Data mappers and formatting helpers.
  - No client‑only runtime dependencies here; keep it server‑safe.
- `public/` — Static assets.
- `styles/` (if added later) — Any global CSS beyond Tailwind’s `globals.css`.

This keeps the App Router clean and makes feature boundaries obvious.

## Naming & Conventions

- Components
  - File names are PascalCase for components: `Header.tsx`, `ShareButton.tsx`.
  - Each component file exports a single default component.
  - Keep implementation colocated with variants/styles when it’s domain‑specific (e.g. `components/exhibition/*`).
  - Prefer Tailwind for styling; avoid ad‑hoc CSS modules unless they’re providing unique, reusable styles.
- Server vs Client
  - Server by default. Add `"use client"` only for components reading `window`, using hooks, or handling events.
  - Keep server‑only code in `lib/*` and import it only from server files.
- Data & Types
  - Shopify GraphQL lives in `lib/shopify.ts`.
  - Mapping Shopify metaobjects → app types lives in `lib/exhibitions.ts`.
  - Date formatting and richtext helpers live in `lib/*`.
- Imports
  - `@/` alias points to the project root (see `tsconfig.json`).
  - From routes → import UI from `@/components/...` and server utilities from `@/lib/...`.

## Feature Modules (Roadmap)

Going forward, we’ll evolve components into feature modules to improve discoverability:

- `components/layout/*` — Header, Footer, Navigation, Container, Logo
- `components/exhibitions/*` — Exhibition domain components (Hero, Cards, Details)
- `lib/exhibitions/*` (optional sub‑folder) — Exhibition‑specific queries/mappers

We’ll introduce barrel files (`index.ts`) where helpful, and update imports in pages as we move pieces. This will be done incrementally to avoid breaking the already working pages.

## Testing & Verification

- Routes remain server components where possible, keeping bundles lean.
- After each structural change, run the app and verify Home and Exhibitions index for parity in styling and behaviour.

## Current Step

First pass focuses on fixing the exhibition detail subcomponents (naming mismatches and a missing CSS module) without changing the Home/Index behaviour. Subsequent passes will reorganise layout components under `components/layout` and consolidate exhibition‑specific UI under `components/exhibitions` with updated imports.

