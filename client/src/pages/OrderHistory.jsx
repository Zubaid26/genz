import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiArrowRight, FiCalendar, FiClock, FiShoppingBag } from 'react-icons/fi';
import API from '../utils/axiosInstance';
import './OrderHistory.css';
import { money } from '../utils/currency';

const STATUS_TABS = ['All', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    API.get('/auth/orders')
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'All') return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  if (loading) {
    return (
      <div className="orders-page container">
        <div className="orders-loading-state">
          <p>Retrieving your order records…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-editorial-page container">
      {/* Header */}
      <div className="orders-page-header">
        <div>
          <span className="eyebrow">Customer Portal</span>
          <h1 className="orders-main-title">Order History</h1>
          <p className="orders-caption">Track fulfillment progress, view item breakdowns, and download invoices.</p>
        </div>
        <Link to="/products" className="orders-shop-link">
          <FiShoppingBag />
          <span>Shop New Drops</span>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      {orders.length > 0 && (
        <div className="orders-tabs-row">
          {STATUS_TABS.map((tab) => {
            const count = tab === 'All' ? orders.length : orders.filter((o) => o.status === tab).length;
            if (tab !== 'All' && count === 0) return null;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`order-tab-btn ${activeTab === tab ? 'is-active' : ''}`}
              >
                <span>{tab}</span>
                <span className="tab-count-pill">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="orders-empty-box">
          <div className="empty-pkg-icon">
            <FiPackage />
          </div>
          <h2>No Orders Placed Yet</h2>
          <p>You haven’t placed any orders yet. Once you make a purchase, it will appear here for tracking.</p>
          <Link to="/products" className="btn-primary">
            <span>Explore Collections</span>
            <FiArrowRight />
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty-filter">
          <p>No orders found under "{activeTab}".</p>
          <button type="button" className="btn-secondary" onClick={() => setActiveTab('All')}>
            Show All Orders
          </button>
        </div>
      ) : (
        <div className="orders-cards-list">
          {filteredOrders.map((order) => {
            const orderNum = order._id?.slice(-8).toUpperCase();
            const dateStr = new Date(order.created_at).toLocaleDateString('en-PK', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div key={order._id} className="order-history-card">
                {/* Header */}
                <div className="oh-header">
                  <div className="oh-meta-left">
                    <span className="oh-order-num">#{orderNum}</span>
                    <span className="oh-order-date">
                      <FiCalendar /> {dateStr}
                    </span>
                  </div>
                  <div className="oh-meta-right">
                    <span className={`oh-status-badge status-${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="oh-items-grid">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="oh-item-chip">
                      <div className="oh-item-thumb">
                        <img
                          src={item.product_id?.image_url}
                          alt=""
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200";
                          }}
                        />
                      </div>
                      <div className="oh-item-info">
                        <p className="oh-item-title">{item.product_id?.name || 'Item'}</p>
                        <span className="oh-item-qty">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer with Total & Link */}
                <div className="oh-footer">
                  <div className="oh-total-group">
                    <span className="oh-total-label">Total Amount</span>
                    <strong className="oh-total-val">{money(order.total_price)}</strong>
                  </div>
                  <Link to={`/order-confirmation/${order._id}`} className="oh-view-details-btn">
                    <span>View Receipt & Invoice</span>
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
