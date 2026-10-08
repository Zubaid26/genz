import { useState, useEffect } from 'react';
import API from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Admin.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = () => {
    API.get('/admin/users').then(res => setUsers(res.data)).catch(() => {});
  };

  const toggleStatus = async (id, current) => {
    try {
      await API.put(`/admin/users/${id}`, { status: !current });
      toast.success('User status updated!'); fetchUsers();
    } catch { toast.error('Error'); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await API.delete(`/admin/users/${id}`); toast.success('User deleted!'); fetchUsers(); }
    catch { toast.error('Error'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Manage Users</h1>
          <p className="admin-header-sub">View accounts, suspend, or remove users</p>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>
                  <span style={{
                    padding: '2px 10px', borderRadius: 6,
                    background: u.role === 'admin' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                    color: u.role === 'admin' ? '#a855f7' : '#3b82f6',
                    fontSize: '0.8rem', fontWeight: 600
                  }}>{u.role}</span>
                </td>
                <td><span style={{ color: u.status ? '#22c55e' : '#ef4444' }}>{u.status ? 'Active' : 'Suspended'}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="actions">
                  <button onClick={() => toggleStatus(u._id, u.status)}>
                    {u.status ? 'Suspend' : 'Activate'}
                  </button>
                  <button className="delete-btn" onClick={() => deleteUser(u._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
