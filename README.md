# Healix

Healthcare project with a backend API, an Expo SDK 58 mobile app, a React + Vite web dashboard, and Playwright browser QA tests.

## Project map

| Folder | Purpose |
| --- | --- |
| `backend/src/` | Runtime API code: domain modules, shared infrastructure, and routes |
| `backend/prisma/` | Database schema |
| `backend/scripts/` | Explicitly run database tools, audits, and manual integration checks |
| `backend/docs/` | Backend architecture, conventions, and decisions |
| `mobile/src/` | Expo Router screens (Expo SDK 58 / React Native 0.88), components, API clients, hooks, and types |
| `mobile/assets/` | App images and icons |
| `mobile/docs/` | Implementation history and completion reports |
| `web/src/` | Web portal dashboard for System Administrators and Doctors |
| `designs/` | Interactive full-platform HTML clinical UI/UX design studio (`healix-full-platform-design-studio.html`) |
| `qa-tests/` | Playwright suites, fixtures, and curated reports |
| `docs/` | Product documents, design references, audits, and learning material |
| `archive/` | Historical tools and test snapshots |
| `backend/archive/` | One-off backend patches retained for reference |

The shared [design system](HEALIX_DESIGN_SYSTEM.md) and agent instructions remain at their existing locations.

## Clinical UI/UX & Role Architecture

- **Authoritative Design System**: Clinical Navy (`#0B4268` / `#06294B`), Accent Blue (`#29A9F5`), Care Emerald (`#10B981`), and high-contrast WCAG AA Light (`#F8FAFC`) & Dark Night (`#020B18`) palettes shared across web CSS variables (`web/src/styles/index.css`) and mobile theme tokens (`mobile/src/theme.ts`).
- **Universal Dark Mode & Security Settings**: `AppearanceSettings` and `ThemeToggleButton` are available across Auth, Patient, Nurse, Doctor, Paramedic, and Admin views along with Password Change and Two-Step Verification (`/auth/security`).
- **Mobile Navigation & Forms**: Safe-area-aware lifted bottom tab bars prevent overlap with Android system navigation, and all mobile/web forms use standardized outlined inputs.
- **5-Role Portals**:
  - **Mobile App (`Expo SDK 58` / Expo Go compatible)**: Patient, Nurse, Doctor, Paramedic (`EmergencyWorkspace`), and Admin Operations Command Center.
  - **Web Portal**: Administrator Command Center & active Operations/Support panel (including live User Profile Editor and Role Capability overrides), Doctor Clinical Portal, and self-service Invitation Acceptance on sign-in.

## Install and run

Use Node.js and pnpm for the root workspace (`backend` and `mobile`):

```sh
pnpm install --frozen-lockfile
pnpm backend:dev
pnpm mobile:start
```

If pnpm is accessed through Corepack on your machine, use `corepack pnpm` in place of `pnpm`.

The web dashboard and QA package currently have separate npm lockfiles. Install them from the root with:

```sh
npm --prefix web ci
npm --prefix qa-tests ci
pnpm web:dev
```

Configure `backend/.env` before starting the API. Its required variables are `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`; see `backend/src/common/config/index.ts` for validation and optional settings. Prisma uses PostgreSQL. Generate the client with `pnpm --filter healix-backend prisma:generate` and apply development migrations with `pnpm --filter healix-backend prisma:migrate` against your development database.

## Checks

```sh
pnpm backend:test
pnpm backend:typecheck
pnpm backend:build
pnpm --filter healix-mobile exec tsc --noEmit
pnpm --filter healix-mobile test
pnpm mobile:lint
pnpm web:build
pnpm qa:list
pnpm qa:test
```

Browser QA needs the app and API running, suitable test data, and Playwright's Chromium installed. Check [QA setup](qa-tests/README.md) before running it.

## Maintenance

Start with the [documentation index](docs/README.md) and [backend script guide](backend/scripts/README.md). Historical scripts can patch source files or change database data; they are kept outside runtime source and automated test discovery.

Keep runtime code in each app's `src/`, reusable maintenance tools in `scripts/`, written references in `docs/`, and generated output out of Git. See the [cleanup record](docs/maintenance/project-cleanup.md) for relocation details.
