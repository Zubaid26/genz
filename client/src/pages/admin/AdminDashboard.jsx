import { useState, useEffect } from 'react';
import {
  FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiAlertTriangle, FiTrendingUp
} from 'react-icons/fi';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import API from '../../utils/axiosInstance';
import './Admin.css';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#a855f7', '#22c55e', '#ef4444'];

const tooltipStyle = {
  background: 'var(--bg-color)',
  border: '1px solid var(--card-border)',
  borderRadius: 8,
  color: 'var(--text-color)',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/analytics/sales'),
      API.get('/admin/analytics/products'),
      API.get('/admin/analytics/users'),
      API.get('/admin/analytics/orders'),
    ])
      .then(([statsRes, salesRes, productsRes, usersRes, ordersRes]) => {
        setStats(statsRes.data);
        setSales(salesRes.data || []);
        setTopProducts(productsRes.data || []);
        setUserGrowth(usersRes.data || []);
        setOrderStatus(ordersRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="admin-page"><p>Loading dashboard...</p></div>;
  }

  const salesData = sales.map((s) => ({
    month: s._id,
    revenue: Number(s.revenue?.toFixed?.(2) ?? s.revenue) || 0,
    orders: s.count || 0,
  }));
  const usersData = userGrowth.map((u) => ({ month: u._id, users: u.count }));
  const productsData = topProducts.map((p) => ({
    name: p.product?.name || 'Unknown',
    sold: p.totalSold || 0,
  }));

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Dashboard</h1>
          <p className="admin-header-sub">Overview of store performance and inventory</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiUsers className="stat-icon" />
          <div>
            <p className="stat-value">{stats?.totalUsers || 0}</p>
            <p className="stat-label">Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <FiShoppingBag className="stat-icon" />
          <div>
            <p className="stat-value">{stats?.totalOrders || 0}</p>
            <p className="stat-label">Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <FiDollarSign className="stat-icon" />
          <div>
            <p className="stat-value">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
            <p className="stat-label">Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <FiPackage className="stat-icon" />
          <div>
            <p className="stat-value">{stats?.totalProducts || 0}</p>
            <p className="stat-label">Products</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><FiTrendingUp /> Monthly Revenue</h3>
          {salesData.length === 0 ? (
            <div className="chart-empty">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent-primary)"
                  fill="url(#revFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3><FiShoppingBag /> Orders by Status</h3>
          {orderStatus.length === 0 ? (
            <div className="chart-empty">No order data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {orderStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3><FiUsers /> User Growth</h3>
          {usersData.length === 0 ? (
            <div className="chart-empty">No registration data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={usersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3><FiPackage /> Top Selling Products</h3>
          {productsData.length === 0 ? (
            <div className="chart-empty">No product sales yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={productsData} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sold" fill="#22c55e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {stats?.lowStock?.length > 0 && (
        <div className="low-stock-alert">
          <h3><FiAlertTriangle /> Low Stock Alert</h3>
          <div className="low-stock-list">
            {stats.lowStock.map((p) => (
              <div key={p._id} className="low-stock-item">
                <span>{p.name}</span>
                <span className="stock-count">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
