import api from './axios';

// Get all foods
export const getFoods = async (page = 1, limit = 10, search = '', category = '') => {
  try {
    const response = await api.get('/foods', {
      params: { page, limit, search, category }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get single food
export const getFood = async (id) => {
  try {
    const response = await api.get(`/foods/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create food
export const createFood = async (foodData) => {
  try {
    const response = await api.post('/foods', foodData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update food
export const updateFood = async (id, foodData) => {
  try {
    const response = await api.put(`/foods/${id}`, foodData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete food
export const deleteFood = async (id) => {
  try {
    const response = await api.delete(`/foods/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 