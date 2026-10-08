import { FiX, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useCart from '../hooks/useCart';
import './CartDrawer.css';

export default function CartDrawer({ open, onClose }) {
  const { cart, updateItem, removeItem } = useCart();

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Your Cart</h3>
          <button onClick={onClose}><FiX /></button>
        </div>
        <div className="drawer-items">
          {(!cart.items || cart.items.length === 0) ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            cart.items.map((item) => (
              <div key={item._id} className="drawer-item">
                <img src={item.product_id?.image_url || ''} alt={item.product_id?.name} />
                <div className="item-details">
                  <h4>{item.product_id?.name}</h4>
                  <p className="item-price">${item.price?.toFixed(2)}</p>
                  <div className="qty-controls">
                    <button onClick={() => updateItem(item._id, Math.max(1, item.quantity - 1))}><FiMinus /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateItem(item._id, item.quantity + 1)}><FiPlus /></button>
                  </div>
                </div>
                <button className="remove-btn" onClick={() => removeItem(item._id)}><FiTrash2 /></button>
              </div>
            ))
          )}
        </div>
        {cart.items?.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-total">
              <span>Total</span>
              <span className="total-price">${cart.total?.toFixed(2)}</span>
            </div>
            <Link to="/checkout" className="checkout-btn" onClick={onClose}>
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
