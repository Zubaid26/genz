const Cart = require('../models/Cart');
const { recalcCart } = require('../utils/cartTotals');
const { publicMethods, findMethod, normalizeMobile, normalizeCnic } = require('../config/paymentMethods');
const { CURRENCY, buildReference, isLive, isSandbox, signReference } = require('../config/gateways');
const jazzcash = require('../services/jazzcash');
const easypaisa = require('../services/easypaisa');

// Wallet gateways work in paisa.
const toMinorUnits = (amount) => Math.round(amount * 100);

const PREFIX = { jazzcash: 'JC', easypaisa: 'EP' };

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

    const mobile = normalizeMobile(req.body.mobile);
    if (!mobile) {
      return res.status(400).json({ message: 'Enter a valid mobile number, e.g. 0300 1234567.' });
    }

    let cnic = null;
    if (method.fields.includes('cnic')) {
      cnic = normalizeCnic(req.body.cnic);
      if (!cnic) {
        return res.status(400).json({ message: 'Enter the last 6 digits of your CNIC.' });
      }
    }

    const { error, total } = await resolveCartAmount(req.user._id);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const amountMinor = toMinorUnits(total);
    const reference = buildReference(PREFIX[method.id]);
    const description = `Gen-Z Threads order for ${req.user.full_name}`;

    // Sandbox: no merchant account needed, so checkout stays fully testable.
    if (isSandbox(method.provider)) {
      return res.json({
        reference,
        signature: signReference(reference, req.user._id, amountMinor),
        amount: total,
        currency: CURRENCY,
        mobile,
        sandbox: true,
        message: `Sandbox: a real ${method.label} prompt would be sent to ${mobile}.`
      });
    }

    const result = method.id === 'jazzcash'
      ? await jazzcash.chargeWallet({ reference, amountMinor, mobile, cnic, description })
      : await easypaisa.chargeMobileAccount({ reference, amount: total, mobile, email: req.user.email, description });

    if (!result.ok) {
      // Fails closed — a declined or unrecognised response never yields a signature.
      return res.status(402).json({ message: result.message, code: result.code });
    }

    res.json({
      reference: result.reference,
      signature: signReference(result.reference, req.user._id, amountMinor),
      amount: total,
      currency: CURRENCY,
      mobile,
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
