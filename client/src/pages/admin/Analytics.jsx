import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FiDollarSign, FiUsers, FiPackage, FiShoppingBag } from 'react-icons/fi';
import API from '../../utils/axiosInstance';
import './Admin.css';
import { money } from '../../utils/currency';

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const tooltipStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: 12,
  color: 'var(--text-color)',
  boxShadow: 'var(--shadow-md)',
  fontSize: '0.85rem'
};

export default function Analytics() {
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);

  useEffect(() => {
    API.get('/admin/analytics/sales').then((res) => setSales(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    API.get('/admin/analytics/products').then((res) => setTopProducts(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    API.get('/admin/analytics/users').then((res) => setUserGrowth(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    API.get('/admin/analytics/orders').then((res) => setOrderStatus(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const salesData = sales.map((s) => ({
    month: s._id,
    revenue: s.revenue || 0,
    orders: s.count || 0,
  }));
  const usersData = userGrowth.map((u) => ({ month: u._id, users: u.count }));
  const productsData = topProducts.map((p) => ({
    name: p.product?.name || 'Item',
    sold: p.totalSold || 0,
    revenue: p.totalRevenue || 0,
  }));

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Data Intelligence</span>
          <h1>Store Performance Analytics</h1>
          <p className="admin-header-sub">In-depth revenue trends, volume, retention & inventory velocity</p>
        </div>
      </div>

      <div className="charts-grid">
        {/* Monthly Revenue */}
        <div className="chart-card">
          <h3><FiDollarSign /> Gross Monthly Revenue</h3>
          {salesData.length === 0 ? (
            <div className="chart-empty">No revenue history recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="analyticsRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fill="url(#analyticsRev)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders Volume */}
        <div className="chart-card">
          <h3><FiShoppingBag /> Order Volume by Month</h3>
          {salesData.length === 0 ? (
            <div className="chart-empty">No order volume data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Growth */}
        <div className="chart-card">
          <h3><FiUsers /> Customer Registrations</h3>
          {usersData.length === 0 ? (
            <div className="chart-empty">No customer growth data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={usersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="chart-card">
          <h3><FiShoppingBag /> Order Fulfillment Mix</h3>
          {orderStatus.length === 0 ? (
            <div className="chart-empty">No status mix recorded</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label
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

        {/* Top 5 Products */}
        <div className="chart-card full">
          <h3><FiPackage /> Top 5 Selling Apparel Lines</h3>
          {productsData.length === 0 ? (
            <div className="chart-empty">No product velocity data</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productsData} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={140} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="sold" name="Units Dispatched" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                <Bar dataKey="revenue" name="Total Revenue (PKR)" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
