import { RiskEngine, RISK_ENGINE_VERSION } from '../index';

const normalVitals = { systolic: 120, diastolic: 80, heartRate: 75, temperature: 37, oxygenSaturation: 98 };

test('normal vitals with routine notes are LOW and open no case', () => {
  const result = RiskEngine.assess({ vitals: normalVitals, notes: 'Routine visit, patient comfortable.', nurseConfidence: 4 });
  expect(result.riskTier).toBe('LOW');
  expect(result.fusedScore).toBe(0);
  expect(result.explanation.engine).toBe(RISK_ENGINE_VERSION);
});

test('a confident nurse alone no longer makes a visit HIGH risk', () => {
  expect(RiskEngine.assess({ vitals: normalVitals, nurseConfidence: 5 }).riskTier).toBe('LOW');
});

test('fever, raised pulse and wound symptoms together are HIGH', () => {
  const result = RiskEngine.assess({
    vitals: { systolic: 132, diastolic: 86, heartRate: 94, temperature: 38.6, oxygenSaturation: 95 },
    symptoms: [{ symptomName: 'Wound redness', severity: 'MODERATE' }, { symptomName: 'Fever', severity: 'MODERATE' }],
    notes: 'Patient reports feeling weak since last night.',
    nurseConfidence: 4
  });
  expect(result.riskTier).toBe('HIGH');
  expect(result.explanation.findings.map(f => f.vital)).toEqual(expect.arrayContaining(['heartRate', 'temperature', 'oxygenSaturation']));
});

test('one dangerous vital sign is at least MEDIUM', () => {
  const result = RiskEngine.assess({ vitals: { oxygenSaturation: 89 }, nurseConfidence: 5 });
  expect(result.redFlag).toBe(true);
  expect(result.riskTier).toBe('MEDIUM');
});

test('several dangerous vitals are CRITICAL', () => {
  const result = RiskEngine.assess({
    vitals: { systolic: 88, heartRate: 128, temperature: 39.5, oxygenSaturation: 91 },
    notes: 'Patient is confused.',
    nurseConfidence: 4
  });
  expect(result.riskTier).toBe('CRITICAL');
  expect(result.fusedScore).toBe(100);
});

test('low nurse confidence raises the tier one step', () => {
  expect(RiskEngine.assess({ vitals: normalVitals, nurseConfidence: 1 }).riskTier).toBe('MEDIUM');
});

test('missing vitals are reported in the explanation', () => {
  const result = RiskEngine.assess({ nurseConfidence: 3 });
  expect(result.vitalsRecorded).toBe(false);
  expect(result.explanation.adjustments.join(' ')).toContain('No vital signs');
});

test('no trained model is claimed yet', () => {
  expect(RiskEngine.assess({ vitals: normalVitals, nurseConfidence: 3 }).mlScore).toBe(0);
});
