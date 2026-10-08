import { useState } from 'react';
import { FiUser, FiMail, FiSave } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import API from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put('/auth/profile', { full_name: name, email });
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="profile-page container">
      <div className="profile-card">
        <div className="profile-avatar">
          <span>{user?.full_name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <h1>My Profile</h1>
        <p className="role-badge">{user?.role}</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FiUser className="input-icon" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required />
          </div>
          <div className="input-group">
            <FiMail className="input-icon" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
          </div>
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Saving...' : <><FiSave /> Save Changes</>}
          </button>
        </form>
        <p className="joined">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
