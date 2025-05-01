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

  //create room
  createRoom: async (roomData) => {
    try {
      const response = await api.post('/rooms', roomData);
      return response.data;
    } catch (error) {
      console.error("Error creating room:", error);
      throw error.response?.data || error;
    }
  },

  //bulk create rooms
  bulkCreateRooms: async (roomsData) => {
    const formData = new FormData();
    
    // Append rooms data
    roomsData.forEach((room, index) => {
      formData.append('rooms', JSON.stringify(room));
      if (room.image) {
        formData.append('images', room.image);
      }
    });

    const response = await api.post('/rooms/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  //update room
  updateRoom: async (roomId, roomData) => {
    try {
      const response = await api.put(`/rooms/${roomId}`, roomData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error updating room:", error);
      throw error.response?.data || error;
    }
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

  //get all bookings (admin)
  getAllBookings: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/bookings', {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      throw error.response?.data || error;
    }
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
    try {
      const response = await api.delete(`/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting booking:", error);
      throw error.response?.data || error;
    }
  },

  //delete room
  deleteRoom: async (roomId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting room:", error);
      throw error.response?.data || error;
    }
  },

  // User Management
  getAllUsers: async () => {
    try {
      const response = await api.get('/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error.response?.data || error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error.response?.data || error;
    }
  }
}; 