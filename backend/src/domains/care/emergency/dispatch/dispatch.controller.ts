import { Request, Response } from 'express';
import { DispatchService } from './dispatch.service';
import { AssertPatientAccessUseCase } from '../../../identity/patient/usecases/profile/assert-patient-access.usecase';

const ok = (res: Response, data: any, message = 'Success') =>
  res.json({ success: true, message, data });

const fail = (res: Response, err: any) => {
  const status = err.statusCode ?? 500;
  res.status(status).json({ success: false, message: err.message ?? 'Internal error' });
};

export class DispatchController {
  static async recommendHospitals(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, latitude, longitude } = req.query;
      if (!patientId || !latitude || !longitude) {
        res.status(400).json({ success: false, message: 'patientId, latitude, and longitude are required' });
        return;
      }
      await AssertPatientAccessUseCase.execute(String(patientId), (req as any).user);
      const list = await DispatchService.recommendHospitals(
        String(patientId),
        parseFloat(String(latitude)),
        parseFloat(String(longitude)),
        String(req.query.affordabilityTier || 'HIGH')
      );
      ok(res, list);
    } catch (e: any) {
      fail(res, e);
    }
  }

  static async triggerAmbulanceDispatch(req: Request, res: Response): Promise<void> {
    try {
      const { patientId, hospitalId, justification } = req.body;
      const triggeredByUserId = (req as any).user.id;
      if (!patientId || !hospitalId) {
        res.status(400).json({ success: false, message: 'patientId and hospitalId are required' });
        return;
      }
      if (typeof justification !== 'string' || justification.trim().length < 10) {
        res.status(400).json({ success: false, message: 'A clinical justification of at least 10 characters is required' }); return;
      }
      await AssertPatientAccessUseCase.execute(patientId, (req as any).user);
      const dispatch = await DispatchService.triggerAmbulanceDispatch(patientId, hospitalId, triggeredByUserId, justification.trim());
      ok(res, dispatch, 'Ambulance dispatch triggered successfully');
    } catch (e: any) {
      fail(res, e);
    }
  }

  static async getDispatchTracking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await DispatchService.assertAccess(id, (req as any).user);
      const tracking = await DispatchService.getDispatchTracking(id);
      ok(res, tracking);
    } catch (e: any) {
      fail(res, e);
    }
  }

  static async updateDispatchStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      await DispatchService.assertAccess(id, (req as any).user, true);
      if (!status) {
        res.status(400).json({ success: false, message: 'status is required' });
        return;
      }
      const updated = await DispatchService.updateDispatchStatus(id, status, notes, (req as any).user);
      // A finished or cancelled trip frees a paramedic and vehicle: give them to any dispatch still waiting.
      if (['COMPLETED', 'CANCELLED'].includes(status)) {
        const { DispatchAssignmentWorker } = require('../workers/dispatch-assignment.worker');
        DispatchAssignmentWorker.assignWaiting().catch(() => undefined);
      }
      ok(res, updated, `Dispatch status updated to ${status}`);
    } catch (e: any) {
      fail(res, e);
    }
  }
}
