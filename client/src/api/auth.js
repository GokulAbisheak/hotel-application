import api from './axios';

// Get current user
export const getUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Register user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};

const authAPI = {
  getUser,
  login,
  register,
  logout
};

export default authAPI;
