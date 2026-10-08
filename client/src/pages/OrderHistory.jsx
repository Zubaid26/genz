import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiDownload } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import './OrderHistory.css';

const statusColors = {
  Placed: '#3b82f6', Processing: '#f59e0b',
  Shipped: '#a855f7', Delivered: '#22c55e', Cancelled: '#ef4444'
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/auth/orders').then(res => setOrders(res.data))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="orders-page"><p style={{color:'#fff'}}>Loading...</p></div>;

  return (
    <div className="orders-page container">
      <h1><FiPackage /> Order History</h1>
      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet</p>
          <Link to="/products" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <span className="order-id">#{order._id?.slice(-8).toUpperCase()}</span>
                <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="order-status" style={{ background: `${statusColors[order.status]}22`, color: statusColors[order.status] }}>
                  {order.status}
                </span>
              </div>
              <div className="order-items">
                {order.items?.map((item, i) => (
                  <div key={i} className="order-item">
                    <img src={item.product_id?.image_url || ''} alt="" />
                    <span>{item.product_id?.name}</span>
                    <span className="oi-qty">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="order-footer">
                <span className="order-total">${order.total_price?.toFixed(2)}</span>
                <Link to={`/order-confirmation/${order._id}`} className="view-order">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
