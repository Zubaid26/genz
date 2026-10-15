import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './Auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    if (!name.trim()) next.name = 'Full legal name is required';
    if (!email.trim()) next.email = 'Email address is required';
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
      toast.success('Account created successfully! Welcome to Gen-Z Threads.');
      navigate('/');
    } catch (err) {
      toast.error(apiMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-editorial-page">
      <div className="auth-editorial-card">
        <div className="auth-brand-badge">
          <img src="/logo.png" alt="Gen-Z Threads" className="auth-logo-img" />
          <span className="auth-brand-word">GEN-Z THREADS</span>
        </div>

        <div className="auth-header-block">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Join Gen-Z Threads to save your favorites, track orders, and get member perks.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="auth-form-body">
          <div className="auth-field">
            <label htmlFor="reg-name">Full Legal Name</label>
            <div className="auth-input-container">
              <FiUser className="auth-input-icon" />
              <input
                id="reg-name"
                type="text"
                placeholder="Asia Parveen"
                value={name}
                className={errors.name ? 'invalid' : ''}
                aria-invalid={!!errors.name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Email Address</label>
            <div className="auth-input-container">
              <FiMail className="auth-input-icon" />
              <input
                id="reg-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                className={errors.email ? 'invalid' : ''}
                aria-invalid={!!errors.email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">Password (Minimum 6 Characters)</label>
            <div className="auth-input-container">
              <FiLock className="auth-input-icon" />
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={password}
                className={errors.password ? 'invalid' : ''}
                aria-invalid={!!errors.password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
          </div>

          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            <span>{loading ? 'Creating Account…' : 'Create Member Account'}</span>
            <FiArrowRight />
          </button>
        </form>

        <div className="auth-footer-prompt">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-switch-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
