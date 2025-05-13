import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../api/rooms';
import './MyBookings.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [dateFilter, bookings]);

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

  const applyDateFilter = () => {
    let filtered = [...bookings];
    if (dateFilter.from) {
      const fromDate = new Date(dateFilter.from);
      filtered = filtered.filter(b => new Date(b.checkIn) >= fromDate);
    }
    if (dateFilter.to) {
      const toDate = new Date(dateFilter.to);
      filtered = filtered.filter(b => new Date(b.checkOut) <= toDate);
    }
    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async (bookingId) => {
    const bookingToCancel = bookings.find((b) => b._id === bookingId);
    if (!bookingToCancel) {
      alert('Booking not found.');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await roomsAPI.updateBooking(bookingId, {
        checkIn: bookingToCancel.checkIn,
        checkOut: bookingToCancel.checkOut,
        totalAmount: bookingToCancel.totalAmount,
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
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;

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

  const calculatetotalAmount = (checkIn, checkOut, roomPrice) => {
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

    const newtotalAmount = editingBooking.room?.price
      ? calculatetotalAmount(
          newDates.checkIn,
          newDates.checkOut,
          editingBooking.room.price
        )
      : editingBooking.totalAmount;

    setEditingBooking({
      ...newDates,
      totalAmount: newtotalAmount
    });
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;

    try {
      await roomsAPI.updateBooking(editingBooking._id, {
        checkIn: editingBooking.checkIn,
        checkOut: editingBooking.checkOut,
        totalAmount: editingBooking.totalAmount
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

    const tableRows = [
      ["Room", booking.room?.name || "N/A"],
      ["Room Number", booking.room?.roomNumber ? `#${booking.room.roomNumber}` : "N/A"],
      ["Status", booking.status || "N/A"],
      ["Check-in", new Date(booking.checkIn).toLocaleDateString()],
      ["Check-out", new Date(booking.checkOut).toLocaleDateString()],
      ["Total Price", `LKR ${booking.totalAmount}`],
      ["Booked On", new Date(booking.createdAt).toLocaleDateString()],
      ["Room Amenities", booking.room?.amenities?.join(", ") || "N/A"]
    ];

    autoTable(doc, {
      startY: 30,
      head: [["Field", "Details"]],
      body: tableRows,
      styles: { fontSize: 11, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 12 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      theme: 'striped'
    });

    doc.save(`booking-${booking._id}.pdf`);
  };

  const downloadAllBookingsPDF = () => {
    if (filteredBookings.length === 0) {
      alert('No filtered bookings to download');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Filtered Hotel Bookings', 14, 16);

    const tableColumn = [
      "No.",
      "Room",
      "Status",
      "Check-in",
      "Check-out",
      "Total Price",
      "Booked On"
    ];

    const tableRows = filteredBookings.map((booking, index) => [
      index + 1,
      booking.room?.name || "-",
      booking.status,
      new Date(booking.checkIn).toLocaleDateString(),
      new Date(booking.checkOut).toLocaleDateString(),
      `LKR ${booking.totalAmount}`,
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

    doc.setFontSize(10);
    const pageHeight = doc.internal.pageSize.height;
    doc.text('Thank you for using our service!', 105, pageHeight - 10, { align: 'center' });

    doc.save('filtered-bookings.pdf');
  };

  if (isLoading) return <div className="bookings-container"><h2>Loading bookings...</h2></div>;
  if (error) return (
    <div className="bookings-container">
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={fetchBookings}>Retry</button>
    </div>
  );

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="font-medium">From:</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={dateFilter.from}
              onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">To:</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={dateFilter.to}
              onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
            />
          </div>
          <button
            onClick={downloadAllBookingsPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Download Filtered Bookings
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <p className="mt-6 text-center text-gray-600">No bookings found for the selected date range.</p>
      ) : (
        <div className="bookings-grid">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.room?.name || 'Room Unavailable'}</h3>
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
                    <p><strong>Updated Total Price:</strong> LKR {editingBooking.totalAmount}</p>
                  </div>
                  <div className="edit-buttons">
                    <button type="submit" className="save-button">Save Changes</button>
                    <button type="button" className="cancel-edit-button" onClick={() => setEditingBooking(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="booking-details">
                    <p><strong>Room:</strong> {booking.room?.name || 'N/A'}</p>
                    <p><strong>Room Number:</strong> {booking.room?.roomNumber ? `#${booking.room.roomNumber}` : 'N/A'}</p>
                    <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}</p>
                    <p><strong>Total Price:</strong> LKR {booking.totalAmount}</p>
                    <p><strong>Booked on:</strong> {new Date(booking.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="booking-actions">
                    <button className="download-button" onClick={() => downloadBookingPDF(booking)}>Download PDF</button>
                    {booking.status === 'confirmed' && (
                      <>
                        <button className="edit-button" onClick={() => handleEditBooking(booking)}>Edit Dates</button>
                        <button className="cancel-button" onClick={() => handleCancelBooking(booking._id)}>Cancel Booking</button>
                      </>
                    )}
                    {booking.status === 'cancelled' && (
                      <button className="delete-button" onClick={() => handleDeleteBooking(booking._id)}>Delete</button>
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
