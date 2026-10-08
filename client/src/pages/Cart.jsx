import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiArrowRight } from 'react-icons/fi';
import useCart from '../hooks/useCart';
import './Cart.css';

export default function Cart() {
  const { cart, updateItem, removeItem, clearCart } = useCart();
  const items = cart.items || [];

  return (
    <div className="cart-page container">
      <h1>Shopping Cart</h1>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => (
              <div key={item._id} className="cart-item">
                <img src={item.product_id?.image_url} alt={item.product_id?.name} />
                <div className="item-info">
                  <h3>{item.product_id?.name}</h3>
                  <p className="item-price">${item.price?.toFixed(2)}</p>
                </div>
                <div className="item-qty">
                  <button onClick={() => updateItem(item._id, Math.max(1, item.quantity - 1))}><FiMinus /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateItem(item._id, item.quantity + 1)}><FiPlus /></button>
                </div>
                <p className="item-subtotal">${(item.price * item.quantity).toFixed(2)}</p>
                <button className="remove-btn" onClick={() => removeItem(item._id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <button className="clear-btn" onClick={clearCart}>Clear Cart</button>
            <div className="summary-row">
              <span>Total</span>
              <span className="total">${cart.total?.toFixed(2)}</span>
            </div>
            <Link to="/checkout" className="checkout-btn"><span>Proceed to Checkout</span> <FiArrowRight /></Link>
          </div>
        </>
      )}
    </div>
  );
}
