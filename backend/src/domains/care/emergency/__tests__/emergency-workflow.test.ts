import { prisma } from '../../../../common/config/database';
import { SlaTimeoutWorker } from '../../clinical/workers/sla-timeout.worker';
import { DispatchAmbulanceUseCase } from '../usecases/dispatch-ambulance.usecase';
import { EmergencyRepository } from '../emergency.repository';
import { DispatchService } from '../dispatch/dispatch.service';
import { ChatService } from '../../../communication/chat/chat.service';
import { ChatAutoCreator } from '../../../communication/chat/chat.auto-creator';
import { ExternalEmergencyController } from '../external/external-emergency.controller';
import { AppError } from '../../../../common/errors/AppError';

jest.mock('../../../../common/config/database', () => ({
  prisma: {
    caseAssignment: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    doctor: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    hospital: {
      findFirst: jest.fn().mockResolvedValue({ id: 'hosp-1', name: 'General Hospital' }),
      create: jest.fn().mockResolvedValue({ id: 'hosp-1', name: 'General Hospital' }),
    },
    assignmentLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
    administrator: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'case-1', status: 'PROFESSIONAL_BROADCAST' }]),
    ambulance: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paramedic: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    ambulanceDispatch: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    emergencyEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    eventOutbox: { create: jest.fn().mockResolvedValue({ id: 'outbox-1' }) },
    patient: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('../../../communication/chat/chat.socket', () => ({
  ChatSocketService: {
    getIo: jest.fn(() => ({
      emit: jest.fn(),
    })),
  },
}));

jest.mock('../../../identity/doctor/doctor.repository', () => ({
  DoctorRepository: {
    findEligibleDoctorsWithWorkload: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../communication/notification/notification.service', () => ({
  NotificationService: {
    dispatchNotification: jest.fn().mockResolvedValue(true),
  },
}));

describe('Healix SLA & Emergency Ambulance Workflow Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user as any).findFirst = jest.fn().mockResolvedValue(null);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 1: Clinical High Risk -> 5m SLA -> General Broadcast -> Doctor accepts -> ASSIGNED
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 1: SLA Timeout & Doctor Acceptance Lifecycle', () => {
    it('should transition timed-out cases from PROFESSIONAL_BROADCAST to GENERAL_BROADCAST after 5 minutes', async () => {
      const pastDeadline = new Date(Date.now() - 60000);
      (prisma.caseAssignment.findMany as jest.Mock).mockResolvedValue([
        { id: 'case-1', status: 'PROFESSIONAL_BROADCAST', slaDeadline: pastDeadline },
      ]);
      (prisma.caseAssignment.update as jest.Mock).mockResolvedValue({
        id: 'case-1',
        status: 'GENERAL_BROADCAST',
      });

      await SlaTimeoutWorker.processTimeouts();

      expect(prisma.caseAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'case-1' },
          data: expect.objectContaining({
            status: 'GENERAL_BROADCAST',
          }),
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 2: Doctor triggers REQUEST_EMERGENCY_AMBULANCE -> real Ambulance + lowest-workload Paramedic
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 2: Doctor-Only Emergency Ambulance Dispatch', () => {
    it('should assign real Ambulance and Paramedic, and update Ambulance status to DISPATCHED', async () => {
      (prisma.ambulanceDispatch.findFirst as jest.Mock).mockResolvedValue(null); // No active dispatch
      (prisma.ambulance.findFirst as jest.Mock).mockResolvedValue({
        id: 'amb-1',
        vehicleNumber: 'AMB-101',
        plateNumber: 'LHR-555',
        status: 'AVAILABLE',
      });
      (prisma.paramedic.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'para-1',
          userId: 'user-para-1',
          verificationStatus: 'VERIFIED',
          user: { fullName: 'Ali Paramedic', phone: '+923000000001' },
          ambulanceDispatches: [], // 0 active dispatches
        },
      ]);
      (prisma.emergencyEvent.create as jest.Mock).mockResolvedValue({ id: 'evt-1' });
      (prisma.ambulanceDispatch.create as jest.Mock).mockResolvedValue({
        id: 'disp-1',
        ambulanceId: 'amb-1',
        paramedicId: 'para-1',
        status: 'DISPATCHED',
      });
      (prisma.ambulance.update as jest.Mock).mockResolvedValue({
        id: 'amb-1',
        vehicleNumber: 'AMB-101',
        status: 'DISPATCHED',
      });
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue({ id: 'pat-1', userId: 'user-pat-1' });

      const useCase = new DispatchAmbulanceUseCase();
      const result = await useCase.execute('pat-1', undefined, 'doc-1', 'user-doc-1');

      expect(result.ambulanceDispatch.id).toBe('disp-1');
      expect(result.ambulance.vehicleNumber).toBe('AMB-101');
      expect(result.paramedic.user.fullName).toBe('Ali Paramedic');
      expect(prisma.ambulance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'amb-1' },
          data: { status: 'DISPATCHED' },
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 3: Paramedic Workload Balancing (Lowest Active Dispatches Count)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 3: Active Workload Balancing', () => {
    it('should select paramedic with lowest active dispatches count', async () => {
      (prisma.paramedic.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'para-busy',
          userId: 'user-para-busy',
          verificationStatus: 'VERIFIED',
          user: { fullName: 'Busy Paramedic' },
          ambulanceDispatches: [{ status: 'EN_ROUTE' }, { status: 'DISPATCHED' }], // 2 active
        },
        {
          id: 'para-free',
          userId: 'user-para-free',
          verificationStatus: 'VERIFIED',
          user: { fullName: 'Free Paramedic' },
          ambulanceDispatches: [], // 0 active
        },
        {
          id: 'para-moderate',
          userId: 'user-para-mod',
          verificationStatus: 'VERIFIED',
          user: { fullName: 'Moderate Paramedic' },
          ambulanceDispatches: [{ status: 'DISPATCHED' }], // 1 active
        },
      ]);

      const chosenParamedic = await EmergencyRepository.findLowestWorkloadParamedic();

      expect(chosenParamedic).toBeDefined();
      expect(chosenParamedic?.id).toBe('para-free');
      expect(chosenParamedic?.user.fullName).toBe('Free Paramedic');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 4: Paramedic Chat Auto-Creation
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 4: Paramedic Chat Auto-Creation', () => {
    it('should call getOrCreateThread for PATIENT_PARAMEDIC and NURSE_PARAMEDIC when paramedic is assigned', async () => {
      const getOrCreateSpy = jest.spyOn(ChatService, 'getOrCreateThread').mockResolvedValue({ id: 'thread-1' } as any);

      await ChatAutoCreator.onParamedicAssigned('user-para-1', 'user-pat-1', 'user-nurse-1');

      expect(getOrCreateSpy).toHaveBeenCalledWith('user-pat-1', 'user-para-1');
      expect(getOrCreateSpy).toHaveBeenCalledWith('user-nurse-1', 'user-para-1');

      getOrCreateSpy.mockRestore();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 5: Real Dispatch Lifecycle (DISPATCHED -> EN_ROUTE -> ARRIVED -> COMPLETED)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 5: Real Database Dispatch Lifecycle', () => {
    it('should transition status through valid lifecycle stages', async () => {
      const mockDispatch = {
        id: 'disp-1',
        status: 'DISPATCHED',
        ambulanceId: 'amb-1',
        paramedicId: 'para-1',
        emergencyEventId: 'evt-1',
      };
      (prisma.ambulanceDispatch.findUnique as jest.Mock).mockResolvedValue(mockDispatch);
      (prisma.ambulanceDispatch.update as jest.Mock).mockImplementation(({ data }) =>
        Promise.resolve({ ...mockDispatch, ...data })
      );
      (prisma.ambulance.update as jest.Mock).mockResolvedValue({ id: 'amb-1', status: 'AVAILABLE' });
      (prisma.emergencyEvent.update as jest.Mock).mockResolvedValue({ id: 'evt-1', status: 'RESOLVED' });

      // Advance to EN_ROUTE
      const enRoute = await DispatchService.updateDispatchStatus('disp-1', 'EN_ROUTE');
      expect(enRoute.status).toBe('EN_ROUTE');

      // Advance to ARRIVED
      mockDispatch.status = 'EN_ROUTE';
      const arrived = await DispatchService.updateDispatchStatus('disp-1', 'ARRIVED');
      expect(arrived.status).toBe('ARRIVED');
      expect(arrived.arrivedAt).toBeDefined();

      // Advance to COMPLETED
      mockDispatch.status = 'ARRIVED';
      const completed = await DispatchService.updateDispatchStatus('disp-1', 'COMPLETED');
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedAt).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 6: Ambulance Released to AVAILABLE on Completion
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 6: Ambulance Released on Dispatch Completion', () => {
    it('should release ambulance back to AVAILABLE and resolve emergencyEvent when dispatch completes', async () => {
      const mockDispatch = {
        id: 'disp-1',
        status: 'ARRIVED',
        ambulanceId: 'amb-1',
        paramedicId: 'para-1',
        emergencyEventId: 'evt-1',
      };
      (prisma.ambulanceDispatch.findUnique as jest.Mock).mockResolvedValue(mockDispatch);
      (prisma.ambulanceDispatch.update as jest.Mock).mockResolvedValue({
        ...mockDispatch,
        status: 'COMPLETED',
        completedAt: new Date(),
      });
      (prisma.ambulance.update as jest.Mock).mockResolvedValue({ id: 'amb-1', status: 'AVAILABLE' });
      (prisma.emergencyEvent.update as jest.Mock).mockResolvedValue({ id: 'evt-1', status: 'RESOLVED' });

      await DispatchService.updateDispatchStatus('disp-1', 'COMPLETED');

      expect(prisma.ambulance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'amb-1' },
          data: { status: 'AVAILABLE' },
        })
      );
      expect(prisma.emergencyEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'evt-1' },
          data: expect.objectContaining({ status: 'RESOLVED' }),
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 7: Role Authorization Rejection for Non-Doctors
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 7: Role Authorization Guard', () => {
    it('should reject ambulance dispatch request if caller is PATIENT', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-pat-1',
        role: 'PATIENT',
        doctor: null,
      });

      await expect(
        DispatchService.triggerAmbulanceDispatch('pat-1', 'hosp-1', 'user-pat-1')
      ).rejects.toThrow(AppError);
    });

    it('should reject ambulance dispatch request if caller is NURSE', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-nurse-1',
        role: 'NURSE',
        doctor: null,
      });

      await expect(
        DispatchService.triggerAmbulanceDispatch('pat-1', 'hosp-1', 'user-nurse-1')
      ).rejects.toThrow(AppError);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 8: External Emergency 1122 Request Logged Without Fake Dispatch
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 8: External 1122 Emergency Request Isolation', () => {
    it('should log external 1122 event without creating any ambulanceDispatch record', async () => {
      (prisma.emergencyEvent.create as jest.Mock).mockResolvedValue({
        id: 'ext-evt-1',
        patientId: 'pat-1',
        source: 'EXTERNAL_1122',
        severity: 'CRITICAL',
        status: 'ACTIVE',
      });
      (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
        id: 'pat-1',
        userId: 'user-pat-1',
      });

      const req: any = {
        body: { patientId: 'pat-1', serviceName: '1122', notes: 'Severe head trauma' },
        user: { id: 'user-nurse-1' },
      };
      const res: any = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await ExternalEmergencyController.logExternalRequest(req, res);

      expect(prisma.emergencyEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: 'EXTERNAL_1122',
            severity: 'CRITICAL',
            status: 'ACTIVE',
          }),
        })
      );
      // Verify NO fake ambulance dispatch was created
      expect(prisma.ambulanceDispatch.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            serviceName: '1122',
            helplineNumber: '1122',
          }),
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario 9: No Automatic Escalation from GENERAL_BROADCAST to ADMIN_ESCALATED
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Scenario 9: SlaTimeoutWorker Boundaries', () => {
    it('should NOT automatically escalate cases in GENERAL_BROADCAST to ADMIN_ESCALATED', async () => {
      (prisma.caseAssignment.findMany as jest.Mock).mockResolvedValue([
        // Only PROFESSIONAL_BROADCAST cases are queried
      ]);

      await SlaTimeoutWorker.processTimeouts();

      // Ensure findMany is ONLY called for PROFESSIONAL_BROADCAST
      expect(prisma.caseAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PROFESSIONAL_BROADCAST',
          }),
        })
      );

      // Verify no update to ADMIN_ESCALATED occurred
      expect(prisma.caseAssignment.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ADMIN_ESCALATED',
          }),
        })
      );
    });
  });
});  it('does not allocate a paramedic already serving an active trip', async () => {
    (prisma.paramedic.findMany as jest.Mock).mockResolvedValue([{ id: 'busy', ambulanceDispatches: [{ id: 'active' }] }]);
    await expect(EmergencyRepository.findLowestWorkloadParamedic()).resolves.toBeNull();
  });


