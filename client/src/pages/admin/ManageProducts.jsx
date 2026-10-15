import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiX, FiCheck, FiImage } from 'react-icons/fi';
import API from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Admin.css';
import { money } from '../../utils/currency';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', category: '', price: '', stock: '', image_url: '', description: ''
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    API.get('/products')
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editId) {
        await API.put(`/products/${editId}`, data);
        toast.success('Product updated!');
      } else {
        await API.post('/products', data);
        toast.success('Product added successfully!');
      }
      setForm({ name: '', category: '', price: '', stock: '', image_url: '', description: '' });
      setEditId(null);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      image_url: p.image_url,
      description: p.description || ''
    });
    setEditId(p._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted!');
      fetchProducts();
    } catch {
      toast.error('Error deleting product');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Inventory Management</span>
          <h1>Product Catalog</h1>
          <p className="admin-header-sub">{products.length} active products in catalog</p>
        </div>
        <button
          type="button"
          className="admin-action-btn"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditId(null);
            } else {
              setForm({ name: '', category: '', price: '', stock: '', image_url: '', description: '' });
              setEditId(null);
              setShowForm(true);
            }
          }}
        >
          {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Add New Piece</>}
        </button>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleSubmit}>
          <div className="add-form-head">
            <h2>{editId ? 'Edit Product Details' : 'Add New Apparel Piece'}</h2>
            <button
              type="button"
              className="add-form-close"
              onClick={() => { setShowForm(false); setEditId(null); }}
              aria-label="Close form"
            >
              <FiX />
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Product Title *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Charcoal Shalwar Kameez"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Shalwar Kameez, Kurtas, Hoodies"
                required
              />
            </div>

            <div className="form-group">
              <label>Price (PKR / Rs) *</label>
              <input
                name="price"
                type="number"
                step="1"
                value={form.price}
                onChange={handleChange}
                placeholder="4190"
                required
              />
            </div>

            <div className="form-group">
              <label>Stock Count *</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                placeholder="25"
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Image URL *</label>
              <input
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-..."
                required
              />
            </div>

          </div>

          {form.image_url && (
            <div className="admin-img-preview-box">
              <span className="preview-label">Image Preview:</span>
              <img
                src={form.image_url}
                alt="Preview"
                className="admin-preview-thumbnail"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Product Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the fabric, cut, occasion, and fit details..."
              rows={3}
              className="admin-textarea"
            />
          </div>

          <div className="add-form-actions">
            <button type="submit" className="btn-primary submit-btn">
              <FiCheck /> {editId ? 'Save Changes' : 'Publish Product'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setShowForm(false); setEditId(null); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Piece</th>
              <th>Category</th>
              <th>Price</th>
              <th>Inventory</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>
                  <div className="admin-table-item-cell">
                    <img
                      src={p.image_url}
                      alt=""
                      className="admin-table-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200";
                      }}
                    />
                    <div className="admin-table-name-wrap">
                      <strong className="table-item-name">{p.name}</strong>
                      <span className="table-item-desc-preview">{p.description?.slice(0, 50)}</span>
                    </div>
                  </div>
                </td>
                <td><span className="table-cat-badge">{p.category}</span></td>
                <td><strong>{money(p.price)}</strong></td>
                <td>
                  <span className={`table-stock-badge ${p.stock <= 5 ? 'low' : 'ok'}`}>
                    {p.stock} in stock
                  </span>
                </td>
                <td className="actions">
                  <button type="button" onClick={() => handleEdit(p)} title="Edit product" aria-label="Edit">
                    <FiEdit />
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(p._id)}
                    title="Delete product"
                    aria-label="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
