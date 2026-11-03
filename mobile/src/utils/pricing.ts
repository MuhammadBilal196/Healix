/** Mirrors backend/src/domains/marketplace/marketplace/pricing.ts so screens show the same numbers. */
export function serviceEstimate(price: number, priceType: string, minutes: number) {
  const hours = minutes / 60;
  const units = priceType === 'DAILY' ? Math.ceil(hours / 24) : priceType === 'FIXED' ? 1 : hours;
  return Math.round(price * units * 100) / 100;
}

export function rateLabel(priceType: string) {
  if (priceType === 'DAILY') return 'per day';
  if (priceType === 'FIXED') return 'fixed price';
  return 'per hour';
}

export function durationLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "PKR 2,000 per hour × 45 min" style explanation of how an estimate was reached. */
export function estimateExplanation(price: number, priceType: string, minutes: number) {
  const rate = `PKR ${pkr(price)}`;
  if (priceType === 'FIXED') return `${rate} fixed price`;
  if (priceType === 'DAILY') return `${rate} per day × ${Math.max(1, Math.ceil(minutes / 1440))} day(s)`;
  return `${rate} per hour × ${durationLabel(minutes)}`;
}

export function pkr(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });
}
