import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MakeReservation.css';
import { roomsAPI } from '../../api/rooms';
import { usersAPI } from '../../api/users';

const MakeReservation = () => {
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [bookingDates, setBookingDates] = useState({
        checkIn: '',
        checkOut: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateError, setDateError] = useState('');
    const [bookingData, setBookingData] = useState(null);
    const [customer, setCustomer] = useState('');
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
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

    const handleUserChange = async (e) => {
        const value = e.target.value;
        setCustomer(value);

        if (value.length > 0) {
            try {
                const users = await usersAPI.searchUsers(value);
                setSuggestedUsers(users);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error searching users:', error);
                setSuggestedUsers([]);
            }
        } else {
            setSuggestedUsers([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (user) => {
        setCustomer(user);
        setShowSuggestions(false);
    };

    //handle booking
    const handleBooking = async (roomId) => {
        console.log('Starting booking process...');
        console.log('Current state:', {
            roomId,
            bookingDates,
            customer,
            dateError
        });

        if (!bookingDates.checkIn || !bookingDates.checkOut) {
            console.log('Validation failed: Missing dates');
            setDateError('Please select both check-in and check-out dates');
            return;
        }

        if (dateError) {
            console.log('Validation failed: Date error exists');
            return;
        }

        if (!customer) {
            alert('Please select a customer');
            return;
        }

        try {
            console.log('Finding selected room...');
            // Find the selected room to get its price
            const selectedRoom = rooms.find(room => room._id === roomId);
            if (!selectedRoom) {
                console.error('Room not found with ID:', roomId);
                throw new Error('Room not found');
            }
            console.log('Selected room:', selectedRoom);

            // Calculate total amount based on number of nights
            const checkInDate = new Date(bookingDates.checkIn);
            const checkOutDate = new Date(bookingDates.checkOut);
            let nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            if (nights <= 0) {
                nights = 1;
            }
            const totalAmount = nights * selectedRoom.price;
            
            console.log('Booking calculation:', {
                checkInDate,
                checkOutDate,
                nights,
                totalAmount
            });

            console.log('Creating booking with data:', {
                roomId,
                userId: customer._id,
                checkIn: bookingDates.checkIn,
                checkOut: bookingDates.checkOut,
                totalAmount
            });

            // Create booking first
            const bookingResponse = await roomsAPI.createManualBooking({
                roomId,
                userId: customer._id,
                checkIn: bookingDates.checkIn,
                checkOut: bookingDates.checkOut,
                totalAmount
            });

            console.log('Booking response:', bookingResponse);

            // Store booking data for later use
            setBookingData(bookingResponse);
            setSelectedRoom(selectedRoom);

            // Show success message
            alert(`Booking successful!\nRoom: ${selectedRoom.name}\nCheck-in: ${bookingDates.checkIn}\nCheck-out: ${bookingDates.checkOut}\nTotal Amount: LKR ${totalAmount}`);

        } catch (error) {
            console.error('Error in handleBooking:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            if (error.response?.status === 401) {
                alert('Failed to make reservation');
            } else {
                const errorMessage = error.response?.data?.message || 'Failed to prepare booking. Please try again.';
                alert(errorMessage);
            }
        }
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
            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
                <input
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
                    type="text"
                    placeholder="Search Customer"
                    value={customer.email}
                    onChange={handleUserChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && suggestedUsers.length > 0 && (
                    <ul style={{ listStyleType: 'none', padding: '0', margin: '0', position: 'absolute', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', zIndex: '1000' }}>
                        {suggestedUsers.map((user) => (
                            <li
                                key={user._id}
                                onClick={() => handleSuggestionClick(user)}
                                style={{ padding: '10px', borderBottom: '1px solid #ccc', cursor: 'pointer' }}
                            >
                                {user.email} - {user.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
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

export default MakeReservation; 