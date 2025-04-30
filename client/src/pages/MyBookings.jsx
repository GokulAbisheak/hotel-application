import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../api/rooms';
import './MyBookings.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await roomsAPI.getUserBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to fetch bookings. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Updated Cancel Booking Function
  const handleCancelBooking = async (bookingId) => {
    const bookingToCancel = bookings.find((b) => b._id === bookingId);
    if (!bookingToCancel) {
      alert('Booking not found.');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await roomsAPI.updateBooking(bookingId, {
        checkIn: bookingToCancel.checkIn,
        checkOut: bookingToCancel.checkOut,
        totalPrice: bookingToCancel.totalPrice,
        status: 'cancelled',
      });
      alert('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error.response?.data?.message || 'Failed to cancel booking. Please try again.');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      await roomsAPI.deleteBooking(bookingId);
      alert('Booking deleted successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert(error.response?.data?.message || 'Failed to delete booking. Please try again.');
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking({
      ...booking,
      checkIn: new Date(booking.checkIn).toISOString().split('T')[0],
      checkOut: new Date(booking.checkOut).toISOString().split('T')[0]
    });
  };

  const calculateTotalPrice = (checkIn, checkOut, roomPrice) => {
    const days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    return days * roomPrice;
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newDates = {
      ...editingBooking,
      [name]: value
    };

    if (name === 'checkOut' && new Date(value) <= new Date(newDates.checkIn)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    const newTotalPrice = calculateTotalPrice(
      newDates.checkIn,
      newDates.checkOut,
      editingBooking.room.price
    );

    setEditingBooking({
      ...newDates,
      totalPrice: newTotalPrice
    });
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;

    try {
      await roomsAPI.updateBooking(editingBooking._id, {
        checkIn: editingBooking.checkIn,
        checkOut: editingBooking.checkOut,
        totalPrice: editingBooking.totalPrice
      });
      alert('Booking updated successfully');
      setEditingBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error.response?.data?.message || 'Failed to update booking. Please try again.');
    }
  };

  const downloadBookingPDF = (booking) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Hotel Booking Data', 105, 20, { align: 'center' });

    const tableColumn = ["Field", "Details"];

    const tableRows = [
      ["Room", booking.room.name || "-"],
      ["Status", booking.status || "-"],
      ["Check-in", new Date(booking.checkIn).toLocaleDateString()],
      ["Check-out", new Date(booking.checkOut).toLocaleDateString()],
      ["Total Price", `LKR ${booking.totalPrice}`],
      ["Booked On", new Date(booking.createdAt).toLocaleDateString()],
      ["Room Amenities", (booking.room.amenities && booking.room.amenities.length > 0)
        ? booking.room.amenities.join(", ")
        : "-"]
    ];

    autoTable(doc, {
      startY: 30,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 11, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      theme: 'striped'
    });

    doc.save(`booking-${booking._id}.pdf`);
  };

  const downloadAllBookingsPDF = () => {
    if (bookings.length === 0) {
      alert('No bookings to download');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Hotel Booking Data', 14, 16);

    const tableColumn = [
      "No.",
      "Participant Name",
      "Room",
      "Status",
      "Check-in",
      "Check-out",
      "Total Price",
      "Booked On"
    ];

    const tableRows = bookings.map((booking, index) => [
      index + 1,
      booking.participantName || "-",
      booking.room?.name || "-",
      booking.status,
      new Date(booking.checkIn).toLocaleDateString(),
      new Date(booking.checkOut).toLocaleDateString(),
      `LKR ${booking.totalPrice}`,
      new Date(booking.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 24,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 10, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.text('Thank you for choosing our hotel!', 105, pageHeight - 10, { align: 'center' });

    doc.save('hotel-bookings-data.pdf');
  };

  if (isLoading) {
    return <div className="bookings-container"><h2>Loading bookings...</h2></div>;
  }

  if (error) {
    return (
      <div className="bookings-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchBookings}>Retry</button>
      </div>
    );
  }

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h1>My Bookings</h1>
      </div>

      {bookings.length > 0 && (
        <button
          className="download-all-button"
          style={{ width: "fit-content" }}
          onClick={downloadAllBookingsPDF}
        >
          Download All Bookings
        </button>
      )}

      {bookings.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        <div className="bookings-grid">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.room.name}</h3>
                <span className={`status ${booking.status}`}>{booking.status}</span>
              </div>

              {editingBooking?._id === booking._id ? (
                <form onSubmit={handleUpdateBooking} className="edit-form">
                  <div className="form-group">
                    <label>Check-in Date:</label>
                    <input
                      type="date"
                      name="checkIn"
                      value={editingBooking.checkIn}
                      onChange={handleDateChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Check-out Date:</label>
                    <input
                      type="date"
                      name="checkOut"
                      value={editingBooking.checkOut}
                      onChange={handleDateChange}
                      min={editingBooking.checkIn}
                    />
                  </div>
                  <div className="booking-details">
                    <p><strong>Updated Total Price:</strong> LKR {editingBooking.totalPrice}</p>
                  </div>
                  <div className="edit-buttons">
                    <button type="submit" className="save-button">Save Changes</button>
                    <button
                      type="button"
                      className="cancel-edit-button"
                      onClick={() => setEditingBooking(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="booking-details">
                    <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}</p>
                    <p><strong>Total Price:</strong> LKR {booking.totalPrice}</p>
                    <p><strong>Booked on:</strong> {new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="booking-actions">
                    <button className="download-button" onClick={() => downloadBookingPDF(booking)}>
                      Download PDF
                    </button>
                    {booking.status === 'confirmed' && (
                      <>
                        <button className="edit-button" onClick={() => handleEditBooking(booking)}>
                          Edit Dates
                        </button>
                        <button className="cancel-button" onClick={() => handleCancelBooking(booking._id)}>
                          Cancel Booking
                        </button>
                      </>
                    )}
                    {booking.status === 'cancelled' && (
                      <button className="delete-button" onClick={() => handleDeleteBooking(booking._id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
