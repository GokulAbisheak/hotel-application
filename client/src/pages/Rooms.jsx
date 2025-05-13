import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StripeProvider from "../components/StripeProvider";
import PaymentForm from "../components/PaymentForm";
import { createBookingPaymentIntent, confirmPayment } from "../api/payments";
import { roomsAPI } from "../api/rooms";
import "./Rooms.css";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDates, setBookingDates] = useState({
    checkIn: "",
    checkOut: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, [bookingDates]);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms(rooms.filter((room) => room.name === selectedCategory));
    }
  }, [selectedCategory, rooms]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!(bookingDates?.checkIn && bookingDates?.checkOut)) {
        setError("Please select check in and check out date");
        return;
      }

      setError(null);
      const data = await roomsAPI.getAllRoomsForUser(
        bookingDates.checkIn,
        bookingDates.checkOut
      );
      setRooms(data);
      setFilteredRooms(data);

      // Extract unique categories
      const uniqueCategories = [
        "All",
        ...new Set(data.map((room) => room.name).filter(Boolean)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError("Failed to fetch rooms. Please try again.");
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

    if (name === "checkIn") {
      if (selectedDate < today) {
        setDateError("Check-in date cannot be in the past");
        return;
      }
      setDateError("");
      setBookingDates({
        ...bookingDates,
        [name]: value,
        checkOut: value > bookingDates.checkOut ? value : bookingDates.checkOut,
      });
    } else {
      if (selectedDate < new Date(bookingDates.checkIn)) {
        setDateError("Check-out date must be after check-in date");
        return;
      }
      setDateError("");
      setBookingDates({
        ...bookingDates,
        [name]: value,
      });
    }
  };

  const handleBooking = async (roomId) => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) {
      setDateError("Please select both check-in and check-out dates");
      return;
    }

    if (dateError) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to make a booking");
      navigate("/login");
      return;
    }

    try {
      const selectedRoom = rooms.find((room) => room._id === roomId);
      if (!selectedRoom) throw new Error("Room not found");

      const checkInDate = new Date(bookingDates.checkIn);
      const checkOutDate = new Date(bookingDates.checkOut);
      const nights = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
      );
      const totalAmount = nights * selectedRoom.price;

      const bookingResponse = await roomsAPI.createBooking({
        roomId,
        checkIn: bookingDates.checkIn,
        checkOut: bookingDates.checkOut,
        totalAmount,
      });

      setBookingData(bookingResponse);
      setSelectedRoom(selectedRoom);

      const paymentData = await createBookingPaymentIntent({
        bookingId: bookingResponse._id,
      });

      setClientSecret(paymentData.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error("Error preparing booking:", error);
      if (error.response?.status === 401) {
        alert("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        const errorMessage =
          error.response?.data?.message || "Failed to prepare booking.";
        alert(errorMessage);
      }
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      await confirmPayment({
        paymentIntentId: paymentIntent.id,
        type: "booking",
        id: bookingData._id,
      });

      alert("Booking successful!");
      navigate("/my-bookings");
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("Failed to confirm payment. Please try again.");
    }
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    alert("Payment failed. Please try again.");
    setShowPayment(false);
  };

  if (isLoading)
    return (
      <div className="rooms-container">
        <h2>Loading rooms...</h2>
      </div>
    );

  return (
    <div className="rooms-container">
      <h1>Available Rooms</h1>

      {error ? (
        <div className="rooms-container">
          <p className="">{error}</p>
        </div>
      ) : (
        <></>
      )}

      <div className="filters-section w-full">
        <div className="booking-dates w-full">
          <div className="date-input">
            <label htmlFor="checkIn">Check-in Date:</label>
            <input
              type="date"
              id="checkIn"
              name="checkIn"
              value={bookingDates.checkIn}
              onChange={handleDateChange}
              min={new Date().toISOString().split("T")[0]}
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
              min={
                bookingDates.checkIn || new Date().toISOString().split("T")[0]
              }
            />
          </div>

          <div className="category-filter">
            <label htmlFor="category">Filter by Category:</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
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
        {filteredRooms.map((room) => (
          <div key={room._id} className="room-card">
            <img
              src={
                room.image
                  ? `http://localhost:4000${room.image}`
                  : "/default-room.jpg"
              }
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
                disabled={
                  !bookingDates.checkIn || !bookingDates.checkOut || !!dateError
                }
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
