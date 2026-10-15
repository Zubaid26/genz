import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiUsers, FiShoppingBag, FiBarChart2,
  FiHome, FiMenu, FiX, FiShield
} from 'react-icons/fi';
import './Admin.css';

const navItems = [
  { to: '/admin', end: true, icon: FiGrid, label: 'Overview' },
  { to: '/admin/products', icon: FiPackage, label: 'Product Catalog' },
  { to: '/admin/orders', icon: FiShoppingBag, label: 'Fulfillment & Orders' },
  { to: '/admin/users', icon: FiUsers, label: 'Customer Accounts' },
  { to: '/admin/analytics', icon: FiBarChart2, label: 'Store Insights' },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      {/* Mobile Floating Toggle */}
      <button
        type="button"
        className="admin-sidebar-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle admin menu"
      >
        {open ? <FiX /> : <FiMenu />}
      </button>

      {open && <div className="admin-sidebar-backdrop" onClick={() => setOpen(false)} />}

      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-brand-top">
            <span className="admin-badge-pill">
              <FiShield /> Store Ops
            </span>
          </div>
          <h2 className="admin-panel-title">Admin Console</h2>
          <p className="admin-panel-sub">Manage products, orders & intelligence</p>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-side-link${isActive ? ' active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-side-link subtle" onClick={() => setOpen(false)}>
            <FiHome /> <span>Back to Storefront</span>
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
