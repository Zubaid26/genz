import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiLayers } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import './Collections.css';

const CATEGORIES_DATA = [
  {
    name: 'Shalwar Kameez',
    tagline: 'Festive & Heritage Wear',
    desc: 'Classic cuts, traditional collars, and modern proportions tailored for celebratory occasions.',
    photo: 'https://images.unsplash.com/photo-1734418040900-e964f84e8abb?q=80&w=900',
    tags: ['Traditional', 'Festive', 'Silk & Cotton'],
  },
  {
    name: 'Kurtas',
    tagline: 'Modern Fusion & Everyday Wear',
    desc: 'Clean lines, breathable fabrics, and versatile styling for effortless everyday comfort.',
    photo: 'https://images.unsplash.com/photo-1727835523545-70ee992b5763?q=80&w=900',
    tags: ['Breathable', 'Modern Fit', 'Handcrafted'],
  },
  {
    name: 'Hoodies',
    tagline: 'Heavyweight Streetwear',
    desc: 'Ultra-heavyweight 450GSM cotton fleece, relaxed drop shoulders, and minimalist aesthetics.',
    photo: 'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?q=80&w=900',
    tags: ['450 GSM', 'Oversized', 'Streetwear'],
  },
  {
    name: 'T-Shirts',
    tagline: 'Boxy Drop-Shoulder Essentials',
    desc: 'Boxy cuts, reinforced ribbed collars, and heavyweight combed cotton designed to hold shape.',
    photo: 'https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?q=80&w=900',
    tags: ['Boxy Fit', '100% Cotton', 'Graphics'],
  },
  {
    name: 'Jeans',
    tagline: 'Wide-Leg & Baggy Denim',
    desc: 'Vintage-washed raw denim with deep indigo tones, relaxed wide-leg drape, and clean hardware.',
    photo: 'https://images.unsplash.com/photo-1674075872359-a174bc7ed420?q=80&w=900',
    tags: ['Raw Denim', 'Wide-Leg', 'Vintage Wash'],
  },
  {
    name: 'Women',
    tagline: 'Kurtis, Co-ords & Suits',
    desc: 'Contemporary silhouettes, elegant drapes, and modern Eastern two-piece ensembles.',
    photo: 'https://images.unsplash.com/photo-1597983073540-684a10b15ab1?q=80&w=900',
    tags: ['Co-ords', 'Kurtis', 'Chic'],
  },
];

export default function Collections() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    API.get('/products')
      .then((res) => {
        if (Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((p) => {
            if (p.category) {
              map[p.category] = (map[p.category] || 0) + 1;
            }
          });
          setCounts(map);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="collections-page">
      <div className="container collections-container">
        {/* Header Block */}
        <header className="collections-header">
          <span className="collections-eyebrow">
            <FiLayers /> ARCHIVE & SILHOUETTES
          </span>
          <h1 className="collections-title">The Collections</h1>
          <p className="collections-subtitle">
            Explore our curated apparel categories engineered with contemporary cuts and authentic roots.
            Select any collection to view available pieces.
          </p>
        </header>

        {/* Collections Grid */}
        <div className="collections-grid">
          {CATEGORIES_DATA.map((cat, index) => {
            const count = counts[cat.name];
            return (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="collection-card"
              >
                <div className="collection-card-bg">
                  <img src={cat.photo} alt={cat.name} loading={index < 3 ? 'eager' : 'lazy'} />
                  <div className="collection-scrim" />
                </div>

                <div className="collection-card-body">
                  <div className="collection-meta-top">
                    <span className="collection-tagline">{cat.tagline}</span>
                    <span className="collection-count-pill">
                      {count != null ? `${count} ${count === 1 ? 'Style' : 'Styles'}` : 'Explore'}
                    </span>
                  </div>

                  <div className="collection-meta-bottom">
                    <h2 className="collection-name">{cat.name}</h2>
                    <p className="collection-desc">{cat.desc}</p>

                    <div className="collection-action-row">
                      <div className="collection-tags-list">
                        {cat.tags.map((tag) => (
                          <span key={tag} className="collection-tag-item">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="collection-cta-btn">
                        <span>Browse</span>
                        <FiArrowRight />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
