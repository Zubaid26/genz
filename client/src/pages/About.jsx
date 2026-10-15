import { Link } from 'react-router-dom';
import {
  FiCamera, FiShoppingBag, FiTruck, FiShield,
  FiArrowRight, FiCheckCircle, FiHeart, FiStar,
  FiZap, FiCompass, FiGlobe
} from 'react-icons/fi';
import './About.css';

export default function About() {
  return (
    <div className="about-page container">
      {/* ── Hero Section ── */}
      <section className="about-hero">
        <div className="about-hero-badge-wrap">
          <span className="eyebrow">ABOUT GEN-Z THREADS</span>
          <span className="about-badge-pill">
            <FiStar /> The Future of Fashion
          </span>
        </div>
        <h1 className="about-hero-title">
          Crafted for the Youth. <br />
          <span className="about-title-gradient">Rooted in Heritage.</span>
        </h1>
        <p className="about-hero-sub">
          Where South-Asian artisanal craftsmanship meets the boundary-pushing energy of global streetwear.
          We build statement garments and intelligent digital try-on experiences for the next generation
          of creative tastemakers.
        </p>

        <div className="about-hero-stats-row">
          <div className="hero-stat-pill">
            <strong>50K+</strong>
            <span>Active Shoppers</span>
          </div>
          <div className="hero-stat-pill">
            <strong>100%</strong>
            <span>Artisanal Craft</span>
          </div>
          <div className="hero-stat-pill">
            <strong>AI-Powered</strong>
            <span>Virtual Fitting</span>
          </div>
          <div className="hero-stat-pill">
            <strong>Pakistan-Wide</strong>
            <span>Express Delivery</span>
          </div>
        </div>
      </section>

      {/* ── Brand Story / Manifesto Split ── */}
      <section className="about-story-section">
        <div className="about-story-grid">
          <div className="about-story-content">
            <span className="section-kicker">OUR MANIFESTO</span>
            <h2 className="about-section-heading">
              Why We Built Gen-Z Threads
            </h2>
            <div className="story-paragraphs">
              <p>
                For decades, modern fashion has forced young South-Asians to choose between two extremes:
                traditional ceremonial attire that felt rigid and formal, or generic global streetwear
                that lacked cultural soul and narrative.
              </p>
              <p>
                <strong>Gen-Z Threads was born to bridge that divide.</strong> We set out to reimagine
                timeless Eastern garments—such as kurtas, bandhgala collars, and festive shalwar kameez—through
                the lens of contemporary silhouettes: boxy cuts, dropped shoulders, heavyweight fabrics,
                and utilitarian details.
              </p>
              <p>
                Every garment is an intentional dialogue between local textile mastery and youthful rebellion.
                We believe what you wear is your digital and real-world avatar—bold, unapologetic, and effortlessly authentic.
              </p>
            </div>

            <div className="story-check-list">
              <div className="story-check-item">
                <FiCheckCircle className="check-icon" />
                <div>
                  <strong>Small-Batch Production</strong>
                  <span>No mass-produced waste; every drop is limited and responsibly tailored.</span>
                </div>
              </div>
              <div className="story-check-item">
                <FiCheckCircle className="check-icon" />
                <div>
                  <strong>Heritage Fabrics & Heavyweight Cotton</strong>
                  <span>From hand-spun breathable linens to ultra-dense 450GSM winter fleece.</span>
                </div>
              </div>
              <div className="story-check-item">
                <FiCheckCircle className="check-icon" />
                <div>
                  <strong>Ethical Local Artisan Partnerships</strong>
                  <span>Partnering with master tailors across Lahore and Karachi with fair living wages.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="about-story-media">
            <div className="story-image-card">
              <img
                src="https://images.unsplash.com/photo-1727835523545-70ee992b5763?q=80&w=900"
                alt="Gen-Z Threads Modern Kurta Craftsmanship"
                className="story-featured-img"
              />
              <div className="story-image-caption">
                <span className="caption-tag">FUSION COLLECTION</span>
                <p>Minimalist silhouette with classic band collar in breathable artisan linen.</p>
              </div>
            </div>

            <div className="story-quote-card">
              <FiZap className="quote-icon" />
              <blockquote>
                "Fashion is not just what you wear; it's how you express your heritage in the digital age."
              </blockquote>
              <div className="quote-author">
                <strong>Muhammad Zubaid</strong>
                <span>Founder & Creative Lead, Gen-Z Threads</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What We Offer Section ── */}
      <section className="about-offerings-section">
        <div className="section-center-header">
          <span className="section-kicker">WHAT WE OFFER</span>
          <h2 className="about-section-heading">Engineered for the Modern Shopper</h2>
          <p className="section-subtext">
            From groundbreaking computer-vision fitting to bespoke contemporary streetwear,
            here is what makes the Gen-Z Threads experience distinct.
          </p>
        </div>

        <div className="about-cards-grid">
          {/* Card 1: AI Try-On */}
          <div className="offering-card highlight-card">
            <div className="offering-icon-box">
              <FiCamera />
            </div>
            <div className="offering-badge">EXCLUSIVE INNOVATION</div>
            <h3 className="offering-title">AI Virtual Try-On Studio</h3>
            <p className="offering-desc">
              Experience fashion before buying. Upload your photo to our neural fitting studio
              and see how oversized hoodies, kurtas, or co-ord sets drape on your exact physique in real time.
            </p>
            <Link to="/tryon" className="offering-card-link">
              <span>Launch Virtual Studio</span>
              <FiArrowRight />
            </Link>
          </div>

          {/* Card 2: Contemporary Streetwear */}
          <div className="offering-card">
            <div className="offering-icon-box">
              <FiShoppingBag />
            </div>
            <h3 className="offering-title">Curated Streetwear & Fusion Drops</h3>
            <p className="offering-desc">
              From wide-leg vintage-washed denim and 450GSM fleece hoodies to relaxed festive
              shalwar kameez and chic co-ord sets, every piece is custom patterned for modern everyday drape.
            </p>
            <Link to="/collections" className="offering-card-link">
              <span>Explore All Categories</span>
              <FiArrowRight />
            </Link>
          </div>

          {/* Card 3: Seamless Local Payments */}
          <div className="offering-card">
            <div className="offering-icon-box">
              <FiShield />
            </div>
            <h3 className="offering-title">Hassle-Free Pakistani Checkouts</h3>
            <p className="offering-desc">
              Seamlessly pay via JazzCash, Easypaisa with instant receipt verification,
              Cash on Delivery (COD) across every city in Pakistan, or Visa/Mastercard.
            </p>
            <Link to="/products" className="offering-card-link">
              <span>Start Shopping</span>
              <FiArrowRight />
            </Link>
          </div>

          {/* Card 4: Nationwide Fast Delivery */}
          <div className="offering-card">
            <div className="offering-icon-box">
              <FiTruck />
            </div>
            <h3 className="offering-title">Express Delivery & Easy Returns</h3>
            <p className="offering-desc">
              Swift 2-4 day doorstep delivery with tracked dispatch, digital invoice generation,
              and a hassle-free 30-day exchange guarantee if the size isn't 100% perfect.
            </p>
            <Link to="/products" className="offering-card-link">
              <span>Browse Catalog</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Brand Values / Core Pillars ── */}
      <section className="about-values-section">
        <div className="section-center-header">
          <span className="section-kicker">OUR CORE VALUES</span>
          <h2 className="about-section-heading">What We Stand For</h2>
        </div>

        <div className="about-values-grid">
          <div className="value-item-card">
            <div className="value-num">01</div>
            <h3 className="value-item-title">Authentic Self-Expression</h3>
            <p className="value-item-desc">
              We reject cookie-cutter fast fashion tropes. Our apparel gives you room to breathe,
              move, and proudly showcase both ethnic tradition and street attitude.
            </p>
          </div>

          <div className="value-item-card">
            <div className="value-num">02</div>
            <h3 className="value-item-title">Technology Meets Style</h3>
            <p className="value-item-desc">
              We pioneer tech in fashion. By giving our community interactive AI try-ons and
              instant digital receipts, we make online clothing shopping enjoyable and risk-free.
            </p>
          </div>

          <div className="value-item-card">
            <div className="value-num">03</div>
            <h3 className="value-item-title">Accessible Luxury Quality</h3>
            <p className="value-item-desc">
              Studio-grade fabrics, reinforced double-needle stitching, and custom branded trims—at
              fair, direct-to-consumer prices with zero artificial luxury markups.
            </p>
          </div>
        </div>
      </section>

      {/* ── Impact Banner ── */}
      <section className="about-impact-banner">
        <div className="impact-container">
          <div className="impact-text-col">
            <span className="impact-kicker">OUR COMMITMENT</span>
            <h2 className="impact-title">Proudly Designed & Tailored in Pakistan</h2>
            <p className="impact-desc">
              Every order directly supports our network of regional weavers, pattern makers, and
              artisans. By producing locally, we reduce transit emissions and foster regional textile innovation.
            </p>
          </div>
          <div className="impact-pills-col">
            <div className="impact-badge">
              <FiGlobe /> 100% Local Manufacturing
            </div>
            <div className="impact-badge">
              <FiHeart /> Zero Deadstock Policy
            </div>
            <div className="impact-badge">
              <FiCompass /> Sustainable Packaging
            </div>
          </div>
        </div>
      </section>

      {/* ── Call To Action ── */}
      <section className="about-cta-section">
        <div className="about-cta-card">
          <div className="about-cta-content">
            <span className="eyebrow">JOIN THE MOVEMENT</span>
            <h2 className="about-cta-title">Ready to Redefine Your Wardrobe?</h2>
            <p className="about-cta-sub">
              Explore our latest drop of heavyweight hoodies, fusion kurtas, and baggy denim,
              or test-drive the pieces on yourself with our AI Try-On tool.
            </p>
            <div className="about-cta-buttons">
              <Link to="/products" className="btn-primary cta-btn">
                <span>Shop New Arrivals</span>
                <FiArrowRight />
              </Link>
              <Link to="/tryon" className="btn-secondary cta-btn">
                <FiCamera />
                <span>Launch AI Try-On Studio</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
