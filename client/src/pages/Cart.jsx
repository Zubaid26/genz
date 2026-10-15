import { Link } from 'react-router-dom';
import {
  FiMinus, FiPlus, FiTrash2, FiArrowRight, FiShoppingBag,
  FiTruck, FiShield, FiArrowLeft
} from 'react-icons/fi';
import useCart from '../hooks/useCart';
import './Cart.css';
import { money } from '../utils/currency';

export default function Cart() {
  const { cart, updateItem, removeItem, clearCart } = useCart();
  const items = cart.items || [];

  if (items.length === 0) {
    return (
      <div className="cart-editorial-page container">
        <div className="cart-empty-box">
          <div className="empty-bag-icon">
            <FiShoppingBag />
          </div>
          <h1>Your Shopping Bag is Empty</h1>
          <p>Explore our curated collections, oversized streetwear, and contemporary kurtas.</p>
          <Link to="/products" className="btn-primary">
            <span>Explore Collections</span>
            <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = cart.total >= 2500 ? 0 : 250;
  const qualifiesForFreeShipping = cart.total >= 2500;
  const amountToFreeShipping = 2500 - cart.total;

  return (
    <div className="cart-editorial-page container">
      {/* Page Header */}
      <div className="cart-page-header">
        <div>
          <span className="eyebrow">Checkout Bag</span>
          <h1 className="cart-main-title">Shopping Bag</h1>
        </div>
        <Link to="/products" className="cart-continue-shopping">
          <FiArrowLeft />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* Free Shipping Progress Indicator */}
      <div className="cart-shipping-banner">
        <FiTruck className="shipping-icon" />
        <div className="shipping-banner-text">
          {qualifiesForFreeShipping ? (
            <span><strong>Congratulations!</strong> You qualify for <strong>Free Express Shipping</strong>.</span>
          ) : (
            <span>
              Add <strong>{money(amountToFreeShipping)}</strong> more to your bag to unlock <strong>Free Express Shipping</strong>.
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Cart Layout */}
      <div className="cart-main-grid">
        {/* Left: Cart Items Table/List */}
        <div className="cart-items-column">
          <div className="cart-items-header-row">
            <span>Item Details</span>
            <span>Quantity</span>
            <span>Subtotal</span>
          </div>

          <div className="cart-items-list">
            {items.map((item) => {
              const p = item.product_id;
              return (
                <div key={item._id} className="cart-item-card">
                  {/* Item Image */}
                  <div className="cart-item-media">
                    <img
                      src={p?.image_url}
                      alt={p?.name || 'Product'}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300";
                      }}
                    />
                  </div>

                  {/* Item Info */}
                  <div className="cart-item-details">
                    {p?._id ? (
                      <Link to={`/products/${p._id}`} className="cart-item-name">
                        {p.name}
                      </Link>
                    ) : (
                      <span className="cart-item-name">{p?.name || 'Product'}</span>
                    )}
                    <span className="cart-item-category">{p?.category}</span>
                    <span className="cart-item-unit-price">{money(item.price)} each</span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="cart-item-qty-stepper">
                    <button
                      type="button"
                      onClick={() => updateItem(item._id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <FiMinus />
                    </button>
                    <span className="stepper-val">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItem(item._id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <FiPlus />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="cart-item-right-col">
                    <span className="cart-item-subtotal">
                      {money(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => removeItem(item._id)}
                      title="Remove from bag"
                      aria-label={`Remove ${p?.name} from bag`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-bottom-actions">
            <button type="button" className="cart-clear-link" onClick={clearCart}>
              <FiTrash2 /> Clear entire bag
            </button>
          </div>
        </div>

        {/* Right: Sticky Summary Box */}
        <aside className="cart-summary-column">
          <div className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-breakdown">
              <div className="summary-line">
                <span>Items Subtotal ({items.length})</span>
                <span className="summary-val">{money(cart.total)}</span>
              </div>
              <div className="summary-line">
                <span>Estimated Shipping</span>
                <span className="summary-val">
                  {qualifiesForFreeShipping ? (
                    <span className="free-shipping-tag">FREE</span>
                  ) : (
                    money(shippingCost)
                  )}
                </span>
              </div>
              <div className="summary-line-divider" />
              <div className="summary-total-row">
                <span>Total Due</span>
                <span className="summary-grand-total">
                  {money(cart.total + (qualifiesForFreeShipping ? 0 : shippingCost))}
                </span>
              </div>
            </div>

            <Link to="/checkout" className="btn-primary cart-checkout-cta">
              <span>Proceed to Checkout</span>
              <FiArrowRight />
            </Link>

            <div className="cart-trust-badges">
              <div className="trust-badge-row">
                <FiShield />
                <span>Verified SSL Encrypted Checkout</span>
              </div>
              <div className="trust-badge-row">
                <FiTruck />
                <span>Dispatched within 24 hours</span>
              </div>
            </div>

            <div className="accepted-wallets-note">
              <span>Accepted:</span>
              <strong>JazzCash</strong> · <strong>Easypaisa</strong> · <strong>Cash on Delivery</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
