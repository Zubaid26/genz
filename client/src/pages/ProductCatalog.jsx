import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiSliders, FiX, FiCheck } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import ProductCard from '../components/ProductCard';
import './ProductCatalog.css';

const CATEGORIES = [
  'All',
  'Shalwar Kameez',
  'Kurtas',
  'Hoodies',
  'T-Shirts',
  'Jeans',
  'Women'
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Drops' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const inStock = searchParams.get('inStock') === 'true';

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'All') params.category = category;
    if (sort) params.sort = sort;
    if (inStock) params.inStock = 'true';

    API.get('/products', { params })
      .then((res) => {
        setProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, category, sort, inStock]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (searchInput.trim()) {
        prev.set('search', searchInput.trim());
      } else {
        prev.delete('search');
      }
      return prev;
    });
  };

  const handleCategorySelect = (cat) => {
    setSearchParams((prev) => {
      if (cat === 'All') {
        prev.delete('category');
      } else {
        prev.set('category', cat);
      }
      return prev;
    });
  };

  const handleSortChange = (newSort) => {
    setSearchParams((prev) => {
      prev.set('sort', newSort);
      return prev;
    });
  };

  const toggleInStock = () => {
    setSearchParams((prev) => {
      if (inStock) {
        prev.delete('inStock');
      } else {
        prev.set('inStock', 'true');
      }
      return prev;
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(search || category || inStock || sort !== 'newest');

  return (
    <div className="catalog-editorial container">
      {/* ── Collection Header ── */}
      <header className="catalog-header-block">
        <div className="catalog-title-col">
          <span className="eyebrow">The Catalog</span>
          <h1 className="catalog-main-title">
            {category && category !== 'All' ? category : 'All Collections'}
          </h1>
          <p className="catalog-count-caption">
            {loading ? 'Curating pieces…' : `${products.length} piece${products.length === 1 ? '' : 's'} available`}
          </p>
        </div>

        {/* Catalog Search Bar */}
        <form className="catalog-search-bar" onSubmit={handleSearchSubmit}>
          <FiSearch className="catalog-search-icon" />
          <input
            type="search"
            name="search"
            placeholder="Search catalog…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              className="catalog-search-clear"
              onClick={() => {
                setSearchInput('');
                setSearchParams((prev) => { prev.delete('search'); return prev; });
              }}
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}
        </form>
      </header>

      {/* ── Category Tabs & Filter Toolbar ── */}
      <div className="catalog-toolbar-panel">
        <div className="catalog-category-scroller">
          {CATEGORIES.map((cat) => {
            const isActive = (cat === 'All' && !category) || category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`category-pill-btn ${isActive ? 'is-active' : ''}`}
                aria-pressed={isActive}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="catalog-controls-right">
          {/* In-Stock Filter Toggle */}
          <button
            type="button"
            className={`catalog-stock-toggle ${inStock ? 'is-active' : ''}`}
            onClick={toggleInStock}
            title="Filter by stock availability"
          >
            <span className="checkbox-box">{inStock && <FiCheck />}</span>
            <span>In-Stock Only</span>
          </button>

          {/* Sort Selector */}
          <div className="catalog-sort-wrap">
            <FiSliders className="sort-icon" />
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="catalog-sort-select"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="active-filters-strip">
          <span className="active-filters-label">Active filters:</span>
          {search && (
            <span className="filter-chip">
              Search: "{search}"
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams((prev) => { prev.delete('search'); return prev; });
                }}
              >
                <FiX />
              </button>
            </span>
          )}
          {category && category !== 'All' && (
            <span className="filter-chip">
              Category: {category}
              <button type="button" onClick={() => handleCategorySelect('All')}>
                <FiX />
              </button>
            </span>
          )}
          {inStock && (
            <span className="filter-chip">
              In-Stock
              <button type="button" onClick={toggleInStock}>
                <FiX />
              </button>
            </span>
          )}
          {sort !== 'newest' && (
            <span className="filter-chip">
              Sorted
              <button type="button" onClick={() => handleSortChange('newest')}>
                <FiX />
              </button>
            </span>
          )}
          <button type="button" className="clear-all-filters-btn" onClick={clearAllFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* ── Product Grid or Empty State ── */}
      {loading ? (
        <div className="products-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="catalog-empty-state">
          <div className="empty-state-icon">⚡</div>
          <h3>No matching pieces found</h3>
          <p>
            {search
              ? `We couldn't find any results for "${search}". Try checking your spelling or explore other categories.`
              : 'There are currently no items available under this selection.'}
          </p>
          <button type="button" className="btn-primary" onClick={clearAllFilters}>
            View All Pieces
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
