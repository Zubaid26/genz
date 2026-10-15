const Order = require('../models/Order');
const { verifyReferenceSignature } = require('../config/gateways');

const toMinorUnits = (amount) => Math.round(amount * 100);

/**
 * Confirms that a wallet payment genuinely succeeded before an order is created.
 *
 * The server issues a reference only after the gateway accepts the charge (or,
 * in sandbox, after validating the request), and signs it with the app secret
 * over the reference, the user and the exact amount. Re-checking that signature
 * here means a client cannot invent a payment, replay someone else's, or change
 * the amount after paying.
 *
 * Returns { ok: true } or { ok: false, status, message }.
 */
const verifyWalletPayment = async ({ reference, signature, userId, expectedTotal }) => {
  if (!reference || !signature) {
    return { ok: false, status: 400, message: 'Missing payment reference.' };
  }

  // A reference may only ever back one order.
  const alreadyUsed = await Order.exists({ payment_reference: reference });
  if (alreadyUsed) {
    return { ok: false, status: 409, message: 'This payment has already been used for an order.' };
  }

  // Binds the reference to this user AND this exact amount: if the cart changed
  // after payment, the signature no longer matches and the order is rejected.
  const valid = verifyReferenceSignature(reference, userId, toMinorUnits(expectedTotal), signature);
  if (!valid) {
    return {
      ok: false,
      status: 403,
      message: 'Payment could not be verified. Please retry the payment.'
    };
  }

  return { ok: true };
};

module.exports = { verifyWalletPayment, toMinorUnits };
