import { Router } from 'express';
import { prisma } from '../../../common/config/database';
import { protect, restrictTo } from '../../../common/middleware/authMiddleware';
import { asyncHandler } from '../../../common/middleware/asyncHandler';
import { AppError } from '../../../common/errors/AppError';

const router = Router();

/**
 * Cash-on-visit settlement: the nurse who delivered the care (or an administrator) confirms
 * the patient paid in cash. Replace with a gateway callback when online payments are added.
 */
router.put('/payments/:id/confirm-cash', protect as any, restrictTo('NURSE', 'ADMIN'), asyncHandler(async (req, res) => {
  const actor = (req as any).user;
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM payments WHERE id = ${req.params.id} FOR UPDATE`;
    const payment = await tx.payment.findUnique({
      where: { id: req.params.id },
      include: { request: { select: { contract: { select: { nurseId: true } }, visits: { select: { nurseId: true } } } } },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    if (actor.role === 'NURSE') {
      const nurseId = actor.nurse?.id;
      const isTheirs = !!nurseId && (payment.request.contract?.nurseId === nurseId || payment.request.visits.some(v => v.nurseId === nurseId));
      if (!isTheirs) throw new AppError('You can only confirm payments for your own visits', 403);
    }
    if (payment.status === 'PAID') return payment;
    if (payment.status !== 'PENDING') throw new AppError(`A ${payment.status.toLowerCase()} payment cannot be confirmed`, 409);
    return tx.payment.update({ where: { id: payment.id }, data: { status: 'PAID', paidAt: new Date() } });
  });
  res.json({ success: true, data: result });
}));

export default router;
