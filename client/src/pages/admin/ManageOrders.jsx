import { useState, useEffect } from 'react';
import API from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Admin.css';
import { money } from '../../utils/currency';

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    API.get('/orders')
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      toast.success('Order status updated!');
      fetchOrders();
    } catch {
      toast.error('Error updating order status');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Fulfillment Center</span>
          <h1>Manage Customer Orders</h1>
          <p className="admin-header-sub">{orders.length} total customer orders recorded</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Current Status</th>
              <th>Date Placed</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>
                  <span className="admin-ref-code">#{o._id?.slice(-8).toUpperCase()}</span>
                </td>
                <td>
                  <div className="admin-cust-cell">
                    <strong>{o.user_id?.full_name || 'Guest/Customer'}</strong>
                    <span>{o.shipping_address?.city || 'Pakistan'}</span>
                  </div>
                </td>
                <td>
                  <span className="admin-item-count">{o.items?.length || 0} item{o.items?.length === 1 ? '' : 's'}</span>
                </td>
                <td>
                  <span className="admin-order-total">{money(o.total_price)}</span>
                </td>
                <td>
                  <span className={`oh-status-badge status-${o.status?.toLowerCase()}`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <span className="admin-date-text">
                    {new Date(o.created_at).toLocaleDateString('en-PK', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </td>
                <td className="actions">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    className="admin-status-select"
                    aria-label="Update fulfillment status"
                  >
                    {['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
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
