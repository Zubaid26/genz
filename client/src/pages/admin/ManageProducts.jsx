import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import API from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Admin.css';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', category:'', price:'', stock:'', image_url:'', overlay_image_url:'', description:'' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = () => {
    API.get('/products').then(res => setProducts(res.data)).catch(() => {});
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
        toast.success('Product added!');
      }
      setForm({ name:'', category:'', price:'', stock:'', image_url:'', overlay_image_url:'', description:'' });
      setEditId(null); setShowForm(false); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, image_url: p.image_url, overlay_image_url: p.overlay_image_url || '', description: p.description || '' });
    setEditId(p._id); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await API.delete(`/products/${id}`); toast.success('Deleted!'); fetchProducts(); }
    catch { toast.error('Error deleting'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Manage Products</h1>
          <p className="admin-header-sub">Add, edit, or remove catalog items</p>
        </div>
        <button
          type="button"
          className="admin-action-btn"
          onClick={() => { setShowForm(!showForm); setEditId(null); }}
        >
          <FiPlus /> {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form className="add-form" onSubmit={handleSubmit}>
          <h2>{editId ? 'Edit Product' : 'Add New Product'}</h2>
          <div className="form-grid">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Product Name" required />
            <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
            <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} placeholder="Price" required />
            <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="Stock" required />
            <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="Image URL" required />
            <input name="overlay_image_url" value={form.overlay_image_url} onChange={handleChange} placeholder="Overlay Image URL (optional)" />
          </div>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            rows={3}
            style={{ width: '100%', marginTop: 12, padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 10, color: 'var(--text-color)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
          />
          <button type="submit" className="submit-btn">{editId ? 'Update' : 'Add'} Product</button>
        </form>
      )}

      <div className="table-wrapper">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={p.image_url} alt="" style={{ width: 36, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                  {p.name}
                </td>
                <td>{p.category}</td>
                <td>${p.price?.toFixed(2)}</td>
                <td style={{ color: p.stock < 10 ? '#ef4444' : '#22c55e' }}>{p.stock}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(p)} title="Edit"><FiEdit /></button>
                  <button className="delete-btn" onClick={() => handleDelete(p._id)} title="Delete"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
