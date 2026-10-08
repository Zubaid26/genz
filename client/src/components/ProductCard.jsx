import { useNavigate } from 'react-router-dom';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import toast from 'react-hot-toast';
import API from '../utils/axiosInstance';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login first'); return; }
    try {
      await addToCart(product._id, 1, product.price);
      toast.success('Added to cart!');
    } catch { toast.error('Failed to add'); }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error('Please login first'); return; }
    try {
      await API.post(`/auth/wishlist/${product._id}`);
      toast.success('Added to wishlist!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Already in wishlist');
    }
  };

  const goToDetail = () => {
    navigate(`/products/${product._id}`);
  };

  return (
    <div onClick={goToDetail} className="product-card" style={{ cursor: 'pointer' }}>
      <div className="card-image">
        <img 
          src={product.image_url} 
          alt={product.name} 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = "https://via.placeholder.com/600x800/111/fff?text=Image+Not+Found";
          }}
        />
        <div className="card-overlay" onClick={e => e.stopPropagation()}>
          <button onClick={handleWishlist} title="Wishlist"><FiHeart /></button>
          <button onClick={handleAddToCart} title="Add to Cart"><FiShoppingCart /></button>
        </div>
        {product.stock < 10 && product.stock > 0 && (
          <span className="stock-badge low">Only {product.stock} left</span>
        )}
        {product.stock === 0 && <span className="stock-badge out">Out of Stock</span>}
      </div>
      <div className="card-info">
        <span className="card-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="card-price">${product.price?.toFixed(2)}</p>
      </div>
    </div>
  );
}
