import api from './axios';

// Create payment intent for booking
export const createBookingPaymentIntent = async ({ bookingId }) => {
  try {
    const response = await api.post('/payments/booking-intent', { bookingId });
    return {
      clientSecret: response.data.clientSecret,
      amount: response.data.amount
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create payment intent');
  }
};

// Create payment intent for order
export const createOrderPaymentIntent = async ({ orderId }) => {
  try {
    const response = await api.post('/payments/order-intent', { orderId });
    return {
      clientSecret: response.data.clientSecret,
      amount: response.data.amount
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create payment intent');
  }
};

// Confirm payment and update status
export const confirmPayment = async ({ paymentIntentId, type, id }) => {
  try {
    const response = await api.post('/payments/confirm', {
      paymentIntentId,
      type,
      id
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to confirm payment');
  }
}; 