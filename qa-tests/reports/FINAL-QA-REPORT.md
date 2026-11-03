# Healix QA Status

*Updated: 2026-11-03. This replaces an earlier version that called the platform "ready for production deployment"; that claim was not supported and has been withdrawn.*

## Current status

Healix is a final-year project in active development. It is **not production-ready**.

### Verified earlier (see the linked records for evidence)
- Backend automated suite: 17 suites / 124 tests passing in an isolated PostgreSQL schema (2026-10-06, `docs/maintenance/module-completion-tracker-2026-10-05.md`).
- HTTP/PostgreSQL workflow scripts for authentication, nurse/patient care, marketplace/contracts and the emergency fleet passed in separate temporary schemas (same record).
- Browser checks of authentication screens (`docs/testing/RUN-LOG.md`).

### Changed on 2026-11-03 (re-run the suite to confirm)
- SLA escalation no longer writes the non-existent user `'SYSTEM'` to `assignment_logs` (this foreign-key failure blocked escalation to GENERAL_BROADCAST).
- Risk scoring moved to `backend/src/domains/ai/risk-engine` (rule-based baseline using vitals, symptoms, notes and nurse confidence). Previously the visit flow scored risk from nurse confidence alone.
- `/auth/reset-password` no longer reveals whether an account exists.
- Demo seed now includes paramedics, hospitals and ambulances.

### Not yet verified
- Physical Android/iOS device testing (camera, GPS, secure storage, notifications).
- Live Gmail delivery (needs SMTP credentials in `backend/.env`).
- Push notifications and SMS: still console-log placeholders.
- Payment gateway: not implemented.
- Trained AI model: not implemented (planned for FYP-2).
- Load, security penetration and deployment testing.
