import { prisma } from './database';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

export async function seedAdmin() {
  try {
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
    const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();

    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    if (email && password) {
      if (password.length < 8) throw new Error('Bootstrap administrator password must be at least 8 characters');
      const existing = await prisma.user.findUnique({ where: { email }, include: { admin: true } });

      if (!existing) {
        logger.info('[SEED] Seeding bootstrap admin account...');
        const passwordHash = await bcrypt.hash(password, 12);
        const defaultPhoneTaken = await prisma.user.findUnique({ where: { phone: '+923000000000' } });
        const phone = defaultPhoneTaken ? `+92300000${Date.now().toString().slice(-4)}` : '+923000000000';

        await prisma.user.create({
          data: {
            email,
            phone,
            fullName: 'Healix System Administrator',
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerificationRequired: false,
            admin: { create: {} }
          }
        });
        logger.info('[SEED] Administrator created; credentials are not logged.');
      } else if (existing.role === 'ADMIN' && (existing.status !== 'ACTIVE' || existing.deletedAt !== null || !existing.admin || existing.emailVerificationRequired)) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            status: 'ACTIVE',
            deletedAt: null,
            emailVerificationRequired: false,
            admin: { upsert: { create: {}, update: {} } }
          }
        });
        logger.info('[SEED] Reactivated and verified bootstrap administrator account.');
      }
    } else if (adminCount === 0) {
      logger.warn('[SEED] Configure ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD to create the first administrator.');
    }

    // Seed default configs
    const configCount = await prisma.platformConfig.count();
    if (configCount === 0) {
      logger.info('[SEED] Seeding default platform configurations...');
      await prisma.platformConfig.createMany({
        data: [
          { key: 'platform_fee_pct', value: '10' },
          { key: 'escalation_sla_max_minutes', value: '15' }
        ]
      });
      logger.info('[SEED] Platform configurations successfully seeded.');
    }
  } catch (e: any) {
    logger.error(`[SEED ERROR] Failed to seed default admin or config: ${e.message}`);
  }
}
