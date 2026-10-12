import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './Auth.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pick the most useful message out of an API error response
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
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">⚡</span>
          <h1>Welcome Back</h1>
          <p>Sign in to your Gen-Z Threads account</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <FiMail className="input-icon" />
            <input type="email" placeholder="Email address" value={email}
              className={errors.email ? 'invalid' : ''} aria-invalid={!!errors.email}
              onChange={e => setEmail(e.target.value)} />
            {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type="password" placeholder="Password" value={password}
              className={errors.password ? 'invalid' : ''} aria-invalid={!!errors.password}
              onChange={e => setPassword(e.target.value)} />
            {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : <><FiLogIn /> Sign In</>}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
