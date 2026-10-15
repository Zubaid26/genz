import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn, FiArrowRight } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './Auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const apiMessage = (err, fallback) =>
  err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || fallback;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(apiMessage(err, 'Login failed'));
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
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-sub">Sign in to access your bag, orders, and virtual fitting room.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="auth-form-body">
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <div className="auth-input-container">
              <FiMail className="auth-input-icon" />
              <input
                id="login-email"
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
            <label htmlFor="login-password">Password</label>
            <div className="auth-input-container">
              <FiLock className="auth-input-icon" />
              <input
                id="login-password"
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
            <span>{loading ? 'Authenticating…' : 'Sign In to Account'}</span>
            <FiArrowRight />
          </button>
        </form>

        <div className="auth-footer-prompt">
          <span>Don't have an account yet?</span>
          <Link to="/register" className="auth-switch-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
