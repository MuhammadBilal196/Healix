let getIo: any = () => undefined; try { const { ChatSocketService } = require("../../../communication/chat/chat.socket"); getIo = () => ChatSocketService.getIo(); } catch(e) {}
import { prisma } from '../../../../common/config/database';
import { DoctorRepository } from '../../../identity/doctor/doctor.repository';

export class SlaTimeoutWorker {
  public static async processTimeouts() {
    const now = new Date();

    // 1. Check for 5-minute timeout (PROFESSIONAL_BROADCAST -> GENERAL_BROADCAST)
    const fiveMinBreaches = await prisma.caseAssignment.findMany({
      where: {
        status: 'PROFESSIONAL_BROADCAST',
        riskTier: { in: ['HIGH', 'CRITICAL'] },
        slaDeadline: { lt: now }
      }
    });

    for (const caseData of fiveMinBreaches) {
      try {
        await prisma.$transaction(async (tx) => {
          // Lock row
          const lockedCases = await tx.$queryRaw<any[]>`SELECT * FROM "case_assignments" WHERE "id" = ${caseData.id} FOR UPDATE`;
          if (!lockedCases || lockedCases.length === 0) return;
          if (lockedCases[0].status !== 'PROFESSIONAL_BROADCAST') return;

          // Transition to GENERAL_BROADCAST
          await tx.caseAssignment.update({
            where: { id: caseData.id },
            data: { status: 'GENERAL_BROADCAST' }
          });

          // AssignmentLog.assignedTo must reference a real user (foreign key to users.id).
          // A broadcast has no assignee yet, so the escalation is recorded against an administrator
          // (the same convention as AutomaticDoctorAssignmentUseCase). Without an administrator the
          // log is skipped so the escalation itself still succeeds.
          const admins = await tx.administrator.findMany({ include: { user: true } });
          const logOwner = admins[0]?.userId
            ?? (await tx.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } }))?.id;
          if (logOwner) {
            await tx.assignmentLog.create({
              data: {
                visitId: caseData.visitId,
                method: 'AUTO',
                assignedTo: logOwner,
                reason: 'SLA_TIMEOUT: Case escalated to GENERAL_BROADCAST (Professional 5min limit reached)'
              }
            });
          } else {
            console.warn(`[SLA TIMEOUT] No administrator account exists; escalation of ${caseData.id} was not written to the assignment log.`);
          }

          // Generate admin alert
          
          const io = getIo();
          
          if (io) {
            admins.forEach((admin: any) => {
              io.to(`user:${admin.userId}`).emit('admin_emergency_alert', {
                caseId: caseData.id,
                message: `HIGH/CRITICAL case has not been accepted by a professional doctor within 5 minutes.`
              });
            });

            // Notify all verified doctors (general broadcast)
            let eligibleDoctors = await DoctorRepository.findEligibleDoctorsWithWorkload(tx, caseData.riskTier);
            const currentDay = now.getDay();
            const currentHourStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            eligibleDoctors = eligibleDoctors.filter((doc: any) => {
              if (!doc.availabilities || doc.availabilities.length === 0) return true;
              return doc.availabilities.some((slot: any) => slot.isActive && slot.dayOfWeek === currentDay && currentHourStr >= slot.startTime && currentHourStr <= slot.endTime);
            });
            // Standard + Professional
            eligibleDoctors.forEach((doc: any) => {
              io.to(`user:${doc.userId}`).emit('emergency_case_available', {
                caseId: caseData.id,
                riskTier: caseData.riskTier,
                message: '🚨 EMERGENCY CASE AVAILABLE'
              });
            });
          }
        });
      } catch (err: any) {
        console.error(`[SLA TIMEOUT] Failed to escalate to general broadcast for ${caseData.id}:`, err.message);
      }
    }
    // Note: Once a case transitions to GENERAL_BROADCAST, it remains available in GENERAL_BROADCAST
    // until a doctor explicitly accepts it or Admin manually assigns it. There is no automated timeout to ADMIN_ESCALATED.
  }
}
