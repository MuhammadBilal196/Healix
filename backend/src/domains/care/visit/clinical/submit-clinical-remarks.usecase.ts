import { VisitRepository } from '../visit.repository';
import { AppError } from '../../../../common/errors/AppError';
import { HTTP_STATUS } from '../../../../common/constants/index';
import { ClinicalRepository } from '../../clinical/clinical.repository';
import { RiskEngine } from '../../../ai/risk-engine';
import { AutomaticDoctorAssignmentUseCase } from '../../clinical/usecases/assignment/automatic-doctor-assignment.usecase';

export class SubmitClinicalRemarksUseCase {
  constructor(
    private readonly visitRepository = VisitRepository,
    private readonly clinicalRepository = ClinicalRepository
  ) {}

  async execute(input: { visitId: string; nurseId: string; remarksText: string; confidenceLevel: number }) {
    const visit = await this.visitRepository.findVisitById(input.visitId);
    if (!visit) {
      throw new AppError('Visit not found', HTTP_STATUS.NOT_FOUND);
    }
    if (visit.nurseId !== input.nurseId) {
      throw new AppError('Unauthorized', HTTP_STATUS.FORBIDDEN);
    }
    if (visit.status !== 'IN_PROGRESS') {
      throw new AppError('Cannot submit remarks for visit that is not in progress', HTTP_STATUS.BAD_REQUEST);
    }

    const existingRemark = await this.clinicalRepository.findClinicalRemark(input.visitId);
    if (existingRemark) {
      throw new AppError('Clinical remarks already submitted for this visit', HTTP_STATUS.BAD_REQUEST);
    }

    const remark = await this.clinicalRepository.createClinicalRemark(input.visitId, input.remarksText, input.confidenceLevel);

    // Risk uses everything recorded at this visit, not the nurse's confidence alone.
    const [vitals, symptoms] = await Promise.all([
      this.clinicalRepository.findLatestVitalsForVisit(input.visitId),
      this.clinicalRepository.findSymptomsForVisit(input.visitId)
    ]);
    const assessment = RiskEngine.assess({
      vitals,
      symptoms,
      notes: input.remarksText,
      nurseConfidence: input.confidenceLevel
    });

    // Save RiskAssessment record and escalate if necessary
    const { caseId } = await this.clinicalRepository.createRiskAssessmentAndEscalate(
      input.visitId,
      visit.request.patientId,
      assessment.riskTier,
      assessment.fusedScore,
      input.remarksText,
      input.confidenceLevel,
      { mlScore: assessment.mlScore, explanation: JSON.stringify(assessment.explanation) }
    );

    if (caseId) {
      const slaMinutes = assessment.riskTier === 'HIGH' || assessment.riskTier === 'CRITICAL' ? 5 : 20;
      console.log(`[ESCALATION] Case ${caseId} created for Visit ${input.visitId}. Risk Tier: ${assessment.riskTier}, SLA: ${slaMinutes} mins.`);
      
      try {
        const assignmentUseCase = new AutomaticDoctorAssignmentUseCase();
        await assignmentUseCase.execute(caseId);
      } catch (error: any) {
        console.error(`[ASSIGNMENT_ERROR] Failed to assign doctor for case ${caseId}:`, String(error), error?.stack);
      }
    }

    // Future Domain Event: ClinicalRemarksSubmitted
    return remark;
  }
}

