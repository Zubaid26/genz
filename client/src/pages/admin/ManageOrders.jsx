import { useState, useEffect } from 'react';
import API from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Admin.css';

const statusColors = { Placed:'#3b82f6', Processing:'#f59e0b', Shipped:'#a855f7', Delivered:'#22c55e', Cancelled:'#ef4444' };

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => { fetchOrders(); }, []);
  const fetchOrders = () => {
    API.get('/orders').then(res => setOrders(res.data)).catch(() => {});
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      toast.success('Status updated!'); fetchOrders();
    } catch { toast.error('Error updating'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Manage Orders</h1>
          <p className="admin-header-sub">Track and update fulfillment status</p>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o._id}>
                <td>#{o._id?.slice(-6).toUpperCase()}</td>
                <td>{o.user_id?.full_name || 'N/A'}</td>
                <td>{o.items?.length} items</td>
                <td style={{ color: '#a855f7', fontWeight: 700 }}>${o.total_price?.toFixed(2)}</td>
                <td>
                  <span style={{
                    padding: '3px 10px', borderRadius: 6,
                    background: `${statusColors[o.status]}22`,
                    color: statusColors[o.status],
                    fontSize: '0.8rem', fontWeight: 600
                  }}>{o.status}</span>
                </td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="actions">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }}
                  >
                    {['Placed','Processing','Shipped','Delivered','Cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
