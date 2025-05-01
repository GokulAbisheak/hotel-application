import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : '';
};

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  config.headers.Authorization = getAuthToken();
  return config;
});

export const usersAPI = {
  // Get all users
  getAllUsers: async (page = 1, limit = 10, search = '') => {
    try {
      const response = await api.get('/users', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single user
  getUser: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Toggle user check-in status
  toggleCheckIn: async (userId) => {
    try {
      const response = await api.put(`/users/${userId}/check-in`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Register new user
  registerUser: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
}; 