import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiAward,
  FiCheck, FiZap, FiShoppingBag, FiLayers
} from 'react-icons/fi';
import API from '../utils/axiosInstance';
import ProductCard from '../components/ProductCard';
import './Home.css';
import { money } from '../utils/currency';

const img = (id, w = 900) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}`;

const CATEGORIES = [
  { name: 'Shalwar Kameez', desc: 'Classic cuts and festive wear', photo: '1734418040900-e964f84e8abb' },
  { name: 'Kurtas', desc: 'Everyday and celebratory kurtas', photo: '1727835523545-70ee992b5763' },
  { name: 'Hoodies', desc: 'Heavyweight oversized hoodies', photo: '1564557287817-3785e38ec1f5' },
  { name: 'T-Shirts', desc: 'Boxy drop-shoulder graphics', photo: '1627225793904-a2f900a6e4cf' },
  { name: 'Jeans', desc: 'Wide-leg and baggy denim fits', photo: '1674075872359-a174bc7ed420' },
  { name: 'Women', desc: 'Kurtis, suits and co-ords', photo: '1597983073540-684a10b15ab1' },
];

const HERO_FALLBACK = ['1734418040900-e964f84e8abb', '1564557287817-3785e38ec1f5', '1727835523545-70ee992b5763'];

const MARQUEE = [
  'New Season Drops',
  'Contemporary Fusion',
  'Oversized Streetwear',
  'Contemporary Kurtas',
  'Free Shipping Over Rs 2,500',
  'Handcrafted Quality',
  'Easy 30-Day Returns'
];

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-box ${shown ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    setError(false);
    API.get('/products', { params: { sort: 'newest' } })
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadProducts, []);

  // Curate arrivals: pick varied in-stock items
  const arrivals = useMemo(() => {
    const inStock = products.filter((p) => p.stock > 0);
    const lists = CATEGORIES.map((c) => inStock.filter((p) => p.category === c.name)).filter((l) => l.length > 0);
    const picked = [];
    for (let i = 0; picked.length < 8 && lists.some((l) => l[i]); i++) {
      lists.forEach((l) => {
        if (l[i] && picked.length < 8) picked.push(l[i]);
      });
    }
    return picked.length > 0 ? picked : inStock.slice(0, 8);
  }, [products]);

  // Curate hero collage items
  const heroPicks = useMemo(() => {
    const picks = [];
    for (const cat of ['Shalwar Kameez', 'Hoodies', 'Kurtas']) {
      const p = products.find((x) => x.category === cat && x.stock > 0);
      if (p) picks.push(p);
    }
    for (const p of products) {
      if (picks.length >= 3) break;
      if (p.stock > 0 && !picks.includes(p)) picks.push(p);
    }
    return picks.slice(0, 3);
  }, [products]);

  const counts = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="home-editorial">
      {/* ─── HERO SECTION (MATCHING REFERENCE DESIGN) ─── */}
      <section className="hero-ref-section">
        <div className="hero-ref-media-layer">
          <img
            src="/hero-models.png"
            alt="Gen-Z Threads Contemporary Collection"
            className="hero-ref-backdrop-img"
            loading="eager"
          />
          <div className="hero-ref-backdrop-gradient" aria-hidden="true" />
        </div>

        <div className="container hero-ref-container">
          <div className="hero-ref-content">
            <span className="hero-ref-eyebrow">THE NEW STANDARD</span>
            <h1 className="hero-ref-title">
              Everyday,<br />
              redefined.
            </h1>
            <p className="hero-ref-subtitle">
              Contemporary clothing. Authentic roots.
            </p>
            <div className="hero-ref-actions">
              <Link to="/products" className="hero-ref-cta-btn">
                <span>Explore the collection</span>
                <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EDITORIAL MARQUEE TICKER ─── */}
      <section className="marquee-strip" aria-hidden="true">
        <div className="marquee-scroller">
          {[...MARQUEE, ...MARQUEE].map((text, idx) => (
            <div key={idx} className="marquee-token">
              <span className="token-dot">✦</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CATEGORY CURATION ─── */}
      <section className="section-space container">
        <Reveal>
          <div className="section-header-row">
            <div>
              <span className="eyebrow">Collections</span>
              <h2 className="section-title">Shop by Silhouette</h2>
              <p className="section-subtitle">Purposefully crafted pieces for everyday confidence</p>
            </div>
            <Link to="/products" className="section-view-all">
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </div>
        </Reveal>

        <div className="categories-editorial-grid">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.name} delay={i * 50}>
              <Link to={`/products?category=${encodeURIComponent(cat.name)}`} className="category-editorial-card">
                <div className="category-image-wrap">
                  <img src={img(cat.photo, 600)} alt={cat.name} loading="lazy" />
                  <div className="category-overlay-scrim" />
                </div>
                <div className="category-info-wrap">
                  <div className="category-text-block">
                    <h3 className="category-card-title">{cat.name}</h3>
                    <p className="category-card-desc">{cat.desc}</p>
                  </div>
                  <div className="category-card-footer">
                    <span className="category-count-badge">
                      {counts[cat.name] || 0} styles
                    </span>
                    <span className="category-arrow-circle" aria-hidden="true">
                      <FiArrowRight />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── NEW ARRIVALS GRID ─── */}
      <section className="section-space container">
        <Reveal>
          <div className="section-header-row">
            <div>
              <span className="eyebrow">Fresh In Stock</span>
              <h2 className="section-title">New Arrivals</h2>
              <p className="section-subtitle">Fresh additions across all categories this week</p>
            </div>
            <Link to="/products" className="section-view-all">
              <span>Explore Collection</span>
              <FiArrowRight />
            </Link>
          </div>
        </Reveal>

        <div className="products-grid">
          {loading
            ? [...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)
            : arrivals.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        {!loading && arrivals.length === 0 && (
          <div className="empty-state">
            <p>{error ? 'Unable to load products at this moment.' : 'New pieces are on the way.'}</p>
            {error && (
              <button type="button" className="btn-primary" onClick={loadProducts}>
                Try Again
              </button>
            )}
          </div>
        )}
      </section>


      {/* ─── BRAND VALUES & STANDARDS ─── */}
      <section className="section-space container">
        <Reveal>
          <div className="section-center-head">
            <span className="eyebrow">Why Gen-Z Threads</span>
            <h2 className="section-title">Designed with Purpose</h2>
            <p className="section-subtitle">Every garment is engineered for longevity, comfort, and modern expression.</p>
          </div>
        </Reveal>

        <div className="pillars-grid">
          {[
            { icon: FiLayers, title: 'Premium Fabrics', desc: 'Sourced from local organic cotton mills, pre-shrunk and built to endure daily wear.' },
            { icon: FiAward, title: 'Tailored Fits', desc: 'Expertly patterned cuts ensuring silhouette perfection across all body types.' },
            { icon: FiTruck, title: 'Express Delivery', desc: 'Dispatched in discreet luxury packaging within 24 hours. Ships free on orders over Rs 2,500.' },
            { icon: FiRefreshCw, title: '30-Day Exchanges', desc: 'If the fit or color isn’t just right, swap it seamlessly through your customer portal.' },
          ].map(({ icon: Icon, title, desc }, idx) => (
            <Reveal key={title} delay={idx * 60}>
              <div className="pillar-card">
                <div className="pillar-icon-box"><Icon /></div>
                <h3 className="pillar-title">{title}</h3>
                <p className="pillar-desc">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── NEWSLETTER & COMMUNITY ─── */}
      <section className="container newsletter-banner-wrap">
        <Reveal>
          <div className="newsletter-card">
            <div className="newsletter-inner">
              <span className="eyebrow">Join the Inner Circle</span>
              <h2 className="newsletter-headline">Get First Access to Weekly Drops</h2>
              <p className="newsletter-sub">
                Subscribe to receive private lookbooks, member-only discounts, and exclusive seasonal perks.
              </p>

              {subscribed ? (
                <div className="newsletter-success">
                  <FiCheck className="success-icon" />
                  <span>You're on the list. Keep an eye on your inbox for our next drop!</span>
                </div>
              ) : (
                <form className="newsletter-form" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label="Email address"
                  />
                  <button type="submit" className="btn-primary">
                    <span>Subscribe</span>
                    <FiArrowRight />
                  </button>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
