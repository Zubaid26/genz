import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiArrowLeft } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import toast from 'react-hot-toast';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    API.get(`/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login first'); return; }
    try {
      await addToCart(product._id, qty, product.price);
      toast.success('Added to cart!');
    } catch { toast.error('Failed to add to cart'); }
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login first'); return; }
    try {
      await API.post(`/auth/wishlist/${product._id}`);
      toast.success('Added to wishlist!');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <div className="detail-page"><div className="detail-skeleton" /></div>;
  if (!product) return <div className="detail-page"><p>Product not found</p></div>;

  return (
    <div className="detail-page">
      <Link to="/products" className="back-link"><FiArrowLeft /> Back to Shop</Link>
      <div className="detail-grid">
        <div className="detail-image">
          <img src={product.image_url} alt={product.name} />
        </div>
        <div className="detail-info">
          <span className="detail-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">${product.price?.toFixed(2)}</p>
          <p className="detail-desc">{product.description || 'No description available.'}</p>
          <div className="detail-stock">
            {product.stock > 0
              ? <span className="in-stock">✓ In Stock ({product.stock} available)</span>
              : <span className="out-stock">✗ Out of Stock</span>
            }
          </div>
          {product.stock > 0 && (
            <div className="detail-qty">
              <label>Quantity:</label>
              <div className="qty-selector">
                <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
              </div>
            </div>
          )}
          <div className="detail-actions">
            <button onClick={handleAddToCart} className="add-cart-btn" disabled={product.stock === 0}>
              <FiShoppingCart /> Add to Cart
            </button>
            <button onClick={handleWishlist} className="wishlist-btn"><FiHeart /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
