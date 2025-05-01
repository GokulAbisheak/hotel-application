import api from './axios';

// Get all orders for the current user
export const getUserOrders = async () => {
  try {
    const response = await api.get('/orders/my-orders');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all orders
export const getOrders = async (page = 1, limit = 10, search = '', status = '') => {
  try {
    const response = await api.get('/orders', {
      params: { page, limit, search, status }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get a single order by ID
export const getOrder = async (id) => {
  try {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (id, status) => {
  try {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete order
export const deleteOrder = async (id) => {
  try {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 