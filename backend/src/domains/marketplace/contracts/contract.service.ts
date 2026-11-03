import { ContractRepository } from './contract.repository';
import { AppError } from '../../../common/errors/AppError';
import { HTTP_STATUS } from '../../../common/constants/index';
import { prisma } from '../../../common/config/database';
import { CreateContractFromOfferUseCase } from './usecases/create-contract-from-offer.usecase';
import { notifyContractParties } from './contract.notifications';

export class ContractService {
  public static async createContract(
    data: {
      patientId: string;
      nurseId: string;
      sourceOfferId?: string;
      careRequestId?: string;
      price: number;
      priceType: string;
      scopeText: string;
    },
    user: any
  ) {
    if (!(user.role === 'ADMIN' || (user.role === 'PATIENT' && user.patient?.id === data.patientId))) throw new AppError('Only the patient can draft their agreement', HTTP_STATUS.FORBIDDEN);
    if (data.sourceOfferId) {
      const offer = await prisma.offer.findUnique({where:{id:data.sourceOfferId},include:{listing:{include:{careRequest:true}}}});
      if (!offer || offer.nurseId !== data.nurseId || offer.listing.careRequest.patientId !== data.patientId) throw new AppError('Offer does not match the contract parties', HTTP_STATUS.CONFLICT);
      return new CreateContractFromOfferUseCase().execute(offer.listingId, offer.id);
    }
    if (!await prisma.nurse.findFirst({where:{id:data.nurseId,verificationStatus:'VERIFIED',user:{status:'ACTIVE',deletedAt:null}}})) throw new AppError('Active verified nurse not found', HTTP_STATUS.NOT_FOUND);
    return ContractRepository.createContract({
      ...data,
      actorId: user.id,
      actorRole: user.role
    });
  }

  public static async getContract(id: string, user: any) {
    const contract = await ContractRepository.findContractById(id);
    if (!contract) return null;
    if (!(user.role === 'ADMIN' || user.patient?.id === contract.patientId || user.nurse?.id === contract.nurseId)) throw new AppError('Contract access forbidden', HTTP_STATUS.FORBIDDEN);

    // Active sweeper will handle expiration, but we can keep lazy eval as fallback
    if (contract.status === 'PENDING_APPROVAL' && new Date() > contract.expiresAt) {
      console.log(`[EXPIRY] Contract ${id} has expired (lazy eval). Updating status.`);
      return ContractRepository.expireContract(id);
    }

    return contract;
  }

  public static async getPatientContracts(patientId: string) {
    return ContractRepository.findContractsByPatientId(patientId);
  }

  public static async getNurseContracts(nurseId: string) {
    return ContractRepository.findContractsByNurseId(nurseId);
  }

  public static async approveContract(contractId: string, user: any) {
    const contract = await ContractRepository.findContractById(contractId);
    if (!contract) throw new AppError('Contract not found', HTTP_STATUS.NOT_FOUND);

    let role: 'PATIENT' | 'NURSE' | null = null;
    if (user.patient && contract.patientId === user.patient.id) {
      role = 'PATIENT';
    } else if (user.nurse && contract.nurseId === user.nurse.id) {
      role = 'NURSE';
    }

    if (!role) throw new AppError('Unauthorized: You are not a party to this contract', HTTP_STATUS.FORBIDDEN);

    const wasApproved = role === 'PATIENT' ? contract.patientApproved : contract.nurseApproved;
    const updated = await ContractRepository.updateApproval(contractId, role, user.id, user.role);
    if (!wasApproved && updated) await notifyContractParties(contractId, 'APPROVED', role);
    return updated;
  }

  public static async rejectContract(contractId: string, reason: string, user: any) {
    const contract = await ContractRepository.findContractById(contractId);
    if (!contract) throw new AppError('Contract not found', HTTP_STATUS.NOT_FOUND);

    let role: 'PATIENT' | 'NURSE' | null = null;
    if (user.patient && contract.patientId === user.patient.id) {
      role = 'PATIENT';
    } else if (user.nurse && contract.nurseId === user.nurse.id) {
      role = 'NURSE';
    }

    if (!role) throw new AppError('Unauthorized: You are not a party to this contract', HTTP_STATUS.FORBIDDEN);

    const rejected = await ContractRepository.rejectContract(contractId, role, reason, user.id, user.role);
    if (contract.status !== 'REJECTED') await notifyContractParties(contractId, 'REJECTED', role);
    return rejected;
  }

  public static async cancelContract(contractId: string, reason: string, user: any) {
    const contract = await ContractRepository.findContractById(contractId);
    if (!contract) throw new AppError('Contract not found', HTTP_STATUS.NOT_FOUND);

    const isAuthorized =
      (user.patient && contract.patientId === user.patient.id) ||
      (user.nurse && contract.nurseId === user.nurse.id) ||
      user.role === 'ADMIN';

    if (!isAuthorized) throw new AppError('Unauthorized: You cannot cancel this contract', HTTP_STATUS.FORBIDDEN);

    return ContractRepository.cancelContract(contractId, reason || 'Cancelled by user', user.id, user.role);
  }

  public static async getContractAuditTrail(contractId: string, user: any) {
    const contract = await ContractRepository.findContractById(contractId);
    if (!contract) throw new AppError('Contract not found', HTTP_STATUS.NOT_FOUND);

    const isAuthorized =
      (user.patient && contract.patientId === user.patient.id) ||
      (user.nurse && contract.nurseId === user.nurse.id) ||
      user.role === 'ADMIN';

    if (!isAuthorized) throw new AppError('Unauthorized to view audit trail', HTTP_STATUS.FORBIDDEN);

    return contract.auditLogs;
  }

  public static async sweepExpiredContracts() {
    const expiredContracts = await ContractRepository.findExpiredContracts();

    let count = 0;
    for (const c of expiredContracts) {
      try {
        await ContractRepository.expireContract(c.id);
        count++;
      } catch (err: any) {
        console.error(`[ContractService] Failed to expire contract ${c.id}: ${err.message}`);
      }
    }
    return count;
  }
}
