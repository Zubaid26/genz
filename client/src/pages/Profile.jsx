import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiCheck, FiShield, FiCalendar } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import API from '../utils/axiosInstance';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(user?.created_at || null);

  useEffect(() => {
    API.get('/auth/profile')
      .then((res) => setJoined(res.data.created_at))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put('/auth/profile', { full_name: name, email });
      updateUser(res.data.user);
      toast.success('Profile details saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const initial = user?.full_name?.charAt(0)?.toUpperCase() || 'U';
  const joinDate = joined
    ? new Date(joined).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="profile-editorial-page container">
      <div className="profile-center-card">
        {/* Profile Avatar & Header */}
        <div className="profile-avatar-banner">
          <div className="profile-large-circle">
            {initial}
          </div>
          <div className="profile-headline-group">
            <h1 className="profile-name-title">{user?.full_name || 'My Profile'}</h1>
            <div className="profile-badge-row">
              <span className={`profile-role-pill ${user?.role === 'admin' ? 'admin' : ''}`}>
                <FiShield /> {user?.role === 'admin' ? 'Store Administrator' : 'Verified Member'}
              </span>
              {joinDate && (
                <span className="profile-joined-text">
                  <FiCalendar /> Joined {joinDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="profile-form-body">
          <div className="form-group">
            <label htmlFor="full_name">Full Legal Name</label>
            <div className="profile-input-wrap">
              <FiUser className="input-affix-icon" />
              <input
                id="full_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profile_email">Email Address</label>
            <div className="profile-input-wrap">
              <FiMail className="input-affix-icon" />
              <input
                id="profile_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary profile-save-btn" disabled={loading}>
            {loading ? 'Saving Changes…' : <><FiCheck /> Save Profile Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
