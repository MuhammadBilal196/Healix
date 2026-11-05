import { AppError } from '../../../common/errors/AppError';
import { HTTP_STATUS } from '../../../common/constants/index';
import { OverrideCaseAssignmentUseCase } from './usecases/override-case-assignment.usecase';
import { AdminRepository } from './admin.repository';

import { InviteUserUseCase } from './usecases/invite-user.usecase';
function withoutAuthSecrets(value: any): any {
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(withoutAuthSecrets);
  return Object.fromEntries(Object.entries(value).filter(([key])=>!['passwordHash','refreshToken','refreshTokenHash','tokenHash','token','mfaSecret','resetToken'].includes(key)).map(([key,item])=>[key,withoutAuthSecrets(item)]));
}
export class AdminService {
  static async inviteUser(data: { email?: string; phone?: string; role: any }, adminId: string) {
    return await InviteUserUseCase.execute(data, adminId);
  }

  static async getClinicalCases(status?: string) {
    const { prisma } = require('../../../common/config/database');
    const where: any = {};
    if (status === 'UNASSIGNED') {
      where.doctorId = null;
      where.status = { not: 'RESOLVED' };
    } else if (status) {
      where.status = status;
    }
    return prisma.caseAssignment.findMany({
      where,
      include: {
        visit: {
          include: { request: { include: { patient: { include: { user: { select: { fullName: true } } } } } } }
        },
        doctor: { include: { user: { select: { fullName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }


  static async overrideCaseAssignment(caseId: string, doctorId: string, adminId: string, reason: string) {
    const useCase = new OverrideCaseAssignmentUseCase();
    return useCase.execute(caseId, doctorId, adminId, reason);
  }

  // ─── STATS ───────────────────────────────────────────────────────────────────
  static async getDashboardStats() {
    return AdminRepository.getDashboardStats();
  }

  // 👥 USER MANAGEMENT ──────────────────────────────────────────────────────────
  static async createDoctor(payload: any, admin: any) {
    const { CreateDoctorUseCase } = require('./usecases/create-doctor.usecase');
    const useCase = new CreateDoctorUseCase();
    return withoutAuthSecrets(await useCase.execute(payload, admin));
  }

  static async createParamedic(payload: any, admin: any) {
    const { CreateParamedicUseCase } = require('./usecases/create-paramedic.usecase');
    const useCase = new CreateParamedicUseCase();
    return withoutAuthSecrets(await useCase.execute(payload, admin));
  }

  static async getUsers(query: any) {
    return withoutAuthSecrets(await AdminRepository.findUsers(query));
  }

  static async getUserById(id: string) {
    const user = await AdminRepository.findUserById(id);
    if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    return withoutAuthSecrets(user);
  }

  static async updateUserStatus(id: string, status: string, reason: string, adminUser: any) {
    const target = await AdminRepository.findUserById(id);
    if (!target) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    if (target.deletedAt) throw new AppError('Cannot update a deleted user', HTTP_STATUS.BAD_REQUEST);

    if (status === 'ACTIVE') {
      if (target.emailVerificationRequired && !target.emailVerifiedAt) throw new AppError('User must verify their email first',409);
      const provider = target.nurse || target.doctor || target.paramedic;
      if (provider && provider.verificationStatus !== 'VERIFIED') throw new AppError('Complete professional approval before activating this account',409);
    }
    // Admins cannot deactivate other admins
    if (target.role === 'ADMIN') {
      throw Object.assign(new Error('Cannot modify another administrator account'), { statusCode: 403 });
    }

    const updated = await AdminRepository.updateUserStatus(id, status, reason);

    // Invalidate all sessions on deactivation/suspension
    if (status === 'SUSPENDED') {
      await AdminRepository.revokeUserSessions(id);
    }

    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      targetUserId: id,
      action: status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'USER',
      entityId: id,
      reason,
    });

    return withoutAuthSecrets(updated);
  }

  static async softDeleteUser(id: string, reason: string, adminUser: any) {
    const target = await AdminRepository.findUserById(id);
    if (!target) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    if (target.deletedAt) throw new AppError('User already deleted', HTTP_STATUS.BAD_REQUEST);
    if (target.role === 'ADMIN') {
      throw Object.assign(new Error('Cannot delete another administrator account'), { statusCode: 403 });
    }

    await AdminRepository.revokeUserSessions(id);
    const result = await AdminRepository.softDeleteUser(id);

    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      targetUserId: id,
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: id,
      reason,
    });

    return result;
  }

  // ─── NURSE CREDENTIAL MANAGEMENT ─────────────────────────────────────────────
  static async getPendingNurses() {
    return AdminRepository.findPendingNurses();
  }

  static async getAllNurses(status?: string) {
    return AdminRepository.findAllNurses(status);
  }

  static async approveNurse(nurseId: string, adminUser: any) {
    const nurse = await AdminRepository.findAllNurses();
    const target = nurse.find(n => n.id === nurseId);
    if (!target) throw new AppError('Nurse not found', HTTP_STATUS.NOT_FOUND);
    if (target.verificationStatus !== 'PENDING') {
      throw new AppError('Only PENDING nurses can be approved', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await AdminRepository.approveNurse(nurseId);
    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      targetUserId: target.userId,
      action: 'NURSE_APPROVED',
      entityType: 'NURSE',
      entityId: nurseId,
    });
    return result;
  }

  static async rejectNurse(nurseId: string, reason: string, adminUser: any) {
    const nurses = await AdminRepository.findAllNurses();
    const target = nurses.find(n => n.id === nurseId);
    if (!target) throw new AppError('Nurse not found', HTTP_STATUS.NOT_FOUND);
    if (target.verificationStatus !== 'PENDING') {
      throw new AppError('Only PENDING nurses can be rejected', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await AdminRepository.rejectNurse(nurseId, reason);
    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      targetUserId: target.userId,
      action: 'NURSE_REJECTED',
      entityType: 'NURSE',
      entityId: nurseId,
      reason,
    });
    return result;
  }

  static async revokeNurse(nurseId: string, reason: string, adminUser: any) {
    const nurses = await AdminRepository.findAllNurses();
    const target = nurses.find(n => n.id === nurseId);
    if (!target) throw new AppError('Nurse not found', HTTP_STATUS.NOT_FOUND);
    if (target.verificationStatus !== 'VERIFIED') {
      throw new AppError('Only VERIFIED nurses can be revoked', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await AdminRepository.revokeNurse(nurseId, reason);
    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      targetUserId: target.userId,
      action: 'NURSE_REVOKED',
      entityType: 'NURSE',
      entityId: nurseId,
      reason,
    });
    return result;
  }

  // ─── DOCTOR CREDENTIAL MANAGEMENT ────────────────────────────────────────────
  static async getPendingDoctors() {
    return AdminRepository.findPendingDoctors();
  }

  static async getAllDoctors(status?: string) {
    return AdminRepository.findAllDoctors(status);
  }

  static async approveDoctor(doctorId: string, adminUser: any) {
    const doctors = await AdminRepository.findAllDoctors();
    const target = doctors.find(d => d.id === doctorId);
    if (!target) throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    if (target.verificationStatus !== 'PENDING') {
      throw new AppError('Only PENDING doctors can be approved', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await AdminRepository.approveDoctor(doctorId);
    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      targetUserId: target.userId,
      action: 'DOCTOR_APPROVED',
      entityType: 'DOCTOR',
      entityId: doctorId,
    });
    return result;
  }

  static async rejectDoctor(doctorId: string, reason: string, adminUser: any) {
    const doctors = await AdminRepository.findAllDoctors();
    const target = doctors.find(d => d.id === doctorId);
    if (!target) throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    if (target.verificationStatus !== 'PENDING') {
      throw new AppError('Only PENDING doctors can be rejected', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await AdminRepository.rejectDoctor(doctorId, reason);
    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      targetUserId: target.userId,
      action: 'DOCTOR_REJECTED',
      entityType: 'DOCTOR',
      entityId: doctorId,
      reason,
    });
    return result;
  }

  static async revokeDoctor(doctorId: string, reason: string, adminUser: any) {
    const doctors = await AdminRepository.findAllDoctors();
    const target = doctors.find(d => d.id === doctorId);
    if (!target) throw new AppError('Doctor not found', HTTP_STATUS.NOT_FOUND);
    if (target.verificationStatus !== 'VERIFIED') {
      throw new AppError('Only VERIFIED doctors can be revoked', HTTP_STATUS.BAD_REQUEST);
    }

    const result = await AdminRepository.revokeDoctor(doctorId, reason);
    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      targetUserId: target.userId,
      action: 'DOCTOR_REVOKED',
      entityType: 'DOCTOR',
      entityId: doctorId,
      reason,
    });
    return result;
  }

  // ─── MARKETPLACE MANAGEMENT ───────────────────────────────────────────────────
  static async getAllOffers(status?: string) {
    return AdminRepository.findAllOffers(status);
  }

  static async removeOffer(offerId: string, reason: string, adminUser: any) {
    const result = await AdminRepository.removeOffer(offerId, reason);
    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      action: 'OFFER_REMOVED',
      entityType: 'OFFER',
      entityId: offerId,
      reason,
    });
    return result;
  }

  // ─── PLATFORM CONFIG ──────────────────────────────────────────────────────────
  static async getAllConfig() {
    const configs = await AdminRepository.getAllConfig();
    // Mask sensitive values
    return configs.map(c => ({
      ...c,
      value: c.key.toLowerCase().includes('secret') || c.key.toLowerCase().includes('password')
        ? '***MASKED***'
        : c.value,
    }));
  }

  static async updateConfig(key: string, value: string, changeReason: string | undefined, adminUser: any) {
    // Validate critical SLA config
    if (key === 'escalation_sla_max_minutes') {
      const numVal = Number(value);
      if (isNaN(numVal) || numVal < 5 || numVal > 20) {
        throw new AppError('escalation_sla_max_minutes must be between 5 and 20', HTTP_STATUS.BAD_REQUEST);
      }
    }

    const result = await AdminRepository.upsertConfig(key, value, adminUser.id, changeReason);
    await AdminRepository.createAuditLog({
      adminId: adminUser.id,
      action: 'CONFIG_UPDATED',
      entityType: 'CONFIG',
      entityId: key,
      reason: changeReason,
      metadataJson: JSON.stringify({ key, newValue: value }),
    });
    return result;
  }

  static async getFeatureFlags() {
    return AdminRepository.getFeatureFlags();
  }

  // ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
  static async getAuditLogs(query: any) {
    return AdminRepository.findAuditLogs(query);
  }

  static async exportAuditLogs(query: any) {
    const { logs } = await AdminRepository.findAuditLogs({ ...query, limit: 10000 });
    // Generate CSV
    const header = 'id,adminName,adminEmail,targetUser,action,entityType,entityId,reason,createdAt\n';
    const rows = logs.map(l =>
      [
        l.id,
        l.admin?.fullName ?? '',
        l.admin?.email ?? '',
        l.targetUser?.fullName ?? '',
        l.action,
        l.entityType ?? '',
        l.entityId ?? '',
        (l.reason ?? '').replace(/,/g, ';'),
        l.createdAt.toISOString(),
      ].join(',')
    ).join('\n');
    return header + rows;
  }

  // ─── Care Operations ──────────────────────────────────────────────────────────
  static async getCareRequests(query: any) {
    return AdminRepository.getCareRequests(query);
  }
  static async getContracts(query: any) {
    return AdminRepository.getContracts(query);
  }
  static async getVisits(query: any) {
    return AdminRepository.getVisits(query);
  }

  // ─── Clinical Operations ──────────────────────────────────────────────────────
  static async getUnassignedCases() {
    return AdminRepository.getClinicalCasesByStatus(['PENDING', 'UNASSIGNED', 'PROFESSIONAL_BROADCAST', 'GENERAL_BROADCAST', 'ADMIN_ESCALATED']); 
  }
  static async getAssignedCases() {
    return AdminRepository.getClinicalCasesByStatus(['ACCEPTED', 'ASSIGNED', 'IN_REVIEW']); 
  }
  static async getHighRiskCases() {
    return AdminRepository.getHighRiskCases();
  }

  // ─── Emergency Center ─────────────────────────────────────────────────────────
  static async getEmergencies(slaStatus?: string) {
    return AdminRepository.getEmergencies(slaStatus);
  }
  static async assignEmergencyDoctor(emergencyId: string, doctorId: string, adminId: string) {
    const event = await AdminRepository.assignEmergencyDoctor(emergencyId, doctorId);
    await AdminRepository.createAuditLog({
      adminId,
      action: 'EMERGENCY_DOCTOR_ASSIGNED',
      entityType: 'EMERGENCY_EVENT',
      entityId: emergencyId,
      metadataJson: JSON.stringify({ doctorId })
    });
    return event;
  }

  static async assignEmergencyParamedic(dispatchId: string, paramedicId: string, adminId: string) {
    const dispatch = await AdminRepository.assignEmergencyParamedic(dispatchId, paramedicId);
    await AdminRepository.createAuditLog({
      adminId,
      action: 'EMERGENCY_PARAMEDIC_ASSIGNED',
      entityType: 'AMBULANCE_DISPATCH',
      entityId: dispatchId,
      metadataJson: JSON.stringify({ paramedicId })
    });
    return dispatch;
  }

  static async assignEmergencyAmbulance(dispatchId: string, ambulanceId: string, adminId: string) {
    const dispatch = await AdminRepository.assignEmergencyAmbulance(dispatchId, ambulanceId);
    await AdminRepository.createAuditLog({
      adminId,
      action: 'EMERGENCY_AMBULANCE_ASSIGNED',
      entityType: 'AMBULANCE_DISPATCH',
      entityId: dispatchId,
      metadataJson: JSON.stringify({ ambulanceId })
    });
    return dispatch;
  }

  static async resolveEmergency(emergencyId: string, resolutionNotes?: string, adminId?: string) {
    const event = await AdminRepository.resolveEmergency(emergencyId, resolutionNotes);
    if (adminId) {
      await AdminRepository.createAuditLog({
        adminId,
        action: 'EMERGENCY_RESOLVED',
        entityType: 'EMERGENCY_EVENT',
        entityId: emergencyId,
        metadataJson: JSON.stringify({ resolutionNotes })
      });
    }
    return event;
  }

  static async escalateEmergency(emergencyId: string, adminId?: string) {
    const event = await AdminRepository.escalateEmergency(emergencyId);
    if (adminId) {
      await AdminRepository.createAuditLog({
        adminId,
        action: 'EMERGENCY_ESCALATED',
        entityType: 'EMERGENCY_EVENT',
        entityId: emergencyId,
      });
    }
    return event;
  }

  // ─── Healthcare Network ───────────────────────────────────────────────────────
  static async getHospitals() {
    return AdminRepository.getHospitals();
  }
  static async createHospital(data: any) {
    return AdminRepository.createHospital(data);
  }
  static async updateHospital(id: string, data: any) {
    return AdminRepository.updateHospital(id, data);
  }
  static async deleteHospital(id: string) {
    return AdminRepository.deleteHospital(id);
  }

  // ─── Reviews / Moderation ─────────────────────────────────────────────────────
  static async getNurseReviews() {
    return AdminRepository.getNurseReviews();
  }
  static async moderateNurseReview(reviewId: string, flagged: boolean) {
    return AdminRepository.updateNurseReview(reviewId, { flagged });
  }
  static async deleteNurseReview(reviewId: string) {
    return AdminRepository.deleteNurseReview(reviewId);
  }
}
