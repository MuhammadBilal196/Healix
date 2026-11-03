/**
 * Creates the administrator account, or resets its password, and then checks the login works.
 *
 * Usage (from the project root):
 *   pnpm --filter healix-backend admin:reset 'admin@healix.pk' 'YourStrongPassword123!'
 * Without arguments it uses ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD from backend/.env.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function freePhone(preferred: string, ownerId?: string) {
  const taken = await prisma.user.findUnique({ where: { phone: preferred }, select: { id: true } });
  if (!taken || taken.id === ownerId) return preferred;
  for (let i = 1; i < 100; i++) {
    const candidate = `+9230000000${String(i).padStart(2, '0')}`;
    const used = await prisma.user.findUnique({ where: { phone: candidate }, select: { id: true } });
    if (!used || used.id === ownerId) return candidate;
  }
  throw new Error('Could not find a free phone number for the administrator account.');
}

async function main() {
  const email = (process.argv[2] || process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase();
  const password = process.argv[3] || process.env.ADMIN_BOOTSTRAP_PASSWORD || '';

  if (!email || !password) {
    throw new Error("Give an email and password: pnpm --filter healix-backend admin:reset 'admin@healix.pk' 'YourStrongPassword123!' (or set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD in backend/.env).");
  }
  if (password.length < 12) throw new Error('The administrator password must be at least 12 characters.');

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.role !== 'ADMIN') {
    throw new Error(`${email} already belongs to a ${existing.role} account. Use a different email for the administrator.`);
  }

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        deletedAt: null,
        mfaEnabled: false,
        emailVerificationRequired: false,
        admin: { upsert: { create: {}, update: {} } },
      },
    });
    console.log(`✅ Administrator password reset: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        phone: await freePhone('+923000000000'),
        fullName: 'Healix System Administrator',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        admin: { create: {} },
      },
    });
    console.log(`✅ Administrator created: ${email}`);
  }

  // Check the same way the login endpoint does.
  const check = await prisma.user.findUnique({ where: { email } });
  const ok = !!check && await bcrypt.compare(password, check.passwordHash) && check.status === 'ACTIVE' && !check.deletedAt;
  if (!ok) throw new Error('The account was saved but the password check failed. Please report this output.');

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
  console.log(`🔑 Login check passed. Sign in with: ${email}`);
  console.log(`ℹ️  Administrator accounts in this database: ${admins.map(a => a.email).join(', ')}`);
}

main()
  .catch((error) => {
    console.error('❌', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
