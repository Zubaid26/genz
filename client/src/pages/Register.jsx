import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './Auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pick the most useful message out of an API error response
const apiMessage = (err, fallback) =>
  err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || fallback;

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Full name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(apiMessage(err, 'Registration failed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">⚡</span>
          <h1>Create Account</h1>
          <p>Join Gen-Z Threads today</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <FiUser className="input-icon" />
            <input type="text" placeholder="Full name" value={name}
              className={errors.name ? 'invalid' : ''} aria-invalid={!!errors.name}
              onChange={e => setName(e.target.value)} />
            {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
          </div>
          <div className="input-group">
            <FiMail className="input-icon" />
            <input type="email" placeholder="Email address" value={email}
              className={errors.email ? 'invalid' : ''} aria-invalid={!!errors.email}
              onChange={e => setEmail(e.target.value)} />
            {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type="password" placeholder="Password (min 6 chars)" value={password}
              className={errors.password ? 'invalid' : ''} aria-invalid={!!errors.password}
              onChange={e => setPassword(e.target.value)} />
            {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating...' : <><FiUserPlus /> Sign Up</>}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
