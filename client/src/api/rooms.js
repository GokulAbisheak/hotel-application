import api from './axios';

const token = localStorage.getItem('token');

export const roomsAPI = {
  //get all rooms
  getAllRooms: async () => {
    const response = await api.get('/rooms');
    return response.data;
  },

  //get room by id
  getRoomById: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  //create booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  //get user bookings
  getUserBookings: async () => {
    const response = await api.get('/bookings/mybookings');
    return response.data;
  },

  //cancel booking
  cancelBooking: async (bookingId) => {
    const response = await api.put(`/bookings/${bookingId}`, { status: 'cancelled' });
    return response.data;
  },

  //update booking
  updateBooking: async (bookingId, bookingData) => {
    const response = await api.put(`/bookings/${bookingId}`, bookingData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  //delete booking
  deleteBooking: async (bookingId) => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  }
}; 