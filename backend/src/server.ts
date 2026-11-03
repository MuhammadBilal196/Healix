import app from './app';
import { config } from './common/config';
import { logger } from './common/utils/logger';
import { prisma } from './common/config/database';
import { seedAdmin } from './common/config/seedAdmin';
import { registerMarketplaceListeners } from './domains/marketplace/marketplace/marketplace.listeners';
import { registerVisitListeners } from './domains/care/visit/visit.listeners';
import { registerContractListeners } from './domains/marketplace/contracts/contract.listeners';
import { registerCareListeners } from './domains/care/requests/care.listeners';
import { outboxService } from './common/events/outbox.service';
import { ChatSocketService } from './domains/communication/chat/chat.socket';
import { MaintenanceWorker } from './common/workers/maintenance.worker';
import { ContractService } from './domains/marketplace/contracts/contract.service';
import { MarketplaceRepository } from './domains/marketplace/marketplace/marketplace.repository';
import { SlaTimeoutWorker } from './domains/care/clinical/workers/sla-timeout.worker';
import { registerEmergencyListeners } from './domains/care/emergency/emergency.listeners';
import { registerClinicalListeners } from './domains/care/clinical/clinical.listeners';
import { CaseAssignmentWorker } from './domains/care/clinical/workers/case-assignment.worker';
import { DispatchAssignmentWorker } from './domains/care/emergency/workers/dispatch-assignment.worker';

const maintenance = new MaintenanceWorker([
  { name: 'contracts', run: () => ContractService.sweepExpiredContracts() },
  { name: 'offers', run: () => MarketplaceRepository.expireExpiredOffers() },
  { name: 'case assignments', run: () => CaseAssignmentWorker.processPendingCases() },
  { name: 'clinical SLA', run: () => SlaTimeoutWorker.processTimeouts() },
  { name: 'dispatch assignment', run: () => DispatchAssignmentWorker.assignWaiting() }
]);

// Initialize HTTP port listener
const server = app.listen(config.PORT, async () => {
  logger.info(`⚡ Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  ChatSocketService.initialize(server);
  await seedAdmin();
  registerMarketplaceListeners();
  registerVisitListeners();
  registerContractListeners();
  registerCareListeners();
  registerEmergencyListeners();
  registerClinicalListeners();
  outboxService.start();

  maintenance.start();
});

/**
 * Handle process termination gracefully.
 * Closes the Express server listener and disconnects Prisma to avoid hanging database connections.
 */
const gracefulShutdown = async (signal: string) => {
  logger.warn(`Received ${signal}. Shutting down server gracefully...`);
  await maintenance.stop();
  outboxService.stop();
  const io = ChatSocketService.getIo();
  if (io) io.disconnectSockets(true);
  server.close(async () => {
    logger.info('HTTP server closed.');
    if (io) io.close();
    await prisma.$disconnect();
    logger.info('Database disconnected. exiting process.');
    process.exit(0);
  });
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch any unhandled exceptions at runtime
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message} \nStack: ${err.stack}`);
  process.exit(1);
});

// Catch any unhandled Promise rejections at runtime
process.on('unhandledRejection', (reason: any) => {
  logger.error(`Unhandled Rejection at Promise: ${reason.message || reason} \nStack: ${reason.stack}`);
  process.exit(1);
});
