import api from './axios';

export const authAPI = {
  //login function
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login API Error:', error.response?.data);
      throw error;
    }
  },

  //register function
  register: async (userData) => {
    try {
      // Log the data being sent
      console.log('Register API - Sending data:', userData);

      // Validate required fields
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('All fields are required');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format');
      }

      // Basic password validation
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await api.post('/auth/register', userData);
      console.log('Register API - Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Register API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  //logout function
  logout: () => {
    localStorage.removeItem('token');
  }
}; 