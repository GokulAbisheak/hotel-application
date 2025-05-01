import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StripeProvider from '../components/StripeProvider';
import PaymentForm from '../components/PaymentForm';
import { createBookingPaymentIntent } from '../api/payments';
import './Rooms.css';
import { roomsAPI } from '../api/rooms';
import { confirmPayment } from '../api/payments';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const navigate = useNavigate();

  //fetch rooms on load
  useEffect(() => {
    fetchRooms();
  }, []);

  //fetch rooms
  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await roomsAPI.getAllRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to fetch rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(value);
    selectedDate.setHours(0, 0, 0, 0);

    if (name === 'checkIn') {
      if (selectedDate < today) {
        setDateError('Check-in date cannot be in the past');
        return;
      }
      setDateError('');
      setBookingDates({
        ...bookingDates,
        [name]: value,
        checkOut: value > bookingDates.checkOut ? value : bookingDates.checkOut
      });
    } else {
      if (selectedDate < new Date(bookingDates.checkIn)) {
        setDateError('Check-out date must be after check-in date');
        return;
      }
      setDateError('');
      setBookingDates({
        ...bookingDates,
        [name]: value
      });
    }
  };

  //handle booking
  const handleBooking = async (roomId) => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      setDateError('Please select both check-in and check-out dates');
      return;
    }

    if (dateError) {
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to make a booking');
      navigate('/login');
      return;
    }

    try {
      // Find the selected room to get its price
      const selectedRoom = rooms.find(room => room._id === roomId);
      if (!selectedRoom) {
        throw new Error('Room not found');
      }

      // Calculate total amount based on number of nights
      const checkInDate = new Date(bookingDates.checkIn);
      const checkOutDate = new Date(bookingDates.checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const totalAmount = nights * selectedRoom.price;

      // Create booking first
      const bookingResponse = await roomsAPI.createBooking({
        roomId,
        checkIn: bookingDates.checkIn,
        checkOut: bookingDates.checkOut,
        totalAmount
      });

      // Store booking data for later use
      setBookingData(bookingResponse);
      setSelectedRoom(selectedRoom);

      // Create payment intent with the booking ID
      const paymentData = await createBookingPaymentIntent({
        bookingId: bookingResponse._id
      });
      
      setClientSecret(paymentData.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error('Error preparing booking:', error);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to prepare booking. Please try again.';
        alert(errorMessage);
      }
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Confirm payment and update booking status
      await confirmPayment({
        paymentIntentId: paymentIntent.id,
        type: 'booking',
        id: bookingData._id
      });
      
      alert('Booking successful!');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to confirm payment. Please try again.';
      alert(errorMessage);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
    setShowPayment(false);
  };

  if (isLoading) {
    return <div className="rooms-container"><h2>Loading rooms...</h2></div>;
  }

  if (error) {
    return (
      <div className="rooms-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchRooms}>Retry</button>
      </div>
    );
  }

  return (
    <div className="rooms-container">
      <h1>Available Rooms</h1>
      
      <div className="booking-dates">
        <div className="date-input">
          <label htmlFor="checkIn">Check-in Date:</label>
          <input
            type="date"
            id="checkIn"
            name="checkIn"
            value={bookingDates.checkIn}
            onChange={handleDateChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="date-input">
          <label htmlFor="checkOut">Check-out Date:</label>
          <input
            type="date"
            id="checkOut"
            name="checkOut"
            value={bookingDates.checkOut}
            onChange={handleDateChange}
            min={bookingDates.checkIn || new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      {dateError && <div className="date-error">{dateError}</div>}

      {showPayment && clientSecret && (
        <div className="payment-modal">
          <div className="payment-modal-content">
            <h2>Complete Your Booking</h2>
            <p>Room: {selectedRoom.name}</p>
            <p>Total Amount: LKR {bookingData.totalAmount}</p>
            <StripeProvider>
              <PaymentForm
                amount={bookingData.totalAmount}
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </StripeProvider>
            <button 
              className="cancel-payment-button"
              onClick={() => setShowPayment(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room._id} className="room-card">
            <img 
              src={room.image ? `http://localhost:4000${room.image}` : '/default-room.jpg'} 
              alt={room.name} 
              className="room-image" 
            />
            <div className="room-details">
              <h3>{room.name}</h3>
              <p className="room-number">Room #{room.roomNumber}</p>
              <p className="room-description">{room.description}</p>
              <div className="room-features">
                <span>Capacity: {room.capacity} persons</span>
                <span>Price: {room.price} LKR/night</span>
              </div>
              <div className="room-amenities">
                {room.amenities.map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
              </div>
              <button
                className="book-button"
                onClick={() => handleBooking(room._id)}
                disabled={!bookingDates.checkIn || !bookingDates.checkOut || !!dateError}
              >
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rooms; 