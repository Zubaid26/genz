import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiYoutube, FiMail } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">

        {/* Brand Column */}
        <div className="footer-brand">
          <h3><span className="footer-logo-icon">⚡</span> Gen-Z Threads</h3>
          <p>Fashion that speaks your language. Curated streetwear, AI-powered try-on, and exclusive drops for the digital generation.</p>
          <div className="footer-socials">
            <a href="#" aria-label="Instagram"><FiInstagram /></a>
            <a href="#" aria-label="Twitter"><FiTwitter /></a>
            <a href="#" aria-label="YouTube"><FiYoutube /></a>
            <a href="#" aria-label="Email"><FiMail /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/products">All Products</Link>
          <Link to="/products?category=Shirts">Shirts</Link>
          <Link to="/products?category=Pants">Pants</Link>
          <Link to="/products?category=Jackets">Jackets</Link>
          <Link to="/products?category=Shoes">Shoes</Link>
        </div>

        {/* Account */}
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>

        {/* Info */}
        <div className="footer-col">
          <h4>Info</h4>
          <a href="#">About Us</a>
          <a href="#">Contact</a>
          <a href="#">Shipping Policy</a>
          <a href="#">Returns & Refunds</a>
          <a href="#">Privacy Policy</a>
        </div>

      </div>

      <div className="footer-bottom container">
        <p>© {new Date().getFullYear()} Gen-Z Threads. All rights reserved.</p>
        <p className="footer-credit">Designed with ❤️ for the digital generation</p>
      </div>
    </footer>
  );
}
