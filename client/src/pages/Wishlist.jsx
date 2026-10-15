import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import useCart from '../hooks/useCart';
import toast from 'react-hot-toast';
import './Wishlist.css';
import { money } from '../utils/currency';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    API.get('/auth/wishlist')
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const removeItem = async (id) => {
    try {
      await API.delete(`/auth/wishlist/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Could not remove item');
    }
  };

  const moveToCart = async (product) => {
    setMovingId(product._id);
    try {
      await addToCart(product._id, 1, product.price);
      await API.delete(`/auth/wishlist/${product._id}`);
      setItems((prev) => prev.filter((i) => i._id !== product._id));
      toast.success('Moved to your shopping bag!');
    } catch {
      toast.error('Failed to move to bag');
    } finally {
      setMovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="wishlist-editorial-page container">
        <div className="wishlist-loading-state">
          <p>Loading your saved pieces…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-editorial-page container">
      <div className="wishlist-header-row">
        <div>
          <span className="eyebrow">Saved Items</span>
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-subtitle">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'} saved for later
          </p>
        </div>
        <Link to="/products" className="wishlist-shop-btn">
          <span>Explore More</span>
          <FiArrowRight />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="wishlist-empty-box">
          <div className="empty-heart-icon">
            <FiHeart />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>Save pieces you love while browsing to keep track of styles, sizes, and price drops.</p>
          <Link to="/products" className="btn-primary">
            <span>Discover Pieces</span>
            <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="wishlist-products-grid">
          {items.map((product) => (
            <div key={product._id} className="wishlist-item-card">
              <div className="wl-media-frame">
                <Link to={`/products/${product._id}`}>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600";
                    }}
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => removeItem(product._id)}
                  className="wl-delete-circle"
                  title="Remove from wishlist"
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <FiTrash2 />
                </button>
              </div>

              <div className="wl-info-block">
                <span className="wl-category-tag">{product.category}</span>
                <Link to={`/products/${product._id}`} className="wl-name-link">
                  {product.name}
                </Link>
                <span className="wl-price-val">{money(product.price)}</span>

                <button
                  type="button"
                  onClick={() => moveToCart(product)}
                  className="btn-primary wl-move-cart-btn"
                  disabled={movingId === product._id || product.stock <= 0}
                >
                  <FiShoppingBag />
                  <span>{movingId === product._id ? 'Moving…' : product.stock <= 0 ? 'Out of Stock' : 'Move to Bag'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
