import { Link } from 'react-router-dom';
import {
  FiInstagram, FiTwitter, FiYoutube, FiMail,
  FiTruck, FiShield, FiRefreshCw, FiAward, FiArrowUpRight
} from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      {/* Trust & Assurance Bar */}
      <div className="footer-perks-bar">
        <div className="container footer-perks-grid">
          <div className="perk-item">
            <div className="perk-icon-wrap"><FiTruck /></div>
            <div>
              <p className="perk-title">Free Express Shipping</p>
              <p className="perk-sub">On all orders over Rs 2,500 nationwide</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-wrap"><FiAward /></div>
            <div>
              <p className="perk-title">100% Authentic Quality</p>
              <p className="perk-sub">Crafted from premium sustainable fabrics</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-wrap"><FiRefreshCw /></div>
            <div>
              <p className="perk-title">30-Day Easy Returns</p>
              <p className="perk-sub">Hassle-free size & style exchanges</p>
            </div>
          </div>
          <div className="perk-item">
            <div className="perk-icon-wrap"><FiShield /></div>
            <div>
              <p className="perk-title">Secure Checkouts</p>
              <p className="perk-sub">COD, Cards, JazzCash & Easypaisa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container footer-main-grid">
        {/* Brand Information */}
        <div className="footer-brand-col">
          <div className="footer-brand-identity">
            <div className="footer-logo-mark">
              <img src="/logo.png" alt="Gen-Z Threads" className="footer-logo-img" />
            </div>
            <span className="footer-brand-name">GEN-Z THREADS</span>
          </div>
          <p className="footer-tagline">
            Contemporary streetwear and modern ethnic fusion crafted for the digital generation.
            Explore authentic cuts, oversized silhouettes, and tailored perfection.
          </p>
          <div className="footer-social-row">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Follow us on Instagram">
              <FiInstagram />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Follow us on Twitter">
              <FiTwitter />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="Subscribe on YouTube">
              <FiYoutube />
            </a>
            <a href="mailto:hello@genzthreads.pk" aria-label="Email support">
              <FiMail />
            </a>
          </div>
        </div>

        {/* Collections */}
        <div className="footer-links-col">
          <h4 className="footer-heading">Collections</h4>
          <ul className="footer-nav-list">
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products?category=Shalwar Kameez">Shalwar Kameez</Link></li>
            <li><Link to="/products?category=Kurtas">Kurtas & Sets</Link></li>
            <li><Link to="/products?category=Hoodies">Oversized Hoodies</Link></li>
            <li><Link to="/products?category=T-Shirts">Graphic Tees</Link></li>
            <li><Link to="/products?category=Jeans">Wide-Leg Denim</Link></li>
          </ul>
        </div>

        {/* Quick Navigation */}
        <div className="footer-links-col">
          <h4 className="footer-heading">My Account</h4>
          <ul className="footer-nav-list">
            <li><Link to="/dashboard">Customer Portal</Link></li>
            <li><Link to="/orders">Order History & Tracking</Link></li>
            <li><Link to="/wishlist">Saved Wishlist</Link></li>
            <li><Link to="/login">Sign In / Register</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="footer-links-col">
          <h4 className="footer-heading">Customer Care</h4>
          <ul className="footer-nav-list">
            <li><Link to="/products">Delivery Information</Link></li>
            <li><Link to="/products">Return & Exchange Policy</Link></li>
            <li><Link to="/profile">Account Settings</Link></li>
            <li><a href="mailto:support@genzthreads.pk">Support & Helpdesk <FiArrowUpRight /></a></li>
            <li><span className="footer-support-hours">Mon – Sat: 9:00 AM – 8:00 PM PKT</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="footer-bottom-wrap">
        <div className="container footer-bottom-content">
          <p className="copyright-text">
            © {new Date().getFullYear()} Gen-Z Threads. All rights reserved.
          </p>
          <div className="footer-payment-badges">
            <span className="pay-badge">JazzCash</span>
            <span className="pay-badge">Easypaisa</span>
            <span className="pay-badge">COD</span>
            <span className="pay-badge">Stripe</span>
          </div>
          <p className="design-credit">
            Engineered for modern South-Asian youth culture.
          </p>
        </div>
      </div>
    </footer>
  );
}
