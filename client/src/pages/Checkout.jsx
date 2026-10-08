import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import API from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Checkout.css';

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', zip: '', phone: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.items || cart.items.length === 0) {
      toast.error('Cart is empty'); return;
    }
    setLoading(true);
    try {
      // Create payment intent
      const payRes = await API.post('/payment/create-intent', { amount: cart.total });
      // Place order
      const orderRes = await API.post('/orders/place', {
        payment_intent_id: payRes.data.paymentIntentId
      });
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${orderRes.data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="checkout-page container">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="checkout-form">
          <h2>Shipping Information</h2>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input name="address" value={form.address} onChange={handleChange} required placeholder="123 Main St" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} required placeholder="New York" />
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input name="zip" value={form.zip} onChange={handleChange} required placeholder="10001" />
            </div>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+1 234 567 890" />
          </div>
          <h2>Payment</h2>
          <div className="payment-info">
            <p>💳 Payment will be processed securely via Stripe</p>
          </div>
          <button type="submit" className="place-order-btn" disabled={loading}>
            {loading ? 'Processing...' : `Pay $${cart.total?.toFixed(2)} & Place Order`}
          </button>
        </form>
        <div className="order-summary">
          <h2>Order Summary</h2>
          {cart.items?.map(item => (
            <div key={item._id} className="summary-item">
              <img src={item.product_id?.image_url} alt="" />
              <div>
                <p className="s-name">{item.product_id?.name}</p>
                <p className="s-qty">Qty: {item.quantity}</p>
              </div>
              <p className="s-price">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <span>${cart.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
