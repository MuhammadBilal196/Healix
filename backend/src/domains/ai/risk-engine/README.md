# Risk engine

Every risk assessment in Healix goes through `RiskEngine.assess()` in `index.ts`:

- `POST /visits/:id/clinical-remarks` (the nurse finishes a visit), via `SubmitClinicalRemarksUseCase`
- `POST /clinical/risk-assess` (on-demand assessment), via `ClinicalService.performRiskAssessment`

## Current version: `rules-v1` (rule-based baseline)

This is **not** a trained model. It adds up points:

| Input | Points |
| --- | --- |
| SpO2, systolic BP, pulse, temperature | NEWS2 bands (0–3 each) |
| Diastolic BP | 110–119 → 2, 120+ → 3 |
| Blood sugar | <54 → 3, 54–69 → 2, 300–399 → 2, 400+ → 3 |
| Symptoms | moderate +1, severe +2 (max 4) |
| Nurse notes | keyword screen: concerning words +1 or +2 |

Tiers: 0–2 LOW, 3–5 MEDIUM, 6–8 HIGH, 9+ CRITICAL. Any single vital worth 3 points makes the result at least MEDIUM. Nurse confidence of 1–2 raises the tier one step. Each saved assessment keeps the full breakdown in `RiskAssessment.explanation`.

Cases: MEDIUM opens a doctor case with a 20-minute deadline; HIGH and CRITICAL open one with a 5-minute deadline.

Known limits: respiratory rate and consciousness are not recorded yet, and the notes screen has no negation handling ("no chest pain" still matches "chest pain").

## FYP-2: trained model

Train a model on the same inputs (`RiskInput`) and return its probability as `mlScore` (currently always 0). Keep the rule-based result next to it, so the doctor screen can show both and the rules remain a safety net if the model is unavailable.
