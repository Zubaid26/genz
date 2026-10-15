/**
 * Single source of truth for price display.
 *
 * JazzCash and Easypaisa settle in PKR, so the whole storefront shows rupees.
 * Pakistani retail prices are conventionally written without paisa
 * (Rs 3,490 — not Rs 3,490.00), so whole amounts render without decimals and
 * only an amount with real paisa keeps them.
 */
export const CURRENCY_CODE = 'PKR';
export const CURRENCY_SYMBOL = 'Rs';

export const money = (amount) => {
  const n = Number(amount) || 0;
  const hasPaisa = Math.round(n * 100) % 100 !== 0;
  return `${CURRENCY_SYMBOL} ${n.toLocaleString('en-PK', {
    minimumFractionDigits: hasPaisa ? 2 : 0,
    maximumFractionDigits: 2
  })}`;
};

export default money;
