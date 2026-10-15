import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiLock, FiAlertCircle, FiTruck, FiLoader, FiSmartphone,
  FiArrowLeft, FiShield, FiCheckCircle, FiCreditCard
} from 'react-icons/fi';
import useCart from '../hooks/useCart';
import API from '../utils/axiosInstance';
import PaymentMethodPicker from '../components/PaymentMethodPicker';
import { money } from '../utils/currency';
import toast from 'react-hot-toast';
import './Checkout.css';

const EMPTY_ADDRESS = {
  full_name: '', phone: '', address: '', city: '', zip: '', country: 'Pakistan'
};

const validateAddress = (form) => {
  const required = { full_name: 'Full name', phone: 'Phone', address: 'Street address', city: 'City' };
  for (const [field, label] of Object.entries(required)) {
    if (!form[field].trim()) return `${label} is required.`;
  }
  if (form.phone.replace(/\D/g, '').length < 7) return 'Please enter a valid phone number.';
  return null;
};

const isValidMobile = (raw) => {
  const d = String(raw || '').replace(/\D/g, '');
  return /^0?3\d{9}$/.test(d) || /^923\d{9}$/.test(d) || /^00923\d{9}$/.test(d);
};

const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery (COD)',
    description: 'Pay the courier in cash when your order arrives.',
    provider: 'manual',
    requiresPayment: false,
    fields: []
  },
  {
    id: 'card',
    label: 'Debit/Credit Card',
    description: 'Pay securely with Visa, Mastercard, or UnionPay.',
    provider: 'card',
    requiresPayment: true,
    fields: ['cardNumber', 'expiry', 'cvv', 'cardName']
  },
  {
    id: 'jazzcash',
    label: 'JazzCash',
    description: 'Pay from your JazzCash mobile wallet.',
    provider: 'jazzcash',
    requiresPayment: true,
    fields: ['mobile', 'cnic']
  },
  {
    id: 'easypaisa',
    label: 'Easypaisa',
    description: 'Pay from your Easypaisa mobile account.',
    provider: 'easypaisa',
    requiresPayment: true,
    fields: ['mobile']
  }
];

export default function Checkout() {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [wallet, setWallet] = useState({ mobile: '', cnic: '' });
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvv: '', cardName: '' });
  const [methods, setMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [selected, setSelected] = useState('cod');
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleWallet = (e) => setWallet((w) => ({ ...w, [e.target.name]: e.target.value }));
  const handleCard = (e) => {
    let { name, value } = e.target;
    if (name === 'cardNumber') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
    } else if (name === 'expiry') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').slice(0, 5);
    } else if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    setCard((c) => ({ ...c, [name]: value }));
  };

  const selectedMethod = methods.find((m) => m.id === selected) || null;
  const isEmpty = !cart.items || cart.items.length === 0;

  useEffect(() => {
    API.get('/payment/methods')
      .then((res) => {
        const list = res.data.methods || [];
        if (list.length > 0) {
          setMethods(list);
          setSelected((prev) => (list.some((m) => m.id === prev) ? prev : list[0].id));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch dynamic payment methods, using defaults:', err);
      });
  }, []);

  const placeOrder = useCallback(async (payment) => {
    const res = await API.post('/orders/place', {
      payment_method: selected,
      payment_reference: payment?.reference,
      payment_signature: payment?.signature,
      payer_mobile: payment?.mobile,
      shipping_address: form
    });
    await fetchCart();
    toast.success(
      res.data.order.payment_status === 'paid'
        ? 'Payment received — order confirmed!'
        : 'Order placed! Pay on delivery.'
    );
    navigate(`/order-confirmation/${res.data.order._id}`);
  }, [selected, form, fetchCart, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMethod) return;

    const addressProblem = validateAddress(form);
    if (addressProblem) { toast.error(addressProblem); return; }

    if (selectedMethod.requiresPayment && selectedMethod.id !== 'card') {
      if (!isValidMobile(wallet.mobile)) {
        toast.error('Enter a valid mobile number, e.g. 0300 1234567.');
        return;
      }
      if (selectedMethod.fields.includes('cnic') && wallet.cnic.replace(/\D/g, '').length < 6) {
        toast.error('Enter the last 6 digits of your CNIC.');
        return;
      }
    }

    if (selectedMethod.id === 'card') {
      const digits = card.cardNumber.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) {
        toast.error('Enter a valid card number.'); return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) {
        toast.error('Enter a valid expiry date (MM/YY).'); return;
      }
      if (card.cvv.length < 3) {
        toast.error('Enter a valid CVV.'); return;
      }
      if (!card.cardName.trim()) {
        toast.error('Enter the name on your card.'); return;
      }
    }

    setBusy(true);
    try {
      let payment = null;

      if (selectedMethod.id === 'card') {
        const res = await API.post('/payment/initiate', {
          method: 'card',
          cardNumber: card.cardNumber.replace(/\s/g, ''),
          expiry: card.expiry,
          cvv: card.cvv,
          cardName: card.cardName
        });
        payment = res.data;
      } else if (selectedMethod.requiresPayment) {
        const res = await API.post('/payment/initiate', {
          method: selectedMethod.id,
          mobile: wallet.mobile,
          cnic: wallet.cnic
        });
        payment = res.data;
      }

      await placeOrder(payment);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (isEmpty) {
    return (
      <div className="checkout-editorial-page container">
        <div className="checkout-empty-card">
          <h1>Your Shopping Bag is Empty</h1>
          <p>Add the pieces you love before proceeding to checkout.</p>
          <Link to="/products" className="btn-primary">
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  const renderPaymentFields = () => {
    if (loadingMethods) {
      return (
        <div className="checkout-pay-notice">
          <FiLoader className="spin" />
          <span>Loading secure payment options…</span>
        </div>
      );
    }
    if (!selectedMethod) return <p className="checkout-pay-notice">No payment methods available.</p>;

    if (selectedMethod.id === 'cod') {
      return (
        <div className="checkout-pay-notice cod-box">
          <FiTruck className="notice-icon" />
          <div>
            <strong>Cash on Delivery (COD)</strong>
            <p>Pay <strong>{money(cart.total)}</strong> in cash when the rider delivers your package. Please keep exact change ready for smooth handover.</p>
          </div>
        </div>
      );
    }

    // ── Card fields ───────────────────────────────────────────────
    if (selectedMethod.id === 'card') {
      return (
        <div className="wallet-input-container">
          {selectedMethod.sandbox && (
            <div className="checkout-pay-notice sandbox-box">
              <FiAlertCircle className="notice-icon" />
              <div>
                <strong>Sandbox Testing Mode Active</strong>
                <p>No real charge will be made. You can test with any valid card format.</p>
              </div>
            </div>
          )}
          <div className="wallet-fields-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="cardNumber">Card Number *</label>
              <input
                id="cardNumber"
                name="cardNumber"
                type="text"
                inputMode="numeric"
                value={card.cardNumber}
                onChange={handleCard}
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cardName">Name on Card *</label>
              <input
                id="cardName"
                name="cardName"
                type="text"
                value={card.cardName}
                onChange={handleCard}
                autoComplete="cc-name"
                placeholder="Ahmed Khan"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="expiry">Expiry Date *</label>
              <input
                id="expiry"
                name="expiry"
                type="text"
                inputMode="numeric"
                value={card.expiry}
                onChange={handleCard}
                autoComplete="cc-exp"
                placeholder="MM/YY"
                maxLength={5}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cvv">CVV *</label>
              <input
                id="cvv"
                name="cvv"
                type="password"
                inputMode="numeric"
                value={card.cvv}
                onChange={handleCard}
                autoComplete="cc-csc"
                placeholder="•••"
                maxLength={4}
                required
              />
            </div>
          </div>
          <p className="wallet-prompt-note">
            <FiCreditCard />
            <span>Your card will be charged <strong>{money(cart.total)}</strong>. Transaction is SSL encrypted and PCI-DSS compliant.</span>
          </p>
        </div>
      );
    }

    // ── Wallet fields (JazzCash / Easypaisa) ──────────────────────
    return (
      <div className="wallet-input-container">
        {selectedMethod.sandbox && (
          <div className="checkout-pay-notice sandbox-box">
            <FiAlertCircle className="notice-icon" />
            <div>
              <strong>Sandbox Testing Mode Active</strong>
              <p>No real funds will be deducted from your account. You can test with any valid 11-digit mobile format.</p>
            </div>
          </div>
        )}
        <div className="wallet-fields-grid">
          <div className="form-group">
            <label htmlFor="mobile">{selectedMethod.label} Mobile Account Number *</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              value={wallet.mobile}
              onChange={handleWallet}
              autoComplete="tel"
              placeholder="0300 1234567"
              required
            />
          </div>
          {selectedMethod.fields.includes('cnic') && (
            <div className="form-group">
              <label htmlFor="cnic">CNIC Verification (Last 6 Digits) *</label>
              <input
                id="cnic"
                name="cnic"
                inputMode="numeric"
                maxLength={6}
                value={wallet.cnic}
                onChange={handleWallet}
                placeholder="123456"
                required
              />
            </div>
          )}
        </div>
        <p className="wallet-prompt-note">
          <FiSmartphone />
          <span>You will receive an in-app confirmation prompt on your {selectedMethod.label} app to approve {money(cart.total)}.</span>
        </p>
      </div>
    );
  };

  const buttonLabel = () => {
    if (busy) return selectedMethod?.requiresPayment ? 'Verifying payment with gateway…' : 'Finalizing order…';
    if (!selectedMethod) return 'Select a payment method';
    return selectedMethod.requiresPayment
      ? `Pay ${money(cart.total)} via ${selectedMethod.label}`
      : `Confirm Order · Pay ${money(cart.total)} on Delivery`;
  };

  return (
    <div className="checkout-editorial-page container">
      {/* Breadcrumb Navigation */}
      <div className="checkout-top-nav">
        <Link to="/cart" className="checkout-back-link">
          <FiArrowLeft />
          <span>Back to Shopping Bag</span>
        </Link>
      </div>

      <div className="checkout-page-title-row">
        <div>
          <span className="eyebrow">Secure Checkout</span>
          <h1 className="checkout-main-title">Shipping & Payment</h1>
        </div>
        <div className="secure-badge-pill">
          <FiLock />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      <div className="checkout-two-col-grid">
        {/* Left Column: Delivery Details & Payment */}
        <form className="checkout-main-form" onSubmit={handleSubmit}>
          {/* Section 1: Shipping Address */}
          <section className="checkout-form-section">
            <div className="section-title-wrap">
              <span className="section-step-num">1</span>
              <div>
                <h2 className="section-step-heading">Shipping Address</h2>
                <p className="section-step-caption">Where should we deliver your parcel?</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Full Recipient Name *</label>
              <input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Asia Parveen"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Street Address, House/Apartment No. *</label>
              <input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                autoComplete="street-address"
                placeholder="House 12, Street 4, Model Town"
                required
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  placeholder="Vehari"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="zip">Postal / Zip Code</label>
                <input
                  id="zip"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  autoComplete="postal-code"
                  placeholder="61100"
                />
              </div>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  autoComplete="country-name"
                  placeholder="Pakistan"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number (For Rider Updates) *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  placeholder="0300 1234567"
                  required
                />
              </div>
            </div>
          </section>

          {/* Section 2: Payment Options */}
          <section className="checkout-form-section">
            <div className="section-title-wrap">
              <span className="section-step-num">2</span>
              <div>
                <h2 className="section-step-heading">Payment Method</h2>
                <p className="section-step-caption">Select your preferred payment channel</p>
              </div>
            </div>

            <PaymentMethodPicker
              methods={methods}
              selected={selected}
              onSelect={setSelected}
              disabled={busy}
            />

            {renderPaymentFields()}

            <button
              type="submit"
              className="btn-primary checkout-submit-btn"
              disabled={busy || !selectedMethod}
            >
              {busy ? <FiLoader className="spin" /> : <FiLock />}
              <span>{buttonLabel()}</span>
            </button>

            <div className="checkout-assurance-row">
              <FiShield />
              <span>Orders are verified and digitally tracked. Invoices are generated upon placement.</span>
            </div>
          </section>
        </form>

        {/* Right Column: Order Review Sidebar */}
        <aside className="checkout-review-column">
          <div className="checkout-summary-card">
            <h2 className="summary-card-title">Order Review</h2>

            <div className="checkout-items-mini-list">
              {cart.items.map((item) => (
                <div key={item._id} className="mini-item-row">
                  <div className="mini-item-thumb">
                    <img
                      src={item.product_id?.image_url}
                      alt={item.product_id?.name || ''}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200";
                      }}
                    />
                    <span className="mini-item-qty">{item.quantity}</span>
                  </div>
                  <div className="mini-item-meta">
                    <p className="mini-item-title">{item.product_id?.name}</p>
                    <p className="mini-item-sub">{item.product_id?.category}</p>
                  </div>
                  <span className="mini-item-price">
                    {money(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-pricing-breakdown">
              <div className="pricing-line">
                <span>Subtotal</span>
                <span>{money(cart.subtotal || cart.total)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="pricing-line discount-line">
                  <span>Special Promotion {cart.coupon_code && `(${cart.coupon_code})`}</span>
                  <span>−{money(cart.discount)}</span>
                </div>
              )}
              <div className="pricing-line">
                <span>Shipping</span>
                <span className="shipping-free-label">FREE</span>
              </div>
              <div className="pricing-divider" />
              <div className="pricing-total-line">
                <span>Total Amount</span>
                <span className="total-due">{money(cart.total)}</span>
              </div>
            </div>

            <div className="checkout-perks-box">
              <div className="perk-row">
                <FiCheckCircle className="check-icon" />
                <span>30-Day Money-Back & Exchange Guarantee</span>
              </div>
              <div className="perk-row">
                <FiCheckCircle className="check-icon" />
                <span>Express 2-4 Day Delivery to your doorstep</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
