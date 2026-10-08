const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// POST /api/payment/create-intent — create Stripe payment intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount.' });
    }

    // DEMO MODE: If key is placeholder, bypass Stripe
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_stripe_secret_key')) {
      console.log('--- DEMO MODE: Bypassing real Stripe intent ---');
      return res.json({
        clientSecret: 'demo_secret_' + Math.random().toString(36).substring(7),
        paymentIntentId: 'pi_demo_' + Date.now(),
        isDemo: true
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: 'usd',
      metadata: {
        userId: req.user._id.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Stripe Error:', error.message);
    res.status(500).json({ message: 'Payment service error.', error: error.message });
  }
};
