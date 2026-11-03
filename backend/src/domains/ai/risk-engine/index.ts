/**
 * Healix risk engine.
 *
 * One place that turns what a nurse records at a visit (vitals, symptoms, notes and the
 * nurse's confidence) into a risk tier and a 0-100 score. Every risk assessment in the
 * backend goes through `RiskEngine.assess`, so the trained model planned for FYP-2 only
 * has to be plugged in here.
 *
 * CURRENT VERSION: rule-based baseline ("rules-v1"). It is NOT a trained machine-learning
 * model. Vital-sign points follow the bands of the NHS NEWS2 early-warning score for the
 * four NEWS2 parameters Healix records (SpO2, systolic BP, pulse, temperature); respiratory
 * rate and consciousness are not captured yet. Diastolic BP and blood sugar use additional
 * fixed thresholds. Notes are screened by keywords only (no negation handling).
 *
 * This is decision support for clinicians, not a diagnosis.
 */

export const RISK_ENGINE_VERSION = 'rules-v1';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskVitals {
  systolic?: number | null;
  diastolic?: number | null;
  heartRate?: number | null;
  temperature?: number | null;
  oxygenSaturation?: number | null;
  bloodSugar?: number | null;
}

export interface RiskSymptom {
  symptomName: string;
  severity: string;
}

export interface RiskInput {
  vitals?: RiskVitals | null;
  symptoms?: RiskSymptom[];
  notes?: string | null;
  /** Nurse's confidence in the assessment, 1 (unsure) to 5 (very sure). */
  nurseConfidence: number;
}

export interface VitalFinding {
  vital: keyof RiskVitals;
  value: number;
  points: number;
  reason: string;
}

export interface RiskResult {
  riskTier: RiskTier;
  /** 0-100, higher means more urgent. */
  fusedScore: number;
  /** Output of a trained model. Always 0 until the FYP-2 model is connected. */
  mlScore: number;
  totalPoints: number;
  redFlag: boolean;
  vitalsRecorded: boolean;
  explanation: {
    engine: string;
    method: string;
    vitalPoints: number;
    symptomPoints: number;
    notePoints: number;
    findings: VitalFinding[];
    noteKeywords: string[];
    nurseConfidence: number;
    adjustments: string[];
    interpretation: string;
  };
}

const TIER_ORDER: RiskTier[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Points at or above these totals reach each tier.
const TIER_THRESHOLDS = { MEDIUM: 3, HIGH: 6, CRITICAL: 9 };
// A total of this many points maps to a fused score of 100.
const SCORE_CEILING = 12;

const HIGH_CONCERN_TERMS = [
  'unconscious', 'unresponsive', 'not breathing', 'chest pain', 'shortness of breath', 'breathless',
  'severe bleeding', 'bleeding', 'seizure', 'confused', 'confusion', 'unstable', 'collapsed',
  'severe', 'critical', 'cyanosis', 'blue lips'
];
const MODERATE_CONCERN_TERMS = [
  'pain', 'swelling', 'cough', 'weak', 'weakness', 'dizzy', 'dizziness', 'vomiting', 'vomit',
  'fever', 'redness', 'infection', 'worse', 'worsening', 'pus'
];

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function band(points: number, reason: string, vital: keyof RiskVitals, value: number): VitalFinding | null {
  return points > 0 ? { vital, value, points, reason } : null;
}

function scoreOxygen(value: number): VitalFinding | null {
  if (value <= 91) return band(3, 'SpO2 91% or lower', 'oxygenSaturation', value);
  if (value <= 93) return band(2, 'SpO2 92-93%', 'oxygenSaturation', value);
  if (value <= 95) return band(1, 'SpO2 94-95%', 'oxygenSaturation', value);
  return null;
}

function scoreSystolic(value: number): VitalFinding | null {
  if (value <= 90) return band(3, 'Systolic BP 90 or lower', 'systolic', value);
  if (value <= 100) return band(2, 'Systolic BP 91-100', 'systolic', value);
  if (value <= 110) return band(1, 'Systolic BP 101-110', 'systolic', value);
  if (value >= 220) return band(3, 'Systolic BP 220 or higher', 'systolic', value);
  return null;
}

function scoreHeartRate(value: number): VitalFinding | null {
  if (value <= 40) return band(3, 'Pulse 40 or lower', 'heartRate', value);
  if (value <= 50) return band(1, 'Pulse 41-50', 'heartRate', value);
  if (value <= 90) return null;
  if (value <= 110) return band(1, 'Pulse 91-110', 'heartRate', value);
  if (value <= 130) return band(2, 'Pulse 111-130', 'heartRate', value);
  return band(3, 'Pulse 131 or higher', 'heartRate', value);
}

function scoreTemperature(value: number): VitalFinding | null {
  if (value <= 35.0) return band(3, 'Temperature 35.0 °C or lower', 'temperature', value);
  if (value <= 36.0) return band(1, 'Temperature 35.1-36.0 °C', 'temperature', value);
  if (value <= 38.0) return null;
  if (value <= 39.0) return band(1, 'Temperature 38.1-39.0 °C', 'temperature', value);
  return band(2, 'Temperature 39.1 °C or higher', 'temperature', value);
}

function scoreDiastolic(value: number): VitalFinding | null {
  if (value >= 120) return band(3, 'Diastolic BP 120 or higher', 'diastolic', value);
  if (value >= 110) return band(2, 'Diastolic BP 110-119', 'diastolic', value);
  return null;
}

function scoreBloodSugar(value: number): VitalFinding | null {
  if (value < 54) return band(3, 'Blood sugar below 54 mg/dL', 'bloodSugar', value);
  if (value < 70) return band(2, 'Blood sugar 54-69 mg/dL', 'bloodSugar', value);
  if (value >= 400) return band(3, 'Blood sugar 400 mg/dL or higher', 'bloodSugar', value);
  if (value >= 300) return band(2, 'Blood sugar 300-399 mg/dL', 'bloodSugar', value);
  return null;
}

function scoreVitals(vitals: RiskVitals | null | undefined) {
  const findings: VitalFinding[] = [];
  let recorded = false;
  const checks: Array<[number | null | undefined, (value: number) => VitalFinding | null]> = [
    [vitals?.oxygenSaturation, scoreOxygen],
    [vitals?.systolic, scoreSystolic],
    [vitals?.heartRate, scoreHeartRate],
    [vitals?.temperature, scoreTemperature],
    [vitals?.diastolic, scoreDiastolic],
    [vitals?.bloodSugar, scoreBloodSugar]
  ];
  for (const [value, scorer] of checks) {
    if (!isNumber(value)) continue;
    recorded = true;
    const finding = scorer(value);
    if (finding) findings.push(finding);
  }
  return { findings, recorded };
}

function scoreSymptoms(symptoms: RiskSymptom[] | undefined): number {
  let points = 0;
  for (const symptom of symptoms ?? []) {
    const severity = symptom.severity.toUpperCase();
    if (severity === 'SEVERE') points += 2;
    else if (severity === 'MODERATE') points += 1;
  }
  return Math.min(points, 4);
}

function scoreNotes(notes: string | null | undefined) {
  const text = (notes ?? '').toLowerCase();
  if (!text.trim()) return { points: 0, keywords: [] as string[] };
  const high = HIGH_CONCERN_TERMS.filter(term => text.includes(term));
  if (high.length) return { points: 2, keywords: high };
  const moderate = MODERATE_CONCERN_TERMS.filter(term => text.includes(term));
  if (moderate.length) return { points: 1, keywords: moderate };
  return { points: 0, keywords: [] as string[] };
}

function tierFromPoints(points: number): RiskTier {
  if (points >= TIER_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (points >= TIER_THRESHOLDS.HIGH) return 'HIGH';
  if (points >= TIER_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

function raise(tier: RiskTier, minimum: RiskTier): RiskTier {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(minimum) ? tier : minimum;
}

function stepUp(tier: RiskTier): RiskTier {
  return TIER_ORDER[Math.min(TIER_ORDER.indexOf(tier) + 1, TIER_ORDER.length - 1)];
}

export class RiskEngine {
  static assess(input: RiskInput): RiskResult {
    const confidence = Math.min(5, Math.max(1, Math.round(input.nurseConfidence || 3)));
    const { findings, recorded } = scoreVitals(input.vitals);
    const vitalPoints = findings.reduce((sum, finding) => sum + finding.points, 0);
    const symptomPoints = scoreSymptoms(input.symptoms);
    const notes = scoreNotes(input.notes);
    const totalPoints = vitalPoints + symptomPoints + notes.points;
    const redFlag = findings.some(finding => finding.points >= 3);
    const adjustments: string[] = [];

    let riskTier = tierFromPoints(totalPoints);
    if (redFlag) {
      const raised = raise(riskTier, 'MEDIUM');
      if (raised !== riskTier) adjustments.push('A single vital sign scored 3 points (red flag): raised to at least MEDIUM.');
      riskTier = raised;
    }
    if (confidence <= 2 && riskTier !== 'CRITICAL') {
      riskTier = stepUp(riskTier);
      adjustments.push(`Nurse confidence ${confidence}/5 is low: raised one tier to be cautious.`);
    }
    if (!recorded) {
      adjustments.push('No vital signs were recorded: the tier relies on symptoms, notes and nurse confidence only.');
    }

    const fusedScore = Math.min(100, Math.round((totalPoints / SCORE_CEILING) * 100));

    return {
      riskTier,
      fusedScore,
      mlScore: 0,
      totalPoints,
      redFlag,
      vitalsRecorded: recorded,
      explanation: {
        engine: RISK_ENGINE_VERSION,
        method: 'Rule-based baseline (NEWS2 vital-sign bands + symptom and note screening). Not a trained model.',
        vitalPoints,
        symptomPoints,
        notePoints: notes.points,
        findings,
        noteKeywords: notes.keywords,
        nurseConfidence: confidence,
        adjustments,
        interpretation: `${riskTier} risk: ${totalPoints} point(s) from vitals ${vitalPoints}, symptoms ${symptomPoints}, notes ${notes.points}.`
      }
    };
  }
}
