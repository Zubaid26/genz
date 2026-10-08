import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import useCart from '../hooks/useCart';
import toast from 'react-hot-toast';
import './Wishlist.css';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    API.get('/auth/wishlist').then(res => setItems(res.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const removeItem = async (id) => {
    try {
      await API.delete(`/auth/wishlist/${id}`);
      setItems(items.filter(i => i._id !== id));
      toast.success('Removed from wishlist');
    } catch { toast.error('Error removing'); }
  };

  const moveToCart = async (product) => {
    try {
      await addToCart(product._id, 1, product.price);
      await API.delete(`/auth/wishlist/${product._id}`);
      setItems(items.filter(i => i._id !== product._id));
      toast.success('Moved to cart!');
    } catch { toast.error('Error'); }
  };

  if (loading) return <div className="wishlist-page"><p style={{color:'#fff'}}>Loading...</p></div>;

  return (
    <div className="wishlist-page container">
      <h1><FiHeart /> My Wishlist</h1>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your wishlist is empty</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map(product => (
            <div key={product._id} className="wishlist-card">
              <Link to={`/products/${product._id}`}>
                <img src={product.image_url} alt={product.name} />
              </Link>
              <div className="wl-info">
                <h3>{product.name}</h3>
                <p className="wl-price">${product.price?.toFixed(2)}</p>
                <div className="wl-actions">
                  <button onClick={() => moveToCart(product)} className="move-btn">
                    <FiShoppingCart /> Add to Cart
                  </button>
                  <button onClick={() => removeItem(product._id)} className="wl-remove">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
