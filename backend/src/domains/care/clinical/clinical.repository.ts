import { prisma } from '../../../common/config/database';
import { OutboxRepository } from '../../../common/events/outbox.repository';
import { EVENTS } from '../../../common/events/app-event-bus';

export class ClinicalRepository {
  static async findLatestVitalsForVisit(visitId: string) {
    return prisma.vitalsRecord.findFirst({
      where: { visitId },
      orderBy: { recordedAt: 'desc' }
    });
  }

  static async findLatestVitalsForPatient(patientId: string) {
    return prisma.vitalsRecord.findFirst({
      where: { visit: { request: { patientId } } },
      orderBy: { recordedAt: 'desc' }
    });
  }

  static async findVisitById(visitId: string) {
    return prisma.visit.findUnique({
      where: { id: visitId }
    });
  }

  static async findSymptomsForVisit(visitId: string) {
    return prisma.visitSymptom.findMany({
      where: { visitId },
      select: { symptomName: true, severity: true }
    });
  }

  static async findPendingCaseIds(cursor?: string) {
    return prisma.caseAssignment.findMany({ where: { status: { in: ['PENDING', 'UNASSIGNED'] } }, select: { id: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], take: 20, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
  }

  static async createRiskAssessmentAndCase(assessmentData: any, shouldCreateCase: boolean, visitId?: string) {
    return prisma.$transaction(async (tx) => {
      const assessment = await tx.riskAssessment.create({
        data: assessmentData
      });

      if (shouldCreateCase && visitId) {
        const existingCase = await tx.caseAssignment.findUnique({
          where: { visitId }
        });

        if (!existingCase) {
          // Same SLA as nurse-submitted remarks: 5 minutes for HIGH/CRITICAL, 20 minutes for MEDIUM.
          const riskTier: string = assessmentData.riskTier;
          const slaMinutes = riskTier === 'HIGH' || riskTier === 'CRITICAL' ? 5 : 20;
          const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000);

          const newCase = await tx.caseAssignment.create({
            data: {
              visitId,
              riskTier,
              slaDeadline,
              status: 'PENDING'
            }
          });
          await OutboxRepository.createEvent(tx, {
            eventType: EVENTS.CASE_CREATED, aggregateType: 'CASE', aggregateId: newCase.id, payload: { caseId: newCase.id }
          });
        }
      }

      return assessment;
    });
  }

  static async findAllClinicalKnowledge() {
    return prisma.clinicalKnowledgeEntry.findMany();
  }

  static async findVisitForAiSummary(visitId: string) {
    return prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        request: { include: { patient: { include: { user: { select: { id: true, fullName: true } } } } } },
        caseAssignment: { select: { doctorId: true, secondOpinions: { select: { consultedDoctorId: true } } } },
        vitals: true,
        symptoms: true,
        clinicalRemark: true
      }
    });
  }

  public static async createVitals(visitId: string, data: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
    bloodSugar?: number;
  }) {
    return prisma.vitalsRecord.create({
      data: {
        visitId,
        systolic: data.systolic,
        diastolic: data.diastolic,
        heartRate: data.heartRate,
        temperature: data.temperature,
        oxygenSaturation: data.oxygenSaturation,
        bloodSugar: data.bloodSugar
      }
    });
  }

  public static async createSymptoms(visitId: string, symptoms: Array<{
    symptomName: string;
    severity: string;
    bodySystem?: string;
    notes?: string;
  }>) {
    // Note: createMany is supported on Postgres
    return prisma.visitSymptom.createMany({
      data: symptoms.map(s => ({
        visitId,
        symptomName: s.symptomName,
        severity: s.severity,
        bodySystem: s.bodySystem,
        notes: s.notes
      }))
    });
  }

  public static async createClinicalRemark(visitId: string, remarksText: string, confidenceLevel: number) {
    return prisma.clinicalRemark.create({
      data: {
        visitId,
        remarksText,
        confidenceLevel
      }
    });
  }

  public static async findClinicalRemark(visitId: string) {
    return prisma.clinicalRemark.findUnique({
      where: { visitId }
    });
  }

  // TODO (Future Refactor): Separate this into Clinical + Emergency using Domain Events during Phase 6.
  public static async createRiskAssessmentAndEscalate(
    visitId: string,
    patientId: string,
    riskTier: string,
    fusedScore: number,
    remarksText: string,
    confidenceLevel: number,
    details: { mlScore?: number; explanation?: string } = {}
  ) {
      return prisma.$transaction(async (tx) => {
        const risk = await tx.riskAssessment.create({
          data: {
            patientId,
            visitId,
            riskTier,
            fusedScore,
            nurseConfidence: confidenceLevel,
            ...(details.mlScore !== undefined ? { mlScore: details.mlScore } : {}),
            ...(details.explanation !== undefined ? { explanation: details.explanation } : {}),
            notes: `Nurse qualitative remarks: "${remarksText}" (Confidence: ${confidenceLevel}/5)`
          }
        });

        let caseId = null;
        if (riskTier === 'MEDIUM' || riskTier === 'HIGH' || riskTier === 'CRITICAL') {
          const existing = await tx.caseAssignment.findUnique({ where: { visitId } });
          if (existing) return { risk, caseId: existing.id };
          const isUrgent = riskTier === 'HIGH' || riskTier === 'CRITICAL';
          const slaMinutes = isUrgent ? 5 : 20;

          const newCase = await tx.caseAssignment.create({
            data: {
              visitId,
              riskTier,
              slaDeadline: new Date(Date.now() + slaMinutes * 60 * 1000),
              status: 'PENDING'
            }
          });
          caseId = newCase.id;
          await OutboxRepository.createEvent(tx, {
            eventType: EVENTS.CASE_CREATED, aggregateType: 'CASE', aggregateId: newCase.id, payload: { caseId: newCase.id }
          });
        }

        return { risk, caseId };
      });
  }

  
  public static async findPatientClinicalOutcomes(patientId: string) {
    return prisma.caseAssignment.findMany({
      where: { visit: { request: { patientId } } },
      include: {
        doctor: { select: { user: { select: { fullName: true } } } },
        diagnoses: true,
        decisions: true,
        visit: { select: { startedAt: true, id: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public static async findPatientMedicalHistory(patientId: string) {
    return prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        chronicConditions: true,
        allergies: true,
        medications: true,
        diagnoses: {
          include: {
            doctor: {
              select: {
                user: {
                  select: {
                    fullName: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  public static async addChronicCondition(
    patientId: string,
    data: { name: string; diagnosedDate?: Date; notes?: string }
  ) {
    return prisma.chronicCondition.create({
      data: {
        patientId,
        ...data
      }
    });
  }

  public static async addAllergy(
    patientId: string,
    data: { allergen: string; severity: string }
  ) {
    return prisma.allergy.create({
      data: {
        patientId,
        ...data
      }
    });
  }

  public static async addMedication(
    patientId: string,
    data: { name: string; dosage: string; frequency: string; active?: boolean }
  ) {
    return prisma.medication.create({
      data: {
        patientId,
        ...data
      }
    });
  }

  public static async findPatientVitalsHistory(patientId: string) {
    return prisma.vitalsRecord.findMany({
      where: {
        visit: {
          request: { patientId }
        }
      },
      orderBy: { recordedAt: 'desc' }
    });
  }

  public static async findPatientRiskHistory(patientId: string) {
    return prisma.riskAssessment.findMany({
      where: { patientId },
      orderBy: { assessedAt: 'desc' }
    });
  }

  public static async findPatientPrescriptions(patientId: string) {
    return prisma.prescription.findMany({
      where: { patientId },
      orderBy: { prescribedAt: 'desc' },
      include: {
        items: true,
        corrections: { select: { id: true } },
        doctor: {
          select: {
            user: {
              select: { fullName: true }
            }
          }
        }
      }
    });
  }

  public static async countSevereAllergies(patientId: string) {
    return prisma.allergy.count({
      where: {
        patientId,
        severity: 'SEVERE'
      }
    });
  }

  public static async findLatestRiskAssessment(patientId: string) {
    return prisma.riskAssessment.findFirst({
      where: { patientId },
      orderBy: { assessedAt: 'desc' }
    });
  }

  public static async findAllergiesByPatientId(patientId: string) {
    return prisma.allergy.findMany({ where: { patientId } });
  }

  public static async findChronicConditionsByPatientId(patientId: string) {
    return prisma.chronicCondition.findMany({ where: { patientId } });
  }

  public static async findDiagnosisById(diagnosisId: string) {
    return prisma.diagnosis.findUnique({
      where: { id: diagnosisId }
    });
  }

  public static async findPrescriptionById(prescriptionId: string) {
    return prisma.prescription.findUnique({
      where: { id: prescriptionId }
    });
  }

  public static async createDiagnosis(
    patientId: string,
    doctorId: string,
    caseId: string,
    code: string,
    description: string,
    notes: string,
    parentId: string | null,
    version: number
  ) {
    return prisma.diagnosis.create({
      data: {
        patientId,
        doctorId,
        caseId,
        code,
        description,
        notes,
        parentId,
        version
      }
    });
  }

  public static async findDiagnosisHistory(caseId: string) {
    return prisma.diagnosis.findMany({
      where: { caseId },
      orderBy: { version: 'desc' },
      include: {
        doctor: { select: { user: { select: { fullName: true } } } }
      }
    });
  }

  public static async createPrescription(
    patientId: string,
    doctorId: string,
    visitId: string,
    pdfUrl: string,
    instructions: string,
    items: any[],
    supersedesId?: string
  ) {
    // TODO Phase 6: Replace with Domain Event
    return prisma.$transaction(async (tx) => {
      // The schema does not have a status field for Prescription, so we don't update status
      const prescription = await tx.prescription.create({
        data: {
          patientId,
          doctorId,
          visitId,
          fileUrl: pdfUrl,
          instructions,
          supersedesId,
          items: {
            create: items.map(i => ({
              medicationName: i.medicationName,
              dosage: i.dosage,
              frequency: i.frequency,
              durationDays: i.durationDays,
              refillsAuthorized: i.refillsAuthorized
            }))
          }
        },
        include: { items: true }
      });
      return prescription;
    });
  }
  public static async createMedicationLog(medicationId: string, patientId: string) {
    return prisma.medicationLog.create({
      data: { medicationId, patientId, takenAt: new Date() }
    });
  }

  public static async findMedicationLogs(patientId: string) {
    return prisma.medicationLog.findMany({
      where: { patientId },
      orderBy: { takenAt: 'desc' },
      include: { medication: true }
    });
  }

  public static async findActiveMedications(patientId: string) {
    return prisma.medication.findMany({
      where: { patientId, active: true }
    });
  }

  public static async findMedicationLogsInRange(patientId: string, since: Date) {
    return prisma.medicationLog.findMany({
      where: {
        patientId,
        takenAt: { gt: since }
      }
    });
  }

  public static async findMedicationById(medicationId: string) {
    return prisma.medication.findUnique({
      where: { id: medicationId }
    });
  }
}

