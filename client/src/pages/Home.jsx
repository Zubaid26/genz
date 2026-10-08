import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiStar, FiCamera } from 'react-icons/fi';
import './Home.css';

export default function Home() {
  const categories = [
    { name: 'Shirts', icon: '👕', desc: 'Graphic tees & basics' },
    { name: 'Pants', icon: '👖', desc: 'Cargo & streetwear' },
    { name: 'Dresses', icon: '👗', desc: 'Statement pieces' },
    { name: 'Jackets', icon: '🧥', desc: 'Layering essentials' },
    { name: 'Shoes', icon: '👟', desc: 'Sneakers & boots' },
    { name: 'Accessories', icon: '🎒', desc: 'Bags, hats & more' },
  ];

  return (
    <div className="home-page">

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-bg-img">
          <img src="/hero.png" alt="Gen-Z Fashion" />
        </div>
        <div className="hero-overlay" />

        <div className="hero-inner">
          <span className="hero-badge">✦ NEW COLLECTION 2024</span>
          <h1>
            Fashion That<br />
            <span className="gradient-text">Speaks Gen-Z</span>
          </h1>
          <p className="hero-desc">
            Discover trendy streetwear, oversized fits, and bold accessories. 
            Try them on virtually before you buy — powered by AI.
          </p>
          <div className="hero-btns">
            <Link to="/products" className="btn-hero-primary">
              Explore Collection <FiArrowRight />
            </Link>
            <Link to="/register" className="btn-hero-outline">
              Join Free
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="trust-bar">
        <div className="container trust-row">
          <div className="trust-item"><FiTruck /> <span>Free Shipping Over $50</span></div>
          <div className="trust-item"><FiShield /> <span>Secure Payments</span></div>
          <div className="trust-item"><FiRefreshCw /> <span>30-Day Returns</span></div>
          <div className="trust-item"><FiStar /> <span>4.9★ Rating</span></div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="section-cats container">
        <div className="section-head">
          <div>
            <h2>Shop by Category</h2>
            <p className="section-sub">Find your style from our curated collections</p>
          </div>
          <Link to="/products" className="see-all-link">View All <FiArrowRight /></Link>
        </div>
        <div className="cat-grid">
          {categories.map(cat => (
            <Link key={cat.name} to={`/products?category=${cat.name}`} className="cat-card">
              <span className="cat-emoji">{cat.icon}</span>
              <h3>{cat.name}</h3>
              <p>{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="why-section">
        <div className="container">
          <div className="section-head center">
            <div>
              <h2>Why Gen-Z Threads?</h2>
              <p className="section-sub">Here's what makes us different</p>
            </div>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon"><FiCamera /></div>
              <h3>Virtual Try-On</h3>
              <p>See how any outfit looks on you with our AI-powered camera technology before making a purchase.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><FiTruck /></div>
              <h3>Fast Delivery</h3>
              <p>Free express shipping on all orders over $50. Get your style delivered in 2-4 business days.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><FiShield /></div>
              <h3>Quality Guarantee</h3>
              <p>Every piece is quality-checked. Not happy? Return within 30 days for a full refund, no questions asked.</p>
            </div>
            <div className="why-card">
              <div className="why-icon"><FiStar /></div>
              <h3>Exclusive Drops</h3>
              <p>Get access to limited-edition collections and early drops available only to our community members.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROMO BANNER ─── */}
      <section className="promo-banner container">
        <div className="promo-box">
          <div className="promo-left">
            <span className="promo-label">LIMITED TIME OFFER</span>
            <h2>Get 20% Off Your First Order</h2>
            <p>Sign up today and we'll send you an exclusive discount code straight to your inbox.</p>
            <Link to="/register" className="btn-hero-primary">
              Create Account <FiArrowRight />
            </Link>
          </div>
          <div className="promo-right">
            <div className="promo-circle-bg" />
            <span className="promo-percent">20%</span>
          </div>
        </div>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="newsletter-section container">
        <h2>Stay in the Loop</h2>
        <p>Subscribe to get early access to new drops and exclusive offers.</p>
        <form className="nl-form" onSubmit={e => e.preventDefault()}>
          <input type="email" placeholder="Enter your email" required />
          <button type="submit">Subscribe</button>
        </form>
      </section>
    </div>
  );
}
