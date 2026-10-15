import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiLogOut,
  FiHeart, FiPackage, FiGrid, FiSun, FiMoon, FiCamera, FiArrowRight
} from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import useTheme from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close drawers/menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  const handleScrollToAbout = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.querySelector('.pillars-grid') || document.querySelector('.site-footer');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`navbar-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nav-floating-pill">
        {/* Brand Logo matching reference */}
        <Link to="/" className="nav-logo" aria-label="Gen-Z Threads Home">
          <div className="nav-logo-text-group">
            <span className="nav-brand-title">GEN-Z</span>
            <span className="nav-brand-sub">THREADS</span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className="nav-pill-links" aria-label="Main Navigation">
          <Link
            to="/products"
            className={`nav-pill-link ${location.pathname === '/products' && !location.search ? 'active' : ''}`}
          >
            Shop
          </Link>
          <Link
            to="/tryon"
            className={`nav-pill-link tryon-nav-pill ${location.pathname.startsWith('/tryon') ? 'active' : ''}`}
          >
            <FiCamera className="tryon-camera-icon" /> Try On AI
          </Link>
          <Link
            to="/products"
            className="nav-pill-link"
          >
            Collections
          </Link>
          <a
            href="#about"
            className="nav-pill-link"
            onClick={handleScrollToAbout}
          >
            About
          </a>
        </nav>

        {/* Vertical Divider matching reference */}
        <div className="nav-pill-divider" aria-hidden="true" />

        {/* Right Action Controls */}
        <div className="nav-pill-actions">
          {/* Only Search Icon visible, opens search tab on click */}
          <div className="nav-search-wrap" ref={searchRef}>
            <button
              type="button"
              className={`nav-pill-icon-btn ${searchOpen ? 'active' : ''}`}
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search catalog"
              aria-label="Open search tab"
              aria-expanded={searchOpen}
            >
              <FiSearch />
            </button>

            {searchOpen && (
              <form className="nav-search-popover fade-in" onSubmit={handleSearch} role="search">
                <FiSearch className="popover-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  autoFocus
                  placeholder="Search kurtas, hoodies, fits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="popover-search-input"
                  aria-label="Search catalog"
                />
                <button
                  type="button"
                  className="popover-close-btn"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                >
                  <FiX />
                </button>
              </form>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="nav-pill-icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle visual theme"
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>

          {/* Cart Icon */}
          <Link
            to="/cart"
            className="nav-pill-icon-btn cart-nav-btn"
            title="Shopping Cart"
            aria-label={`Shopping Cart with ${cartCount || 0} items`}
          >
            <FiShoppingCart />
            {cartCount > 0 && (
              <span className="nav-pill-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>

          {/* Sign In Button / User Account Trigger */}
          {user ? (
            <div className="user-dropdown-wrap" ref={dropdownRef}>
              <button
                type="button"
                className={`user-trigger-btn ${dropOpen ? 'open' : ''}`}
                onClick={() => setDropOpen(!dropOpen)}
                aria-expanded={dropOpen}
                aria-label="Open user menu"
              >
                <div className="user-avatar-circle">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="user-name-label">{user.full_name?.split(' ')[0]}</span>
              </button>

              {dropOpen && (
                <div className="user-dropdown-menu fade-in" role="menu">
                  <div className="dropdown-user-header">
                    <p className="user-header-name">{user.full_name}</p>
                    <p className="user-header-email">{user.email}</p>
                    {user.role === 'admin' && <span className="user-admin-badge">Admin</span>}
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setDropOpen(false)} role="menuitem">
                    <FiGrid /> <span>Dashboard</span>
                  </Link>
                  <Link to="/orders" className="dropdown-item" onClick={() => setDropOpen(false)} role="menuitem">
                    <FiPackage /> <span>My Orders</span>
                  </Link>
                  <Link to="/wishlist" className="dropdown-item" onClick={() => setDropOpen(false)} role="menuitem">
                    <FiHeart /> <span>Wishlist</span>
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setDropOpen(false)} role="menuitem">
                    <FiUser /> <span>Profile Settings</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item admin-item" onClick={() => setDropOpen(false)} role="menuitem">
                      <FiGrid /> <span>Admin Control Center</span>
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item logout-btn"
                    onClick={() => { logout(); setDropOpen(false); navigate('/'); }}
                    role="menuitem"
                  >
                    <FiLogOut /> <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-pill-signin-btn">
              Sign In
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {menuOpen && (
        <div className="mobile-drawer-overlay fade-in" onClick={() => setMenuOpen(false)}>
          <div className="mobile-drawer-body" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="mobile-drawer-title">Navigation</span>
              <button
                type="button"
                className="mobile-close-btn"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <FiX />
              </button>
            </div>

            {/* Mobile Search */}
            <form className="mobile-search-form" onSubmit={handleSearch}>
              <FiSearch className="nav-search-icon" />
              <input
                type="search"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" aria-label="Submit search"><FiArrowRight /></button>
            </form>

            <div className="mobile-nav-links">
              <Link to="/products" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Shop Catalog
              </Link>
              <Link to="/tryon" className="mobile-nav-link highlight" onClick={() => setMenuOpen(false)}>
                <FiCamera /> Try On AI
              </Link>
              <Link to="/products" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Collections
              </Link>
              <a href="#about" className="mobile-nav-link" onClick={(e) => { handleScrollToAbout(e); setMenuOpen(false); }}>
                About
              </a>
              <Link to="/cart" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                <FiShoppingCart /> Cart ({cartCount})
              </Link>
              {user ? (
                <>
                  <div className="mobile-drawer-divider" />
                  <div className="mobile-user-card">
                    <div className="user-avatar-circle">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="mobile-user-name">{user.full_name}</p>
                      <p className="mobile-user-email">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                    <FiGrid /> Dashboard
                  </Link>
                  <Link to="/orders" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                    <FiPackage /> Orders
                  </Link>
                  <Link to="/wishlist" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                    <FiHeart /> Wishlist
                  </Link>
                  <Link to="/profile" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                    <FiUser /> Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="mobile-nav-link admin" onClick={() => setMenuOpen(false)}>
                      <FiGrid /> Admin Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    className="mobile-logout-btn"
                    onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
                  >
                    <FiLogOut /> Sign Out
                  </button>
                </>
              ) : (
                <div className="mobile-auth-actions">
                  <Link to="/login" className="btn-primary" style={{ width: '100%' }} onClick={() => setMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-secondary" style={{ width: '100%' }} onClick={() => setMenuOpen(false)}>
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
