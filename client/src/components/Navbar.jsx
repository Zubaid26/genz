import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiHeart, FiPackage, FiGrid, FiSun, FiMoon, FiCamera } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import useTheme from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">⚡</span>
          <span>Gen-Z Threads</span>
        </Link>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <Link to="/products" onClick={() => setMenuOpen(false)}>Shop</Link>
          <Link to="/tryon" className="tryon-nav-btn" onClick={() => setMenuOpen(false)}>
            <FiCamera /> Try On
          </Link>

          {user && (
            <Link to="/cart" className="cart-link" onClick={() => setMenuOpen(false)}>
              <FiShoppingCart />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          )}

          {user ? (
            <div className="user-dropdown" ref={dropdownRef}>
              <button className="user-btn" onClick={() => setDropOpen(!dropOpen)}>
                <FiUser /> <span>{user.full_name?.split(' ')[0]}</span>
              </button>
              {dropOpen && (
                <div className="dropdown-menu">
                  <Link to="/dashboard" onClick={() => setDropOpen(false)}><FiGrid /> Dashboard</Link>
                  <Link to="/profile" onClick={() => setDropOpen(false)}><FiUser /> Profile</Link>
                  <Link to="/orders" onClick={() => setDropOpen(false)}><FiPackage /> Orders</Link>
                  <Link to="/wishlist" onClick={() => setDropOpen(false)}><FiHeart /> Wishlist</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setDropOpen(false)}><FiGrid /> Admin Panel</Link>
                  )}
                  <button onClick={() => { logout(); setDropOpen(false); navigate('/'); }}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="user-btn" onClick={() => setMenuOpen(false)}>Login</Link>
          )}
        </div>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </nav>
  );
}
