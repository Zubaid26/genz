const Cart = require('../models/Cart');
const { recalcCart } = require('../utils/cartTotals');
const { publicMethods, findMethod, normalizeCard, normalizeMobile, normalizeCnic } = require('../config/paymentMethods');
const { CURRENCY, GATEWAYS, buildReference, isLive, isSandbox, signReference } = require('../config/gateways');
const jazzcash = require('../services/jazzcash');
const easypaisa = require('../services/easypaisa');

// Wallet gateways work in paisa.
const toMinorUnits = (amount) => Math.round(amount * 100);

const PREFIX = { jazzcash: 'JC', easypaisa: 'EP', card: 'CD' };

/**
 * Authoritative order amount for the signed-in user.
 * Always derived from the stored cart — a client-supplied amount is never
 * trusted, otherwise a user could pay Rs 1 for a Rs 5,000 cart.
 */
const resolveCartAmount = async (userId) => {
  const cart = await Cart.findOne({ user_id: userId });
  if (!cart || cart.items.length === 0) {
    return { error: 'Cart is empty.' };
  }
  await recalcCart(cart);
  await cart.save();

  if (cart.total <= 0) {
    return { error: 'Order total must be greater than zero.' };
  }
  return { cart, total: cart.total };
};

// GET /api/payment/methods — payment options the checkout UI should render
exports.getMethods = async (req, res) => {
  res.json({ methods: publicMethods(), currency: CURRENCY });
};

/**
 * POST /api/payment/initiate — charge a mobile wallet.
 *
 * Returns a signed reference on success. The signature is what /orders/place
 * checks, so a client cannot invent a payment that never happened.
 */
exports.initiatePayment = async (req, res) => {
  try {
    const method = findMethod(req.body.method);
    if (!method || !method.requiresPayment) {
      return res.status(400).json({ message: 'Unsupported payment method.' });
    }

    const { error, total } = await resolveCartAmount(req.user._id);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const amountMinor = toMinorUnits(total);
    const reference = buildReference(PREFIX[method.id] || 'PY');
    const description = `Gen-Z Threads order for ${req.user.full_name}`;

    // ── Card payment ──────────────────────────────────────────────
    if (method.id === 'card') {
      const cardNumber = normalizeCard(req.body.cardNumber);
      if (!cardNumber) {
        return res.status(400).json({ message: 'Enter a valid card number (13–19 digits).' });
      }
      const expiry = String(req.body.expiry || '').trim();
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        return res.status(400).json({ message: 'Enter a valid expiry date (MM/YY).' });
      }
      const cvv = String(req.body.cvv || '').replace(/\D/g, '');
      if (cvv.length < 3 || cvv.length > 4) {
        return res.status(400).json({ message: 'Enter a valid CVV (3 or 4 digits).' });
      }
      const cardName = String(req.body.cardName || '').trim();
      if (!cardName) {
        return res.status(400).json({ message: 'Enter the name on your card.' });
      }

      // Sandbox — no Stripe key needed
      if (isSandbox('card')) {
        return res.json({
          reference,
          signature: signReference(reference, req.user._id, amountMinor),
          amount: total,
          currency: CURRENCY,
          sandbox: true,
          message: `Sandbox: card ending in ${cardNumber.slice(-4)} would be charged ${total} ${CURRENCY}.`
        });
      }

      // Live Stripe charge
      const stripe = require('stripe')(GATEWAYS.card.config.secretKey);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountMinor,
        currency: CURRENCY.toLowerCase(),
        description,
        metadata: { reference, user: String(req.user._id) },
        payment_method_data: {
          type: 'card',
          card: {
            number: cardNumber,
            exp_month: parseInt(expiry.split('/')[0], 10),
            exp_year: parseInt('20' + expiry.split('/')[1], 10),
            cvc: cvv
          },
          billing_details: { name: cardName }
        },
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' }
      });

      if (paymentIntent.status !== 'succeeded') {
        return res.status(402).json({ message: 'Card payment was not completed. Please try again.' });
      }

      return res.json({
        reference,
        signature: signReference(reference, req.user._id, amountMinor),
        amount: total,
        currency: CURRENCY,
        sandbox: false
      });
    }

    // ── Wallet payments (JazzCash / Easypaisa) ────────────────────
    const transactionId = String(req.body.transactionId || '').trim();
    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID / Reference Number is required.' });
    }

    const rawMobile = req.body.customerMobile || req.body.mobile;
    let mobile = '';
    if (rawMobile && String(rawMobile).trim()) {
      mobile = normalizeMobile(rawMobile);
      if (!mobile) {
        return res.status(400).json({ message: 'Enter a valid customer mobile number, e.g. 0300 1234567.' });
      }
    }

    // Sandbox / Direct manual merchant transfer mode:
    if (isSandbox(method.provider) || !isLive(method.provider)) {
      return res.json({
        reference,
        signature: signReference(reference, req.user._id, amountMinor),
        amount: total,
        currency: CURRENCY,
        mobile,
        transactionId,
        merchantAccountName: method.merchantName,
        merchantAccountNumber: method.merchantNumber,
        sandbox: isSandbox(method.provider),
        message: `Payment initiated for ${method.label}. Transaction ID: ${transactionId}`
      });
    }

    const result = method.id === 'jazzcash'
      ? await jazzcash.chargeWallet({ reference, amountMinor, mobile, description })
      : await easypaisa.chargeMobileAccount({ reference, amount: total, mobile, email: req.user.email, description });

    if (!result.ok) {
      return res.status(402).json({ message: result.message, code: result.code });
    }

    res.json({
      reference: result.reference,
      signature: signReference(result.reference, req.user._id, amountMinor),
      amount: total,
      currency: CURRENCY,
      mobile,
      transactionId,
      merchantAccountName: method.merchantName,
      merchantAccountNumber: method.merchantNumber,
      sandbox: false
    });
  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(500).json({ message: 'Payment service error.', error: error.message });
  }
};

module.exports.resolveCartAmount = resolveCartAmount;
module.exports.toMinorUnits = toMinorUnits;
module.exports.isLive = isLive;
