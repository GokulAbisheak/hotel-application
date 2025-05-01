import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import authAPI from '../api/auth';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nic: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  //handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  //validate NIC format
  const validateNIC = (nic) => {
    // Sri Lankan NIC format: 9 digits followed by 'v' or 'x', or 12 digits
    const nicRegex = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
    return nicRegex.test(nic);
  };

  //validate phone number format
  const validatePhoneNumber = (phone) => {
    // Sri Lankan phone number format: +94 or 0 followed by 9 digits
    const phoneRegex = /^(\+94|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  //register function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    //validate form data
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.nic || !formData.phoneNumber) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    //check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    //check if password is at least 6 characters long
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    //validate NIC format
    if (!validateNIC(formData.nic)) {
      setError('Invalid NIC Number. Please enter a valid NIC number');
      setIsLoading(false);
      return;
    }

    //validate phone number format
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Invalid phone number. Please enter a valid phone number');
      setIsLoading(false);
      return;
    }

    //register user
    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        nic: formData.nic,
        phoneNumber: formData.phoneNumber
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/rooms');
    } catch (error) {
      console.error('Registration error details:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-container">
        <h1>Create Account</h1>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nic">NIC Number</label>
              <input
                type="text"
                id="nic"
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                placeholder="Enter your NIC number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" className="register-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="login-link">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')}>
              Sign in here
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 