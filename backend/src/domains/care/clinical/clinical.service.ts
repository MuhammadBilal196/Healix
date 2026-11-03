import { AppError } from '../../../common/errors/AppError';
import { HTTP_STATUS } from '../../../common/constants/index';
import { ClinicalRepository } from './clinical.repository';
import { VisitAccessPolicy, VisitActor } from '../visit/shared/policies/visit-access.policy';
import { RiskEngine } from '../../ai/risk-engine';

export class ClinicalService {
  public static async performRiskAssessment(
    data: {
      visitId?: string;
      patientId: string;
      nurseConfidence: number;
    },
    simulateTimeout = false
  ) {
    // Test hook kept from the original API: marks the record as produced after a model timeout.
    const timedOut = simulateTimeout;

    const vitals = data.visitId
      ? await ClinicalRepository.findLatestVitalsForVisit(data.visitId)
      : await ClinicalRepository.findLatestVitalsForPatient(data.patientId);

    let visitNotes = '';
    let symptoms: Array<{ symptomName: string; severity: string }> = [];
    if (data.visitId) {
      const [visit, remark, visitSymptoms] = await Promise.all([
        ClinicalRepository.findVisitById(data.visitId),
        ClinicalRepository.findClinicalRemark(data.visitId),
        ClinicalRepository.findSymptomsForVisit(data.visitId)
      ]);
      visitNotes = [visit?.notes, remark?.remarksText].filter(Boolean).join(' ');
      symptoms = visitSymptoms;
    }

    // All scoring lives in the AI risk engine (rule-based baseline until the FYP-2 model).
    const result = RiskEngine.assess({
      vitals,
      symptoms,
      notes: visitNotes,
      nurseConfidence: data.nurseConfidence
    });

    // Every non-LOW visit assessment opens a doctor case (5 min SLA for HIGH/CRITICAL, 20 min for MEDIUM).
    const shouldCreateCase = result.riskTier !== 'LOW' && !!data.visitId;
    const assessment = await ClinicalRepository.createRiskAssessmentAndCase(
      {
        patientId: data.patientId,
        visitId: data.visitId || null,
        riskTier: result.riskTier,
        fusedScore: result.fusedScore,
        mlScore: result.mlScore,
        nurseConfidence: data.nurseConfidence,
        explanation: JSON.stringify(result.explanation),
        timedOut,
        notes: visitNotes || 'Automated risk assessment generated.'
      },
      shouldCreateCase,
      data.visitId
    );

    if (shouldCreateCase) {
      const slaMinutes = result.riskTier === 'MEDIUM' ? 20 : 5;
      console.log(`[ALERT] ${result.riskTier} risk visit ${data.visitId} queued for doctor assignment with ${slaMinutes}-minute SLA.`);
    }

    return assessment;
  }

  public static async queryClinicalKnowledge(query: string) {
    const entries = await ClinicalRepository.findAllClinicalKnowledge();
    const keywords = query.toLowerCase().split(/\s+/);

    // Score entries based on keyword matches
    const scored = entries.map(entry => {
      let score = 0;
      const topicLower = entry.topic.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      const tagsLower = entry.tags.toLowerCase();

      keywords.forEach(keyword => {
        if (keyword.length < 3) return; // skip very short words
        if (topicLower.includes(keyword)) score += 10;
        if (contentLower.includes(keyword)) score += 3;
        if (tagsLower.includes(keyword)) score += 5;
      });

      return { entry, score };
    });

    // Filter out zero matches and sort descending
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.entry);
  }

  public static async getVisitAiSummary(visitId: string, actor: VisitActor) {
    const visit = await ClinicalRepository.findVisitForAiSummary(visitId);

    if (!visit) throw new AppError('Visit not found', HTTP_STATUS.NOT_FOUND);
    VisitAccessPolicy.assertCanRead(visit, actor);

    const patientName = visit.request.patient.user.fullName;
    const latestVitals = visit.vitals.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
    const symptoms = visit.symptoms.map(s => `${s.symptomName} (${s.severity.toLowerCase()})`).join(', ');

    const summaryText = `AI clinical summary for patient ${patientName}: Visit scheduled for ${new Date(visit.request.scheduledAt || new Date()).toLocaleDateString()} completed. Symptoms reported: ${symptoms || 'None'}. Vitals recorded: Temp=${latestVitals?.temperature ?? 'N/A'}°C, BP=${latestVitals?.systolic ?? 'N/A'}/${latestVitals?.diastolic ?? 'N/A'} mmHg, SpO2=${latestVitals?.oxygenSaturation ?? 'N/A'}%.`;

    // AI recommendations
    const recommendations: string[] = [];
    if (latestVitals) {
      if (latestVitals.oxygenSaturation < 92) {
        recommendations.push('Immediate oxygen support evaluation recommended.');
      }
      if (latestVitals.systolic > 160 || latestVitals.diastolic > 100) {
        recommendations.push('Antihypertensive medication titration or review required.');
      }
      if (latestVitals.temperature > 38.5) {
        recommendations.push('Monitor for signs of systemic infection or post-surgical wound issues.');
      }
    }

    if (visit.symptoms.some(s => s.severity === 'SEVERE')) {
      recommendations.push('Patient exhibits severe symptoms. Schedule urgent follow-up review.');
    } else {
      recommendations.push('Continue regular home monitoring and adherence reporting.');
    }

    return {
      visitId,
      patientName,
      summary: summaryText,
      recommendations,
      generatedAt: new Date()
    };
  }
}
