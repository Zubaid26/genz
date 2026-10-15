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
import { money } from '../../utils/currency';

const CHART_PALETTE = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const tooltipStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: 12,
  color: 'var(--text-color)',
  boxShadow: 'var(--shadow-md)',
  fontSize: '0.85rem'
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
    return (
      <div className="admin-page">
        <div className="admin-loading-box">
          <p>Compiling store analytics…</p>
        </div>
      </div>
    );
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
          <span className="eyebrow">Store Intelligence</span>
          <h1>Store Overview</h1>
          <p className="admin-header-sub">Real-time metrics, order fulfillment, and stock status</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap">
            <FiDollarSign />
          </div>
          <div className="stat-info-col">
            <p className="stat-value">{money(stats?.totalRevenue)}</p>
            <p className="stat-label">Total Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <FiShoppingBag />
          </div>
          <div className="stat-info-col">
            <p className="stat-value">{stats?.totalOrders || 0}</p>
            <p className="stat-label">Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <FiPackage />
          </div>
          <div className="stat-info-col">
            <p className="stat-value">{stats?.totalProducts || 0}</p>
            <p className="stat-label">Active Catalog Items</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap">
            <FiUsers />
          </div>
          <div className="stat-info-col">
            <p className="stat-value">{stats?.totalUsers || 0}</p>
            <p className="stat-label">Registered Customers</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><FiTrendingUp /> Monthly Revenue Trend</h3>
          {salesData.length === 0 ? (
            <div className="chart-empty">No sales data recorded yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  fill="url(#revFill)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3><FiShoppingBag /> Orders by Fulfillment Status</h3>
          {orderStatus.length === 0 ? (
            <div className="chart-empty">No order distribution data yet</div>
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
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {orderStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3><FiUsers /> Customer Registrations</h3>
          {usersData.length === 0 ? (
            <div className="chart-empty">No registration records found</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={usersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="users" fill="#4f46e5" radius={[6, 6, 0, 0]} />
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
              <BarChart data={productsData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sold" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {stats?.lowStock?.length > 0 && (
        <div className="low-stock-alert">
          <h3><FiAlertTriangle /> Low Inventory Warning ({stats.lowStock.length} items)</h3>
          <div className="low-stock-list">
            {stats.lowStock.map((p) => (
              <div key={p._id} className="low-stock-item">
                <span className="ls-name">{p.name}</span>
                <span className="stock-count">{p.stock} units left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
