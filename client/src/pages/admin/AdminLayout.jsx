import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiUsers, FiShoppingBag, FiBarChart2,
  FiHome, FiMenu, FiX, FiCamera
} from 'react-icons/fi';
import './Admin.css';

const navItems = [
  { to: '/admin', end: true, icon: FiGrid, label: 'Dashboard' },
  { to: '/admin/products', icon: FiPackage, label: 'Products' },
  { to: '/admin/users', icon: FiUsers, label: 'Users' },
  { to: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
  { to: '/admin/analytics', icon: FiBarChart2, label: 'Analytics' },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
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
          <span className="admin-sidebar-badge">Admin</span>
          <h2>Control Panel</h2>
          <p>Manage store, orders & insights</p>
        </div>

        <nav className="admin-sidebar-nav">
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
          <Link to="/tryon" className="admin-side-link subtle" onClick={() => setOpen(false)}>
            <FiCamera /> <span>Try On Studio</span>
          </Link>
          <Link to="/" className="admin-side-link subtle" onClick={() => setOpen(false)}>
            <FiHome /> <span>Back to Store</span>
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
