import { prisma } from '../../../common/config/database';
import { EscalationService } from '../../care/emergency/escalation/escalation.service';
import { ResourceAssignmentService } from '../../care/emergency/resource-assignment.service';
import { hospitalSchema } from '../../care/emergency/emergency.validation';
import { AppError } from '../../../common/errors/AppError';

export class AdminRepository {
  // ─── STATS ───────────────────────────────────────────────────────────────────
  static async getDashboardStats() {
    const [
      totalUsers, activeUsers, pendingNurses, pendingDoctors,
      totalVisits, completedVisits, activeContracts, highRiskCases,
      totalNurses, totalDoctors, totalPatients,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.nurse.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.doctor.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.visit.count(),
      prisma.visit.count({ where: { status: 'COMPLETED' } }),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.caseAssignment.count({ where: { status: { not: 'RESOLVED' }, riskTier: { in: ['HIGH', 'CRITICAL'] } } }),
      prisma.nurse.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
    ]);
    return {
      totalUsers, activeUsers, pendingNurses, pendingDoctors,
      totalVisits, completedVisits, activeContracts, highRiskCases,
      totalNurses, totalDoctors, totalPatients,
    };
  }

  // ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
  static async findUsers(query: {
    search?: string; role?: string; status?: string; page?: number; limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, cnic: true } },
          nurse: { select: { id: true, cnic: true, pncNumber: true, verificationStatus: true } },
          doctor: { select: { id: true, cnic: true, pmdcNumber: true, verificationStatus: true } },
          admin: { select: { id: true } },
          paramedic: { select: { id: true, verificationStatus: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  static async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        patient: { include: { emergencyContacts: true, chronicConditions: true, allergies: true } },
        nurse: { include: { qualifications: true, specializations: true, score: true, badges: true } },
        doctor: { include: { diagnoses: { take: 5 }, caseAssignments: { take: 5 } } },
        admin: true,
        paramedic: true,
        sessions: { where: { revoked: false, expiresAt: { gt: new Date() } } },
        documents: true,
      },
    });
  }

  static async updateUserStatus(id: string, status: string, reason: string) {
    return prisma.user.update({
      where: { id },
      data: { status: status as any, deactivationReason: reason },
    });
  }

  static async revokeUserSessions(userId: string) {
    return prisma.session.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  static async softDeleteUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ─── NURSE CREDENTIAL MANAGEMENT ─────────────────────────────────────────────
  static async findPendingNurses() {
    return prisma.nurse.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, createdAt: true, documents: true } },
        qualifications: true,
        specializations: true,
      },
      orderBy: { user: { createdAt: 'asc' } },
    });
  }

  static async findAllNurses(status?: string) {
    return prisma.nurse.findMany({
      where: status ? { verificationStatus: status } : {},
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, status: true, createdAt: true } },
        score: true,
      },
      orderBy: { user: { createdAt: 'desc' } },
    });
  }

  static async approveNurse(nurseId: string) {
    return prisma.nurse.update({
      where: { id: nurseId },
      data: { verificationStatus: 'VERIFIED', verificationApprovedAt: new Date(), rejectionReason: null },
    });
  }

  static async rejectNurse(nurseId: string, reason: string) {
    return prisma.nurse.update({
      where: { id: nurseId },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason },
    });
  }

  static async revokeNurse(nurseId: string, reason: string) {
    return prisma.nurse.update({
      where: { id: nurseId },
      data: { verificationStatus: 'REVOKED', revocationReason: reason, available: false },
    });
  }

  // ─── DOCTOR CREDENTIAL MANAGEMENT ────────────────────────────────────────────
  static async findPendingDoctors() {
    return prisma.doctor.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, createdAt: true, documents: true } },
      },
      orderBy: { user: { createdAt: 'asc' } },
    });
  }

  static async findAllDoctors(status?: string) {
    return prisma.doctor.findMany({
      where: status ? { verificationStatus: status } : {},
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true, status: true, createdAt: true } },
      },
      orderBy: { user: { createdAt: 'desc' } },
    });
  }

  static async approveDoctor(doctorId: string) {
    return prisma.doctor.update({
      where: { id: doctorId },
      data: { verificationStatus: 'VERIFIED', verificationApprovedAt: new Date(), rejectionReason: null },
    });
  }

  static async rejectDoctor(doctorId: string, reason: string) {
    return prisma.doctor.update({
      where: { id: doctorId },
      data: { verificationStatus: 'REJECTED', rejectionReason: reason },
    });
  }

  static async revokeDoctor(doctorId: string, reason: string) {
    // Flag active case assignments for re-escalation
    await prisma.caseAssignment.updateMany({
      where: { doctorId, status: { in: ['ACCEPTED', 'ASSIGNED', 'IN_REVIEW'] } },
      data: { status: 'PENDING', doctorId: null },
    });
    return prisma.doctor.update({
      where: { id: doctorId },
      data: { verificationStatus: 'REVOKED', revocationReason: reason },
    });
  }

  // ─── MARKETPLACE MANAGEMENT ───────────────────────────────────────────────────
  static async findAllOffers(status?: string) {
    return prisma.offer.findMany({
      where: status ? { status } : {},
      include: {
        nurse: { include: { user: { select: { fullName: true, email: true } } } },
        listing: { include: { careRequest: { include: { patient: { include: { user: { select: { fullName: true } } } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async removeOffer(offerId: string, _reason: string) {
    return prisma.offer.update({
      where: { id: offerId },
      data: { status: 'REMOVED' },
    });
  }

  // ─── PLATFORM CONFIG ──────────────────────────────────────────────────────────
  static async getAllConfig() {
    return prisma.platformConfig.findMany({ orderBy: { key: 'asc' } });
  }

  static async getConfigByKey(key: string) {
    return prisma.platformConfig.findUnique({ where: { key } });
  }

  static async upsertConfig(key: string, value: string, adminId: string, changeReason?: string) {
    return prisma.platformConfig.upsert({
      where: { key },
      create: { key, value, updatedByAdminId: adminId, changeReason },
      update: { value, updatedByAdminId: adminId, updatedAt: new Date(), changeReason },
    });
  }

  static async getFeatureFlags() {
    return prisma.platformConfig.findMany({
      where: { key: { startsWith: 'feature_flag_' } },
      orderBy: { key: 'asc' },
    });
  }

  // ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
  static async createAuditLog(data: {
    adminId: string; targetUserId?: string; action: string;
    entityType?: string; entityId?: string; reason?: string; metadataJson?: string;
  }) {
    return prisma.adminAuditLog.create({ data });
  }

  static async findAuditLogs(query: {
    adminId?: string; targetUserId?: string; action?: string;
    entityType?: string; fromDate?: string; toDate?: string;
    page?: number; limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.adminId) where.adminId = query.adminId;
    if (query.targetUserId) where.targetUserId = query.targetUserId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entityType) where.entityType = query.entityType;
    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate) where.createdAt.lte = new Date(query.toDate);
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { fullName: true, email: true } },
          targetUser: { select: { fullName: true, email: true, role: true } },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return { logs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─── Care Operations ──────────────────────────────────────────────────────────
  static async getCareRequests(_query?: any) {
    return prisma.careRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { patient: { include: { user: { select: { fullName: true } } } } }
    });
  }
  static async getContracts(_query?: any) {
    return prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        nurse: { include: { user: { select: { fullName: true } } } },
        patient: { include: { user: { select: { fullName: true } } } }
      }
    });
  }
  static async getVisits(_query?: any) {
    return prisma.visit.findMany({
      orderBy: { agreedStartTime: 'desc' },
      include: {
        nurse: { include: { user: { select: { fullName: true } } } },
        doctor: { include: { user: { select: { fullName: true } } } },
        request: { include: { patient: { include: { user: { select: { fullName: true } } } } } }
      }
    });
  }

  // ─── Clinical Operations ──────────────────────────────────────────────────────
  static async getClinicalCasesByStatus(status: string | string[]) {
    return prisma.caseAssignment.findMany({
      where: { status: Array.isArray(status) ? { in: status } : status },
      orderBy: { createdAt: 'desc' },
      include: { doctor: { include: { user: { select: { fullName: true } } } }, visit: { include: { request: { include: { patient: { include: { user: { select: { fullName: true } } } } } } } } }
    });
  }
  static async getHighRiskCases() {
    return prisma.caseAssignment.findMany({
      where: { riskTier: { in: ['HIGH', 'CRITICAL'] } },
      orderBy: { createdAt: 'desc' },
      include: { doctor: { include: { user: { select: { fullName: true } } } }, visit: { include: { request: { include: { patient: { include: { user: { select: { fullName: true } } } } } } } } }
    });
  }

  // ─── Emergency Center ─────────────────────────────────────────────────────────
  static async getEmergencies(slaStatus?: string) {
    const where: any = {};
    if (slaStatus === 'active') {
      where.status = 'ACTIVE';
    } else if (slaStatus === 'resolved') {
      where.status = 'RESOLVED';
    }

    const events = await prisma.emergencyEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          include: {
            user: { select: { id: true, fullName: true, phone: true, email: true } },
          },
        },
        visit: {
          include: {
            caseAssignment: {
              include: {
                doctor: {
                  include: {
                    user: { select: { id: true, fullName: true, phone: true } },
                  },
                },
              },
            },
          },
        },
        dispatches: {
          orderBy: { dispatchedAt: 'desc' },
          include: {
            ambulance: true,
            paramedic: {
              include: {
                user: { select: { id: true, fullName: true, phone: true } },
              },
            },
            hospital: true,
          },
        },
      },
    });

    const assignedDoctorIds = [...new Set(events.map(e => e.assignedDoctorId).filter((id): id is string => !!id))];
    const assignedDoctors = await prisma.doctor.findMany({ where: { id: { in: assignedDoctorIds } }, select: { id: true, user: { select: { fullName: true } } } });
    const doctorNames = new Map(assignedDoctors.map(d => [d.id, d.user.fullName]));
    let mapped = events.map((e) => {
      const activeDispatch = e.dispatches?.find(d => ['PENDING', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED'].includes(d.status)) || null;
      const status = e.status || (e.visit as any)?.caseAssignment?.status || 'PENDING';
      const deadline = e.slaDeadline || (e.visit as any)?.caseAssignment?.slaDeadline || null;
      const isBreached = deadline ? new Date() > new Date(deadline) && status !== 'RESOLVED' : false;

      return {
        id: e.id,
        patientId: e.patientId,
        patientName: e.patient?.user?.fullName || 'Unknown Patient',
        patientPhone: e.patient?.user?.phone || null,
        visitId: e.visitId,
        source: e.source,
        severity: e.severity,
        status,
        slaDeadline: deadline,
        slaBreach: isBreached,
        assignedDoctorId: e.assignedDoctorId || (e.visit as any)?.caseAssignment?.doctorId || null,
        assignedDoctorName: (e.assignedDoctorId && doctorNames.get(e.assignedDoctorId)) || (e.visit as any)?.caseAssignment?.doctor?.user?.fullName || null,
        createdAt: e.createdAt,
        resolvedAt: e.resolvedAt,
        dispatches: e.dispatches,
        activeDispatch: activeDispatch
          ? {
              id: activeDispatch.id,
              status: activeDispatch.status,
              etaMinutes: activeDispatch.etaMinutes,
              dispatchedAt: activeDispatch.dispatchedAt,
              arrivedAt: activeDispatch.arrivedAt,
              completedAt: activeDispatch.completedAt,
              ambulance: activeDispatch.ambulance
                ? {
                    id: activeDispatch.ambulance.id,
                    vehicleNumber: activeDispatch.ambulance.vehicleNumber,
                    plateNumber: activeDispatch.ambulance.plateNumber,
                    type: activeDispatch.ambulance.type,
                    status: activeDispatch.ambulance.status,
                  }
                : null,
              paramedic: activeDispatch.paramedic
                ? {
                    id: activeDispatch.paramedic.id,
                    name: activeDispatch.paramedic.user?.fullName || 'Paramedic',
                    phone: activeDispatch.paramedic.user?.phone || null,
                    certificationNumber: activeDispatch.paramedic.certificationNumber,
                  }
                : null,
              hospital: activeDispatch.hospital
                ? {
                    id: activeDispatch.hospital.id,
                    name: activeDispatch.hospital.name,
                  }
                : null,
            }
          : null,
      };
    });

    if (slaStatus === 'active') {
      mapped = mapped.filter((e) => e.status !== 'RESOLVED');
    } else if (slaStatus === 'resolved') {
      mapped = mapped.filter((e) => e.status === 'RESOLVED');
    }

    return mapped;
  }

  static async assignEmergencyDoctor(emergencyId: string, doctorId: string) {
    return EscalationService.assignDoctor(emergencyId, doctorId);
  }

  static async assignEmergencyParamedic(dispatchId: string, paramedicId: string) {
    return ResourceAssignmentService.assignParamedic(dispatchId, paramedicId);
  }

  static async assignEmergencyAmbulance(dispatchId: string, ambulanceId: string) {
    return ResourceAssignmentService.assignVehicle(dispatchId, ambulanceId);
  }

  static async resolveEmergency(emergencyId: string, resolutionNotes?: string) {
    return prisma.$transaction(async (tx) => {
      // Lock dispatches first, matching the status-update lock order.
      await tx.$queryRaw`SELECT "id" FROM "ambulance_dispatches" WHERE "emergencyEventId" = ${emergencyId} ORDER BY "id" FOR UPDATE`;
      const event = await tx.emergencyEvent.findUnique({ where: { id: emergencyId }, include: { dispatches: { where: { status: { in: ['PENDING', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED'] } } } } });
      if (!event) throw new AppError('Emergency event not found', 404);
      const resolvedEvent = await tx.emergencyEvent.update({
        where: { id: emergencyId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        }
      });

      for (const dispatch of event.dispatches) {
        await tx.ambulanceDispatch.update({
          where: { id: dispatch.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            notes: resolutionNotes || dispatch.notes
          }
        });

        if (dispatch.ambulanceId) {
          await tx.ambulance.update({
            where: { id: dispatch.ambulanceId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      return resolvedEvent;
    });
  }

  static async escalateEmergency(emergencyId: string) {
    return prisma.emergencyEvent.update({
      where: { id: emergencyId },
      data: { severity: 'CRITICAL' }
    });
  }

  // ─── Healthcare Network ───────────────────────────────────────────────────────
  static async getHospitals() {
    return prisma.hospital.findMany({ orderBy: { name: 'asc' } });
  }
  static async createHospital(data: any) {
    const parsed = hospitalSchema.safeParse(data);
    if (!parsed.success) throw new AppError(parsed.error.issues.map(i => i.message).join('; '), 400);
    return prisma.hospital.create({ data: parsed.data });
  }
  static async updateHospital(id: string, data: any) {
    const parsed = hospitalSchema.partial().safeParse(data);
    if (!parsed.success) throw new AppError(parsed.error.issues.map(i => i.message).join('; '), 400);
    return prisma.hospital.update({ where: { id }, data: { ...parsed.data, ...(parsed.data.capacityStatus ? { capacityUpdatedAt: new Date() } : {}) } });
  }
  static async deleteHospital(id: string) {
    if (await prisma.ambulanceDispatch.count({ where: { hospitalId: id } })) throw new AppError('Hospital has dispatch history and cannot be deleted', 409);
    return prisma.hospital.delete({ where: { id } });
  }

  // ─── Reviews / Moderation ─────────────────────────────────────────────────────
  static async getNurseReviews() {
    return prisma.nurseReview.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        nurse: { include: { user: { select: { fullName: true } } } },
        patient: { include: { user: { select: { fullName: true } } } },
        visit: true
      }
    });
  }
  static async updateNurseReview(reviewId: string, data: any) {
    return prisma.nurseReview.update({ where: { id: reviewId }, data });
  }
  static async deleteNurseReview(reviewId: string) {
    return prisma.nurseReview.delete({ where: { id: reviewId } });
  }
}
