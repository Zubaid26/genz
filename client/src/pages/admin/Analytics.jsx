import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FiDollarSign, FiUsers, FiPackage, FiShoppingBag } from 'react-icons/fi';
import API from '../../utils/axiosInstance';
import './Admin.css';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#a855f7', '#22c55e', '#ef4444'];
const tooltipStyle = {
  background: 'var(--bg-color)',
  border: '1px solid var(--card-border)',
  borderRadius: 8,
  color: 'var(--text-color)',
};

export default function Analytics() {
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);

  useEffect(() => {
    API.get('/admin/analytics/sales').then((res) => setSales(res.data)).catch(() => {});
    API.get('/admin/analytics/products').then((res) => setTopProducts(res.data)).catch(() => {});
    API.get('/admin/analytics/users').then((res) => setUserGrowth(res.data)).catch(() => {});
    API.get('/admin/analytics/orders').then((res) => setOrderStatus(res.data)).catch(() => {});
  }, []);

  const salesData = sales.map((s) => ({
    month: s._id,
    revenue: s.revenue || 0,
    orders: s.count || 0,
  }));
  const usersData = userGrowth.map((u) => ({ month: u._id, users: u.count }));
  const productsData = topProducts.map((p) => ({
    name: p.product?.name || 'N/A',
    sold: p.totalSold || 0,
    revenue: p.totalRevenue || 0,
  }));

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Analytics</h1>
          <p className="admin-header-sub">Detailed sales, users, and product insights</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3><FiDollarSign /> Monthly Revenue</h3>
          {salesData.length === 0 ? (
            <div className="chart-empty">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="analyticsRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent-primary)" fill="url(#analyticsRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3><FiShoppingBag /> Orders per Month</h3>
          {salesData.length === 0 ? (
            <div className="chart-empty">No order data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3><FiUsers /> User Registrations</h3>
          {usersData.length === 0 ? (
            <div className="chart-empty">No registration data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={usersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3><FiShoppingBag /> Order Status Mix</h3>
          {orderStatus.length === 0 ? (
            <div className="chart-empty">No order status data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
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

        <div className="chart-card full">
          <h3><FiPackage /> Top 5 Selling Products</h3>
          {productsData.length === 0 ? (
            <div className="chart-empty">No product sales yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productsData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="sold" name="Units sold" fill="#22c55e" radius={[0, 6, 6, 0]} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--accent-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
