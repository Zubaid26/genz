import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage, FiHeart, FiUser, FiSettings, FiShoppingBag,
  FiArrowRight, FiShield, FiExternalLink, FiClock
} from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import API from '../utils/axiosInstance';
import './UserDashboard.css';
import { money } from '../utils/currency';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, wishlist: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, wishlistRes] = await Promise.all([
          API.get('/auth/orders'),
          API.get('/auth/wishlist')
        ]);
        const ordersList = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const wishlistList = Array.isArray(wishlistRes.data) ? wishlistRes.data : [];
        setStats({
          orders: ordersList.length,
          wishlist: wishlistList.length
        });
        setRecentOrders(ordersList.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-editorial-page container">
        <div className="loading-screen">
          <p>Loading your customer portal…</p>
        </div>
      </div>
    );
  }

  const userInitial = user?.full_name?.charAt(0).toUpperCase() || 'U';
  const firstName = user?.full_name?.split(' ')[0] || 'Member';

  return (
    <div className="dashboard-editorial-page container fade-in">
      {/* ── Dashboard Header ── */}
      <header className="dashboard-hero-header">
        <div className="dash-user-identity">
          <div className="dash-avatar-large">
            {userInitial}
          </div>
          <div>
            <div className="dash-welcome-row">
              <span className="eyebrow">Customer Portal</span>
              {user?.role === 'admin' && <span className="dash-role-badge">Admin Access</span>}
            </div>
            <h1 className="dash-greeting">Welcome back, {firstName}</h1>
            <p className="dash-email-caption">{user?.email}</p>
          </div>
        </div>

        <Link to="/profile" className="dash-edit-profile-btn">
          <FiUser />
          <span>Edit Profile</span>
        </Link>
      </header>

      {/* ── Key Stat Cards ── */}
      <div className="dash-stats-grid">
        <div className="dash-stat-tile">
          <div className="stat-icon-wrapper">
            <FiPackage />
          </div>
          <div className="stat-text-group">
            <strong className="stat-metric-val">{stats.orders}</strong>
            <span className="stat-metric-label">Total Orders Placed</span>
          </div>
          <Link to="/orders" className="stat-tile-link" aria-label="View order history">
            <FiArrowRight />
          </Link>
        </div>

        <div className="dash-stat-tile">
          <div className="stat-icon-wrapper">
            <FiHeart />
          </div>
          <div className="stat-text-group">
            <strong className="stat-metric-val">{stats.wishlist}</strong>
            <span className="stat-metric-label">Saved in Wishlist</span>
          </div>
          <Link to="/wishlist" className="stat-tile-link" aria-label="View saved wishlist">
            <FiArrowRight />
          </Link>
        </div>

        <div className="dash-stat-tile">
          <div className="stat-icon-wrapper">
            <FiShoppingBag />
          </div>
          <div className="stat-text-group">
            <strong className="stat-metric-val">{user?.role === 'admin' ? 'Store Administrator' : 'Gen-Z Insider'}</strong>
            <span className="stat-metric-label">Member Tier</span>
          </div>
          <span className="stat-tier-tag">Active</span>
        </div>
      </div>

      {/* ── Main Dashboard Split ── */}
      <div className="dash-sections-layout">
        {/* Recent Orders Section */}
        <section className="dash-card-section">
          <div className="dash-card-head">
            <div>
              <h2 className="dash-card-title">Recent Orders</h2>
              <p className="dash-card-subtitle">Track delivery progress of your latest purchases</p>
            </div>
            <Link to="/orders" className="dash-view-all-link">
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="dash-empty-activity">
              <FiClock className="empty-clock" />
              <p>No recent orders found. Discover new arrivals in the shop.</p>
              <Link to="/products" className="btn-primary">
                <span>Shop New Drops</span>
                <FiArrowRight />
              </Link>
            </div>
          ) : (
            <div className="dash-orders-table">
              {recentOrders.map((order) => {
                const dateStr = new Date(order.created_at).toLocaleDateString('en-PK', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                return (
                  <div key={order._id} className="dash-order-row">
                    <div className="dash-order-main">
                      <span className="dash-order-ref">#{order._id?.slice(-8).toUpperCase()}</span>
                      <span className="dash-order-date">{dateStr}</span>
                    </div>

                    <span className={`oh-status-badge status-${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>

                    <span className="dash-order-amount">{money(order.total_price)}</span>

                    <Link to={`/order-confirmation/${order._id}`} className="dash-order-action-link">
                      <span>Receipt</span>
                      <FiExternalLink />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Shortcuts Section */}
        <aside className="dash-sidebar-section">
          <div className="dash-card-section">
            <h2 className="dash-card-title">Quick Actions</h2>
            <div className="dash-shortcuts-grid">
              <Link to="/profile" className="dash-shortcut-tile">
                <FiUser className="shortcut-icon" />
                <div>
                  <strong>Profile Settings</strong>
                  <span>Manage email & name</span>
                </div>
              </Link>

              <Link to="/wishlist" className="dash-shortcut-tile">
                <FiHeart className="shortcut-icon" />
                <div>
                  <strong>Saved Items</strong>
                  <span>View your wishlist</span>
                </div>
              </Link>

              <Link to="/orders" className="dash-shortcut-tile">
                <FiPackage className="shortcut-icon" />
                <div>
                  <strong>Track Shipments</strong>
                  <span>Check fulfillment state</span>
                </div>
              </Link>

              <Link to="/tryon" className="dash-shortcut-tile">
                <FiShoppingBag className="shortcut-icon" />
                <div>
                  <strong>AI Try-On Studio</strong>
                  <span>Virtual outfit preview</span>
                </div>
              </Link>

              {user?.role === 'admin' && (
                <Link to="/admin" className="dash-shortcut-tile admin-highlight">
                  <FiShield className="shortcut-icon" />
                  <div>
                    <strong>Admin Control Center</strong>
                    <span>Manage products & orders</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
