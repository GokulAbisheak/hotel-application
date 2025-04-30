import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { authAPI } from '../api/auth';
import Footer from '../components/Footer'; // ✅ Added Footer

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.token);
      window.location.href = '/rooms';
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between">
      <div className="auth-page flex-grow">
        <div className="auth-container">
          <form onSubmit={handleSubmit} className="auth-form">
            <h2>Welcome Back</h2>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            <p>
              Don't have an account?{' '}
              <span onClick={() => navigate('/register')} className="auth-link">
                Create one now
              </span>
            </p>
          </form>
        </div>
      </div>
      <Footer /> {/* ✅ Footer added here */}
    </div>
  );
};

export default Login;
