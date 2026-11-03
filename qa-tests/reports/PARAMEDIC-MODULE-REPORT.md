# Paramedic Module QA Report

*Updated: 2026-11-03. An earlier version said the whole module was NOT_IMPLEMENTED; that is no longer accurate.*

## What exists now

**Backend**
- `Paramedic` model and paramedic registration (public, invited and admin-created) with a paramedic profile row.
- Workload-balanced paramedic selection and ambulance dispatch (`backend/src/domains/care/emergency/`).
- Dispatch status updates restricted to the assigned paramedic or an administrator (`DISPATCHED → EN_ROUTE → ARRIVED → COMPLETED`, or `CANCELLED`).
- Automatic patient–paramedic and nurse–paramedic chat threads when a paramedic is assigned.

**Mobile**
- Paramedic login routes to `/(paramedic)` (the earlier redirect loop to the patient portal is fixed in `mobile/src/utils/authRouting.ts`).
- `/(paramedic)` renders the shared `EmergencyWorkspace`: list of the paramedic's dispatches, status buttons, location sharing and admission requests.

**Demo data**
- `pnpm --filter healix-backend seed:demo` creates `paramedic1@gmail.com` and `paramedic2@gmail.com` (verified), 4 demo hospitals and 3 ambulances.

## Still missing
- A dedicated paramedic dashboard design (currently one shared operations screen).
- A paramedic messages screen (threads are created, but there is no paramedic chat route).
- Paramedic profile, settings and notification screens.
- Physical device testing of location sharing.
