import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiCamera, FiCheck } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import toast from 'react-hot-toast';
import API from '../utils/axiosInstance';
import './ProductCard.css';
import { money } from '../utils/currency';
import StarRating from './StarRating';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add to cart');
      navigate('/login');
      return;
    }
    if (product.stock <= 0) {
      toast.error('This piece is currently out of stock');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product._id, 1, product.price);
      toast.success('Added to bag');
    } catch {
      toast.error('Failed to add to bag');
    } finally {
      setTimeout(() => setAdding(false), 600);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save items');
      navigate('/login');
      return;
    }
    try {
      await API.post(`/auth/wishlist/${product._id}`);
      setWishlisted(true);
      toast.success('Saved to wishlist');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already in wishlist');
    }
  };

  const goToDetail = () => {
    navigate(`/products/${product._id}`);
  };

  const isOutOfStock = product.stock === 0;

  return (
    <article
      onClick={goToDetail}
      className={`product-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter') goToDetail(); }}
      aria-label={`${product.name}, price: ${money(product.price)}`}
    >
      <div className="card-media">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="card-product-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600";
          }}
        />

        {/* Stock / Overlay Badges */}
        <div className="card-top-badges">
          {product.stock > 0 && product.stock <= 5 && (
            <span className="product-badge badge-warning">Only {product.stock} left</span>
          )}
          {isOutOfStock && (
            <span className="product-badge badge-danger">Sold Out</span>
          )}
          {product.overlay_image_url && (
            <span className="product-badge badge-tryon" title="Virtual Try-On Compatible">
              <FiCamera /> Try-On
            </span>
          )}
        </div>

        {/* Wishlist Action Button */}
        <button
          type="button"
          onClick={handleWishlist}
          className={`card-wishlist-btn ${wishlisted ? 'active' : ''}`}
          title={wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
          aria-label="Save to wishlist"
        >
          <FiHeart className={wishlisted ? 'filled' : ''} />
        </button>

        {/* Quick Add Overlay on Desktop Hover */}
        <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="card-quick-add-btn"
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
          >
            {adding ? (
              <><FiCheck /> Added</>
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              <><FiShoppingBag /> Quick Add</>
            )}
          </button>
        </div>
      </div>

      <div className="card-meta">
        <div className="card-category-row">
          <span className="card-category-label">{product.category}</span>
          {product.review_count > 0 && (
            <div className="card-rating-inline">
              <StarRating value={product.avg_rating} size="sm" />
              <span className="rating-count">({product.review_count})</span>
            </div>
          )}
        </div>

        <h3 className="card-title" title={product.name}>
          {product.name}
        </h3>

        <div className="card-bottom-row">
          <span className="card-price-value">{money(product.price)}</span>

          {/* Direct touch-friendly button for mobile viewports */}
          <button
            type="button"
            className="card-mobile-cart-btn"
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            aria-label="Add to cart"
          >
            {adding ? <FiCheck /> : <FiShoppingBag />}
          </button>
        </div>
      </div>
    </article>
  );
}
