import { useState, useEffect } from 'react';
import { FiTrash2, FiUserCheck, FiUserX, FiShield, FiUser } from 'react-icons/fi';
import API from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Admin.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    API.get('/admin/users')
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const toggleStatus = async (id, current) => {
    try {
      await API.put(`/admin/users/${id}`, { status: !current });
      toast.success('User status updated!');
      fetchUsers();
    } catch {
      toast.error('Error updating user status');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      toast.success('User account removed!');
      fetchUsers();
    } catch {
      toast.error('Error deleting user');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Customer Directory</span>
          <h1>Manage Customer Accounts</h1>
          <p className="admin-header-sub">{users.length} registered accounts across the platform</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Account State</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const initial = u.full_name?.charAt(0)?.toUpperCase() || 'U';
              const dateStr = new Date(u.created_at).toLocaleDateString('en-PK', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <tr key={u._id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">{initial}</div>
                      <strong>{u.full_name}</strong>
                    </div>
                  </td>
                  <td><span className="admin-email-text">{u.email}</span></td>
                  <td>
                    <span className={`admin-role-pill ${u.role === 'admin' ? 'admin' : 'customer'}`}>
                      {u.role === 'admin' ? <FiShield /> : <FiUser />} {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-user-status ${u.status ? 'active' : 'suspended'}`}>
                      <span className="dot" /> {u.status ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td><span className="admin-date-text">{dateStr}</span></td>
                  <td className="actions">
                    <button
                      type="button"
                      onClick={() => toggleStatus(u._id, u.status)}
                      title={u.status ? 'Suspend account' : 'Reactivate account'}
                      aria-label="Toggle user status"
                    >
                      {u.status ? <><FiUserX /> Suspend</> : <><FiUserCheck /> Activate</>}
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteUser(u._id)}
                      title="Delete user"
                      aria-label="Delete user"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
