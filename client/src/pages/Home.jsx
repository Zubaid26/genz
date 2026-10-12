import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiStar, FiCamera,
  FiCheck, FiZap, FiPackage
} from 'react-icons/fi';
import API from '../utils/axiosInstance';
import ProductCard from '../components/ProductCard';
import './Home.css';

const img = (id, w = 800) => `https://images.unsplash.com/photo-${id}?q=80&w=${w}`;

const CATEGORIES = [
  { name: 'Shirts', desc: 'Tees, flannels & basics', photo: '1607345366928-199ea26cfe3e' },
  { name: 'Pants', desc: 'Denim, chinos & joggers', photo: '1473966968600-fa801b869a1a' },
  { name: 'Dresses', desc: 'Statement pieces', photo: '1539008835657-9e8e9680c956' },
  { name: 'Jackets', desc: 'Layering essentials', photo: '1520975954732-35dd22299614' },
  { name: 'Shoes', desc: 'Sneakers & runners', photo: '1595950653106-6c9ebd614d3a' },
  { name: 'Accessories', desc: 'Bags, shades & more', photo: '1591561954557-26941169b49e' },
];

const MARQUEE = ['New Drops Weekly', 'Virtual Try-On', 'Streetwear Essentials', 'Free Shipping Over $50', 'Easy 30-Day Returns', 'Made For Gen-Z'];

const STEPS = [
  { title: 'Pick a piece', text: 'Browse the shop and open any item that has a try-on overlay.' },
  { title: 'Turn on your camera', text: 'Allow camera access. Nothing is uploaded or stored.' },
  { title: 'See it on you', text: 'Move around, compare styles, then add your favourite to the cart.' },
];

// Fade/slide a section in the first time it scrolls into view.
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setShown(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    API.get('/products', { params: { sort: 'newest' } })
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Newest in-stock items, spread across categories so the grid isn't all one type
  const arrivals = useMemo(() => {
    const inStock = products.filter(p => p.stock > 0);
    const lists = CATEGORIES
      .map(c => inStock.filter(p => p.category === c.name))
      .filter(l => l.length > 0);
    const picked = [];
    for (let i = 0; picked.length < 8 && lists.some(l => l[i]); i++) {
      lists.forEach(l => { if (l[i] && picked.length < 8) picked.push(l[i]); });
    }
    return picked.length > 0 ? picked : inStock.slice(0, 8);
  }, [products]);

  // One in-stock product from a few different categories for the hero collage
  const heroPicks = useMemo(() => {
    const picks = [];
    for (const cat of ['Dresses', 'Jackets', 'Shoes']) {
      const p = products.find(x => x.category === cat && x.stock > 0);
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
    products.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
    return map;
  }, [products]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div className="home-page">

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
        <div className="hero-grid-pattern" />

        <div className="container hero-layout">
          <div className="hero-copy">
            <span className="hero-badge"><FiZap /> New season drop is live</span>
            <h1>
              Fashion that<br />
              <span className="gradient-text">speaks Gen-Z.</span>
            </h1>
            <p className="hero-desc">
              Streetwear, oversized fits and bold accessories. Try pieces on with your camera
              before you buy, and have them at your door in days.
            </p>
            <div className="hero-btns">
              <Link to="/products" className="btn-hero-primary">
                Shop the collection <FiArrowRight />
              </Link>
              <Link to="/tryon" className="btn-hero-outline">
                <FiCamera /> Try it on
              </Link>
            </div>

            <div className="hero-stats">
              <div>
                <strong>{products.length > 0 ? `${products.length}+` : '50+'}</strong>
                <span>Styles in stock</span>
              </div>
              <div>
                <strong>6</strong>
                <span>Categories</span>
              </div>
              <div>
                <strong>$50+</strong>
                <span>Ships free</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden={heroPicks.length === 0}>
            {heroPicks.length === 0 ? (
              <>
                <div className="hv-card hv-1 hv-skeleton" />
                <div className="hv-card hv-2 hv-skeleton" />
                <div className="hv-card hv-3 hv-skeleton" />
              </>
            ) : (
              heroPicks.map((p, i) => (
                <Link key={p._id} to={`/products/${p._id}`} className={`hv-card hv-${i + 1}`}>
                  <img src={p.image_url} alt={p.name} loading={i === 0 ? 'eager' : 'lazy'} />
                  <span className="hv-tag">
                    <span>{p.name}</span>
                    <b>${p.price?.toFixed(2)}</b>
                  </span>
                </Link>
              ))
            )}
            <div className="hv-chip hv-chip-a"><FiCamera /> AI try-on ready</div>
            <div className="hv-chip hv-chip-b"><FiTruck /> Free shipping $50+</div>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE].map((text, i) => (
            <span key={i}><FiZap /> {text}</span>
          ))}
        </div>
      </div>

      {/* ─── CATEGORIES ─── */}
      <section className="section-cats container">
        <Reveal>
          <div className="section-head">
            <div>
              <span className="eyebrow">Browse</span>
              <h2>Shop by category</h2>
              <p className="section-sub">Find your style from our curated collections</p>
            </div>
            <Link to="/products" className="see-all-link">View all <FiArrowRight /></Link>
          </div>
        </Reveal>
        <div className="cat-grid">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.name} delay={i * 60}>
              <Link to={`/products?category=${cat.name}`} className="cat-card">
                <img src={img(cat.photo, 600)} alt="" loading="lazy" />
                <div className="cat-shade" />
                <div className="cat-info">
                  <div>
                    <h3>{cat.name}</h3>
                    <p>{cat.desc}</p>
                  </div>
                  <span className="cat-arrow"><FiArrowRight /></span>
                </div>
                {counts[cat.name] > 0 && <span className="cat-count">{counts[cat.name]} items</span>}
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      <section className="arrivals container">
        <Reveal>
          <div className="section-head">
            <div>
              <span className="eyebrow">Just landed</span>
              <h2>New arrivals</h2>
              <p className="section-sub">Fresh pieces added to the store this week</p>
            </div>
            <Link to="/products" className="see-all-link">Shop everything <FiArrowRight /></Link>
          </div>
        </Reveal>
        <div className="arrivals-grid">
          {loading
            ? [...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)
            : arrivals.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
        {!loading && arrivals.length === 0 && (
          <p className="section-sub center-text">New products are on the way. Check back soon.</p>
        )}
      </section>

      {/* ─── TRY-ON SPOTLIGHT ─── */}
      <section className="tryon-section">
        <div className="container tryon-layout">
          <Reveal className="tryon-visual">
            <div className="tryon-frame">
              <img
                src={heroPicks[0]?.image_url || img('1595777457583-95e059d581b8', 700)}
                alt="Virtual try-on preview"
                loading="lazy"
              />
              <span className="corner tl" /><span className="corner tr" />
              <span className="corner bl" /><span className="corner br" />
              <span className="scan-line" />
              <span className="tryon-live"><i /> LIVE</span>
            </div>
          </Reveal>

          <Reveal className="tryon-copy" delay={120}>
            <span className="eyebrow">Virtual try-on</span>
            <h2>See it on you before it ships</h2>
            <p>
              Skip the guesswork. Use your webcam to preview clothes on yourself in real time
              and only buy what you love.
            </p>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="step-num">{i + 1}</span>
                  <div>
                    <h4>{s.title}</h4>
                    <p>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/tryon" className="btn-hero-primary">
              Open try-on studio <FiArrowRight />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="why-section">
        <div className="container">
          <Reveal>
            <div className="section-head center">
              <div>
                <span className="eyebrow">Why us</span>
                <h2>Why Gen-Z Threads?</h2>
                <p className="section-sub">Here's what makes us different</p>
              </div>
            </div>
          </Reveal>
          <div className="why-grid">
            {[
              { icon: FiCamera, title: 'Virtual try-on', text: 'Preview outfits on yourself with your camera before you check out.' },
              { icon: FiTruck, title: 'Fast delivery', text: 'Free shipping on orders over $50, delivered in 2-4 business days.' },
              { icon: FiShield, title: 'Quality guarantee', text: 'Every piece is quality-checked. Not happy? Return it within 30 days.' },
              { icon: FiPackage, title: 'Weekly drops', text: 'New styles land every week, so there is always something fresh.' },
            ].map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="why-card">
                  <div className="why-icon"><Icon /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="trust-bar">
        <div className="container trust-row">
          <div className="trust-item"><FiTruck /> <span>Free shipping over $50</span></div>
          <div className="trust-item"><FiShield /> <span>Secure payments</span></div>
          <div className="trust-item"><FiRefreshCw /> <span>30-day returns</span></div>
          <div className="trust-item"><FiCamera /> <span>Virtual try-on</span></div>
        </div>
      </section>

      {/* ─── JOIN BANNER ─── */}
      <section className="promo-banner container">
        <Reveal>
          <div className="promo-box">
            <div className="promo-glow" />
            <div className="promo-left">
              <span className="promo-label"><FiStar /> Members get more</span>
              <h2>Join the community, get first access to drops</h2>
              <p>Create a free account to save your wishlist, track orders and be first in line when new collections land.</p>
              <Link to="/register" className="btn-hero-light">
                Create free account <FiArrowRight />
              </Link>
            </div>
            <ul className="promo-perks">
              <li><FiCheck /> Wishlist &amp; saved sizes</li>
              <li><FiCheck /> Order tracking &amp; invoices</li>
              <li><FiCheck /> Early access to new drops</li>
              <li><FiCheck /> Virtual try-on studio</li>
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ─── NEWSLETTER ─── */}
      <section className="newsletter-section container">
        <Reveal>
          <h2>Stay in the loop</h2>
          <p>Subscribe to hear about new drops and offers first.</p>
          {subscribed ? (
            <p className="nl-success"><FiCheck /> You're on the list. Thanks for subscribing!</p>
          ) : (
            <form className="nl-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-label="Email address"
                required
              />
              <button type="submit">Subscribe</button>
            </form>
          )}
        </Reveal>
      </section>
    </div>
  );
}
