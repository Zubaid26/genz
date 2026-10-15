const crypto = require('crypto');

const isProduction = () => process.env.NODE_ENV === 'production';

const value = (name) => {
  const v = (process.env[name] || '').trim();
  // Treat template placeholders as "not configured".
  return v && !/^your_|_here$/i.test(v) ? v : '';
};

/**
 * Credentials for Pakistan's two mobile-wallet gateways.
 * Each gateway is "live" only when every required credential is present.
 */
const GATEWAYS = {
  jazzcash: {
    label: 'JazzCash',
    env: ['JAZZCASH_MERCHANT_ID', 'JAZZCASH_PASSWORD', 'JAZZCASH_INTEGRITY_SALT'],
    get config() {
      return {
        merchantId: value('JAZZCASH_MERCHANT_ID'),
        password: value('JAZZCASH_PASSWORD'),
        integritySalt: value('JAZZCASH_INTEGRITY_SALT'),
        returnUrl: value('JAZZCASH_RETURN_URL'),
        baseUrl: value('JAZZCASH_BASE_URL') ||
          'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoMWalletTransaction'
      };
    }
  },
  easypaisa: {
    label: 'Easypaisa',
    env: ['EASYPAISA_STORE_ID', 'EASYPAISA_HASH_KEY'],
    get config() {
      return {
        storeId: value('EASYPAISA_STORE_ID'),
        hashKey: value('EASYPAISA_HASH_KEY'),
        returnUrl: value('EASYPAISA_RETURN_URL'),
        baseUrl: value('EASYPAISA_BASE_URL') ||
          'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction'
      };
    }
  }
};

// Live when every required credential is set.
const isLive = (id) => {
  const gw = GATEWAYS[id];
  return Boolean(gw) && gw.env.every((name) => value(name));
};

/**
 * Sandbox mode lets the whole checkout be exercised before merchant onboarding.
 * Hard-disabled in production so a deployment with missing credentials fails
 * loudly instead of recording unpaid orders as paid.
 */
const isSandbox = (id) => !isLive(id) && !isProduction();

const isAvailable = (id) => isLive(id) || isSandbox(id);

const CURRENCY = 'PKR';

/**
 * References are HMAC-signed with the app secret so a sandbox payment cannot be
 * forged by guessing the format — the same guarantee a real gateway's hash gives.
 */
const SIGNING_SECRET = () => process.env.JWT_SECRET || 'insecure-dev-secret';

const signReference = (reference, userId, amountMinor) =>
  crypto
    .createHmac('sha256', SIGNING_SECRET())
    .update(`${reference}|${userId}|${amountMinor}`)
    .digest('hex');

const verifyReferenceSignature = (reference, userId, amountMinor, signature) => {
  const expected = signReference(reference, userId, amountMinor);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  // Constant-time compare; lengths must match or timingSafeEqual throws.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Gateway references look like JC-1728901234567-a1b2c3d4
const buildReference = (prefix) =>
  `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

for (const id of Object.keys(GATEWAYS)) {
  if (isProduction() && !isLive(id)) {
    console.warn(`[payments] ${GATEWAYS[id].label} credentials missing in production — this method is DISABLED.`);
  }
}

module.exports = {
  CURRENCY,
  GATEWAYS,
  buildReference,
  isAvailable,
  isLive,
  isProduction,
  isSandbox,
  signReference,
  verifyReferenceSignature
};
