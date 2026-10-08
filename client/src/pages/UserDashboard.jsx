import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiHeart, FiUser, FiSettings, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import API from '../utils/axiosInstance';
import './UserDashboard.css';

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
        setStats({
          orders: ordersRes.data.length,
          wishlist: wishlistRes.data.length
        });
        setRecentOrders(ordersRes.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-screen">Loading your dashboard...</div>;

  return (
    <div className="dashboard-page container fade-in">
      <header className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span>! 👋</h1>
          <p>Here's what's happening with your account today.</p>
        </div>
        <Link to="/profile" className="profile-quick-link">
          <div className="avatar-small">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <span>Edit Profile</span>
        </Link>
      </header>

      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stats-row">
          <div className="d-stat-card">
            <div className="stat-icon-wrapper blue">
              <FiPackage />
            </div>
            <div className="stat-info">
              <h3>{stats.orders}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="d-stat-card">
            <div className="stat-icon-wrapper pink">
              <FiHeart />
            </div>
            <div className="stat-info">
              <h3>{stats.wishlist}</h3>
              <p>In Wishlist</p>
            </div>
          </div>
          <div className="d-stat-card">
            <div className="stat-icon-wrapper purple">
              <FiShoppingBag />
            </div>
            <div className="stat-info">
              <p>Member Level</p>
              <h3>{user?.role === 'admin' ? 'Elite Admin' : 'Style Icon'}</h3>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-main">
          <section className="dashboard-section recent-orders">
            <div className="section-title">
              <h2>Recent Orders</h2>
              <Link to="/orders">View All <FiArrowRight /></Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="d-empty">
                <p>No orders yet. Time for a refresh?</p>
                <Link to="/products" className="btn-primary">Shop Collection</Link>
              </div>
            ) : (
              <div className="d-orders-list">
                {recentOrders.map(order => (
                  <div key={order._id} className="d-order-item">
                    <div className="order-main-info">
                      <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="order-meta">
                      <span className={`status-pill ${order.status.toLowerCase()}`}>{order.status}</span>
                      <span className="order-price">${order.total_price.toFixed(2)}</span>
                    </div>
                    <Link to={`/order-confirmation/${order._id}`} className="view-btn">Details</Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section quick-actions">
            <h2>Account Actions</h2>
            <div className="actions-grid">
              <Link to="/profile" className="action-card">
                <FiUser />
                <span>Personal Info</span>
              </Link>
              <Link to="/wishlist" className="action-card">
                <FiHeart />
                <span>My Wishlist</span>
              </Link>
              <Link to="/orders" className="action-card">
                <FiPackage />
                <span>Order History</span>
              </Link>
              <Link to="/profile" className="action-card">
                <FiSettings />
                <span>Settings</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
