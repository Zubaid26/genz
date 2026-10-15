import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiShoppingCart, FiHeart, FiArrowLeft, FiTruck,
  FiShield, FiRefreshCw, FiCheck, FiMinus, FiPlus
} from 'react-icons/fi';
import API from '../utils/axiosInstance';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import ReviewSection from '../components/ReviewSection';
import './ProductDetail.css';
import { money } from '../utils/currency';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [rating, setRating] = useState({ average: 0, count: 0 });

  useEffect(() => {
    setLoading(true);
    API.get(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setRating({
          average: res.data.avg_rating || 0,
          count: res.data.review_count || 0
        });
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add to cart');
      return;
    }
    if (product.stock <= 0) {
      toast.error('This item is currently out of stock');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product._id, qty, product.price);
      toast.success('Added to your shopping bag!');
    } catch {
      toast.error('Failed to add to bag');
    } finally {
      setTimeout(() => setAdding(false), 500);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error('Please sign in to save items');
      return;
    }
    try {
      await API.post(`/auth/wishlist/${product._id}`);
      setWishlisted(true);
      toast.success('Saved to wishlist!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already in your wishlist');
    }
  };

  if (loading) {
    return (
      <div className="detail-editorial container">
        <div className="detail-skeleton-grid">
          <div className="detail-skeleton-image" />
          <div className="detail-skeleton-copy">
            <div className="skeleton-line w-30" />
            <div className="skeleton-line w-80 h-lg" />
            <div className="skeleton-line w-40" />
            <div className="skeleton-line w-full h-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="detail-editorial container">
        <div className="empty-state">
          <p>Product could not be found.</p>
          <Link to="/products" className="btn-primary">Back to Catalog</Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="detail-editorial container">
      {/* Breadcrumb Navigation */}
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/products" className="breadcrumb-back-link">
          <FiArrowLeft />
          <span>Back to Collection</span>
        </Link>
        <span className="breadcrumb-slash">/</span>
        <span className="breadcrumb-current">{product.category}</span>
        <span className="breadcrumb-slash">/</span>
        <span className="breadcrumb-product-name">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="detail-showcase-grid">
        {/* Left Column: Media Gallery */}
        <div className="detail-media-wrap">
          <div className="detail-main-image-frame">
            <img
              src={product.image_url}
              alt={product.name}
              className="detail-large-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800";
              }}
            />

          </div>
        </div>

        {/* Right Column: Product Purchasing Details */}
        <div className="detail-content-wrap">
          <div className="detail-header-meta">
            <span className="detail-category-badge">{product.category}</span>
            <a href="#reviews" className="detail-rating-pill">
              <StarRating value={rating.average} size="sm" />
              <span className="rating-num">
                {rating.count > 0 ? `${rating.average.toFixed(1)} (${rating.count})` : 'Be the first to review'}
              </span>
            </a>
          </div>

          <h1 className="detail-title">{product.name}</h1>

          <div className="detail-price-box">
            <span className="detail-price-val">{money(product.price)}</span>
            <span className="detail-tax-notice">Taxes included. Free shipping over Rs 2,500</span>
          </div>

          <div className="detail-desc-box">
            <p>{product.description || 'Elevate your wardrobe with this authentic contemporary essential. Tailored for comfort, drape, and long-lasting quality.'}</p>
          </div>

          {/* Stock Status Indicator */}
          <div className="detail-stock-row">
            {isOutOfStock ? (
              <span className="stock-status-pill out">
                <span className="dot" /> Out of Stock
              </span>
            ) : product.stock <= 5 ? (
              <span className="stock-status-pill low">
                <span className="dot" /> Only {product.stock} pieces remaining
              </span>
            ) : (
              <span className="stock-status-pill in">
                <span className="dot" /> In Stock ({product.stock} available)
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="detail-quantity-section">
              <label htmlFor="qty-select" className="qty-label">Quantity</label>
              <div className="qty-counter-box" id="qty-select">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                >
                  <FiMinus />
                </button>
                <span className="qty-display">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  disabled={qty >= product.stock}
                  aria-label="Increase quantity"
                >
                  <FiPlus />
                </button>
              </div>
            </div>
          )}

          {/* Action CTAs: Add to Cart, Wishlist */}
          <div className="detail-cta-row">
            <button
              type="button"
              onClick={handleAddToCart}
              className="btn-primary detail-add-btn"
              disabled={isOutOfStock || adding}
            >
              {adding ? (
                <><FiCheck /> Adding to Bag…</>
              ) : isOutOfStock ? (
                'Sold Out'
              ) : (
                <><FiShoppingCart /> Add to Shopping Bag</>
              )}
            </button>

            <button
              type="button"
              onClick={handleWishlist}
              className={`detail-wish-btn ${wishlisted ? 'active' : ''}`}
              title={wishlisted ? 'In Wishlist' : 'Save to Wishlist'}
              aria-label="Save to wishlist"
            >
              <FiHeart className={wishlisted ? 'filled' : ''} />
            </button>
          </div>



          {/* Trust Guarantees */}
          <div className="detail-perks-list">
            <div className="detail-perk">
              <FiTruck className="perk-icon" />
              <span>Free express shipping on orders over Rs 2,500</span>
            </div>
            <div className="detail-perk">
              <FiRefreshCw className="perk-icon" />
              <span>30-Day hassle-free returns & exchange</span>
            </div>
            <div className="detail-perk">
              <FiShield className="perk-icon" />
              <span>Cash on Delivery & Secure Online Wallets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <ReviewSection
        productId={product._id}
        onSummaryChange={(s) => s && setRating({ average: s.average, count: s.count })}
      />
    </div>
  );
}
