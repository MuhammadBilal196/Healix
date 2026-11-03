let getIo: any = () => undefined; try { const { ChatSocketService } = require("../../../../communication/chat/chat.socket"); getIo = () => ChatSocketService.getIo(); } catch(e) {}
import { DoctorRepository } from '../../../../identity/doctor/doctor.repository';
import { AppError } from '../../../../../common/errors/AppError';
import { HTTP_STATUS } from '../../../../../common/constants/index';

export class AutomaticDoctorAssignmentUseCase {
  async execute(caseId: string, tx?: any) {
    return DoctorRepository.withCaseAssignmentLock(caseId, async (transactionClient: any) => {
      const currentCase = await transactionClient.caseAssignment.findUnique({
        where: { id: caseId }
      });
      if (!currentCase) throw new AppError('Case not found', HTTP_STATUS.NOT_FOUND);

      // Idempotency: If already assigned, return it.
      if (currentCase.status !== 'PENDING' && currentCase.status !== 'UNASSIGNED') {
        return currentCase;
      }

      // 2. Fetch eligible doctors and rank them
      let eligibleDoctors = await DoctorRepository.findEligibleDoctorsWithWorkload(transactionClient, currentCase.riskTier);

      // Filter based on real-time availability window
      const now = new Date();
      const currentDay = now.getDay();
      const currentHourStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

      eligibleDoctors = eligibleDoctors.filter((doc: any) => {
        if (!doc.availabilities || doc.availabilities.length === 0) return true;
        return doc.availabilities.some((slot: any) => {
          return slot.isActive &&
                 slot.dayOfWeek === currentDay &&
                 currentHourStr >= slot.startTime &&
                 currentHourStr <= slot.endTime;
        });
      });

      // --- HIGH / CRITICAL EMERGENCY PATH ---
      if (currentCase.riskTier === 'HIGH' || currentCase.riskTier === 'CRITICAL') {
        const updatedCase = await transactionClient.caseAssignment.update({
          where: { id: caseId },
          data: { status: 'PROFESSIONAL_BROADCAST' }
        });

        // assignedTo is a foreign key to users.id, so a broadcast is logged against an administrator.
        // With no administrator the log is skipped rather than failing the whole escalation.
        const admin = await transactionClient.user.findFirst({ where: { role: 'ADMIN' } });
        if (admin) {
          await transactionClient.assignmentLog.create({
            data: {
              visitId: updatedCase.visitId,
              method: 'AUTO',
              assignedTo: admin.id,
              reason: 'Emergency case escalated to PROFESSIONAL_BROADCAST'
            }
          });
        }

        const professionalDocs = eligibleDoctors.filter((d: any) => d.isProfessional);
        
        
        const io = getIo();
        if (io) {
          professionalDocs.forEach((doc: any) => {
            io.to(`user:${doc.userId}`).emit('emergency_case_available', {
              caseId: updatedCase.id,
              riskTier: currentCase.riskTier,
              message: '🚨 HIGH PRIORITY CASE'
            });
            
            io.to(`user:${doc.userId}`).emit('notification', {
              type: 'URGENT_CASE_BROADCAST',
              title: '🚨 CRITICAL CASE BROADCAST',
              message: `New critical case requires professional attention.`,
              caseId: updatedCase.id
            });
          });
        }
        return updatedCase;
      }

      // --- NORMAL LOW / MEDIUM WORKLOAD PATH ---
      if (eligibleDoctors.length === 0) {
        return transactionClient.caseAssignment.update({
          where: { id: caseId },
          data: { status: 'UNASSIGNED' }
        });
      }

      eligibleDoctors.sort((a: any, b: any) => {
        const countA = a._count.caseAssignments;
        const countB = b._count.caseAssignments;
        if (countA !== countB) return countA - countB;
        return a.id.localeCompare(b.id);
      });

      const selectedDoctor = eligibleDoctors[0];

      const updatedCase = await transactionClient.caseAssignment.update({
        where: { id: caseId },
        data: {
          doctorId: selectedDoctor.id,
          status: 'ASSIGNED'
        }
      });

      const doctorUser = await transactionClient.doctor.findUnique({
        where: { id: selectedDoctor.id },
        select: { userId: true }
      });

      await transactionClient.assignmentLog.create({
        data: {
          visitId: updatedCase.visitId,
          method: 'AUTO',
          assignedTo: doctorUser.userId,
          reason: `Automatically assigned based on lowest active workload (${selectedDoctor._count.caseAssignments} cases) and availability`
        }
      });
      
      // Auto-create Chat Thread for Normal Doctor Assignment
      try {
        const { ChatAutoCreator } = require('../../../../communication/chat/chat.auto-creator');
        await ChatAutoCreator.onDoctorAssigned(caseId, doctorUser.userId, transactionClient);
      } catch (e) {}

      return updatedCase;
    }, tx);
  }
}
