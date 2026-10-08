import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import ProductCard from '../components/ProductCard';
import './ProductCatalog.css';

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');

  const categories = ['All', 'Shirts', 'Pants', 'Dresses', 'Jackets', 'Shoes', 'Accessories'];

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'All') params.category = category;
    API.get('/products', { params })
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    const val = e.target.elements.search.value;
    setSearch(val);
    setSearchParams(prev => { val ? prev.set('search', val) : prev.delete('search'); return prev; });
  };

  const handleCategory = (cat) => {
    setCategory(cat === 'All' ? '' : cat);
    setSearchParams(prev => {
      cat === 'All' ? prev.delete('category') : prev.set('category', cat);
      return prev;
    });
  };

  return (
    <div className="catalog-page container">
      <div className="catalog-header">
        <h1>Shop Collection</h1>
        <form className="catalog-search" onSubmit={handleSearch}>
          <FiSearch />
          <input name="search" placeholder="Search products..." defaultValue={search} />
        </form>
      </div>
      <div className="catalog-filters">
        <FiFilter />
        {categories.map(cat => (
          <button key={cat} onClick={() => handleCategory(cat)}
            className={`filter-btn ${(category === cat || (!category && cat === 'All')) ? 'active' : ''}`}>
            {cat}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="products-grid">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No products found</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
