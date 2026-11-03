import { prisma } from '../../../../common/config/database';
import { logger } from '../../../../common/utils/logger';
import { EmergencyRepository } from '../emergency.repository';
import { ResourceAssignmentService } from '../resource-assignment.service';
import { ACTIVE_DISPATCH_STATUSES } from '../emergency.validation';

/**
 * A dispatch only gets a paramedic and an ambulance when it is created. If none was free at
 * that moment it used to wait forever, invisible to every paramedic. This worker fills those
 * gaps as soon as staff or vehicles become free (it runs every minute and after each trip ends).
 */
export class DispatchAssignmentWorker {
  static async assignWaiting() {
    const waiting = await prisma.ambulanceDispatch.findMany({
      where: { status: { in: ACTIVE_DISPATCH_STATUSES }, OR: [{ paramedicId: null }, { ambulanceId: null }] },
      orderBy: { dispatchedAt: 'asc' },
      select: { id: true, paramedicId: true, ambulanceId: true },
      take: 20,
    });

    let assigned = 0;
    for (const dispatch of waiting) {
      try {
        if (!dispatch.ambulanceId) {
          const vehicle = await EmergencyRepository.findAvailableAmbulance();
          if (vehicle) { await ResourceAssignmentService.assignVehicle(dispatch.id, vehicle.id); assigned++; }
        }
        if (!dispatch.paramedicId) {
          const paramedic = await EmergencyRepository.findLowestWorkloadParamedic();
          // assignParamedic also notifies the paramedic and opens the patient/nurse chat threads.
          if (paramedic) { await ResourceAssignmentService.assignParamedic(dispatch.id, paramedic.id); assigned++; }
        }
      } catch (error: any) {
        // Another request may have claimed the same paramedic or vehicle; the next run retries.
        logger.warn(`[Dispatch Assignment] Could not complete assignment for dispatch ${dispatch.id}: ${error?.message ?? error}`);
      }
    }
    return { waiting: waiting.length, assigned };
  }
}
