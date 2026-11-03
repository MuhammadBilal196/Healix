import { serviceCost } from '../marketplace/pricing';

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Records what the patient owes for one approved visit: the contract rate for the visit length
 * plus the platform fee. One Payment row exists per care request, so each approved visit of a
 * recurring series adds to it. No money moves here: the payment stays PENDING until the nurse
 * confirms cash received (or a payment gateway is connected).
 */
export async function recordVisitCharge(tx: any, requestId: string) {
  const request = await tx.careRequest.findUnique({
    where: { id: requestId },
    select: { durationMinutes: true, contract: { select: { price: true, priceType: true } } },
  });
  if (!request?.contract) return null;

  const feeConfig = await tx.platformFeeConfig.findFirst({ where: { effectiveFrom: { lte: new Date() } }, orderBy: { effectiveFrom: 'desc' } });
  const feePercentage = feeConfig?.feePercentage ?? 10;
  const service = serviceCost(request.contract.price, request.contract.priceType, (request.durationMinutes || 60) / 60);
  const amount = round2(service + round2((service * feePercentage) / 100));

  const existing = await tx.payment.findUnique({ where: { requestId } });
  if (!existing) {
    return tx.payment.create({ data: { requestId, amount, status: 'PENDING' } });
  }
  return tx.payment.update({
    where: { requestId },
    data: { amount: { increment: amount }, status: 'PENDING', paidAt: null },
  });
}
