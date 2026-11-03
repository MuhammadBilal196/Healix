import { NotificationService } from '../../communication/notification/notification.service';
import { ContractRepository } from './contract.repository';
import { logger } from '../../../common/utils/logger';

export type ContractEvent = 'CREATED' | 'APPROVED' | 'REJECTED';

/**
 * Tells both parties what happened to a contract and what they need to do next.
 * Notifications are best-effort: a failure here never undoes the contract change.
 */
export async function notifyContractParties(contractId: string, event: ContractEvent, actorRole?: 'PATIENT' | 'NURSE') {
  try {
    const contract = await ContractRepository.findContractParties(contractId);
    if (!contract) return;

    const patientUserId = contract.patient.user.id;
    const nurseUserId = contract.nurse.user.id;
    const patientName = contract.patient.user.fullName;
    const nurseName = contract.nurse.user.fullName;
    const service = contract.careRequest?.type?.replace(/_/g, ' ').toLowerCase() || 'home care';
    const send = (userId: string, title: string, body: string) =>
      NotificationService.dispatchNotification({ userId, category: 'APPOINTMENT', title, body, channel: 'PUSH' });

    if (event === 'CREATED') {
      await send(nurseUserId, 'New contract to review',
        `${patientName} selected your offer for ${service}. Open Marketplace → My Contracts to review and approve it within 24 hours.`);
      await send(patientUserId, 'Contract ready for your approval',
        `Your agreement with ${nurseName} for ${service} is ready. Review and approve it within 24 hours.`);
      return;
    }

    if (event === 'APPROVED') {
      if (contract.status === 'ACTIVE') {
        await send(nurseUserId, 'Contract active', `Both parties approved the agreement with ${patientName}. Your visit is being scheduled.`);
        await send(patientUserId, 'Contract active', `Both parties approved the agreement with ${nurseName}. Your visit is being scheduled.`);
      } else if (actorRole === 'PATIENT') {
        await send(nurseUserId, 'Your approval is needed', `${patientName} approved the contract for ${service}. Approve it to confirm the visit.`);
      } else if (actorRole === 'NURSE') {
        await send(patientUserId, 'Your approval is needed', `${nurseName} approved the contract for ${service}. Approve it to confirm the visit.`);
      }
      return;
    }

    if (event === 'REJECTED') {
      const recipient = actorRole === 'PATIENT' ? nurseUserId : patientUserId;
      const actor = actorRole === 'PATIENT' ? patientName : nurseName;
      await send(recipient, 'Contract rejected', `${actor} rejected the contract for ${service}.`);
    }
  } catch (err: any) {
    logger.error(`[Contract Notifications] Could not notify parties of contract ${contractId}: ${err?.message ?? err}`);
  }
}
