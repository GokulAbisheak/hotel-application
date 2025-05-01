import React, { useState, useEffect } from 'react';
import { roomsAPI } from '../../api/rooms';
import './BookingsManagement.css';

const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, confirmed, cancelled, completed
  const [sortBy, setSortBy] = useState('checkIn'); // checkIn, checkOut, createdAt
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchBookings();
  }, [pagination.currentPage]);

  const fetchBookings = async () => {
    try {
      const response = await roomsAPI.getAllBookings(pagination.currentPage);
      setBookings(response.bookings);
      setPagination(response.pagination);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch bookings');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
      return;
    }

    try {
      setLoading(true);
      await roomsAPI.updateBooking(bookingId, { status: newStatus });
      await fetchBookings(); // Refresh the list
      setError('');
    } catch (err) {
      console.error('Error updating booking:', err);
      setError(err.message || 'Failed to update booking status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await roomsAPI.deleteBooking(bookingId);
      await fetchBookings(); // Refresh the list
      setError('');
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError(err.message || 'Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearDateRange = () => {
    setDateRange({
      startDate: '',
      endDate: ''
    });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const filteredBookings = bookings
    .filter(booking => {
      // Status filter
      const statusMatch = filter === 'all' || booking.status === filter;
      
      // Date range filter
      const bookingDate = new Date(booking.checkIn);
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
      
      const dateMatch = (!startDate || bookingDate >= startDate) && 
                       (!endDate || bookingDate <= endDate);
      
      return statusMatch && dateMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'checkIn':
          return new Date(a.checkIn) - new Date(b.checkIn);
        case 'checkOut':
          return new Date(a.checkOut) - new Date(b.checkOut);
        case 'createdAt':
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return 0;
      }
    });

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="bookings-management">
      <div className="bookings-header">
        <h2>Bookings Management</h2>
        <div className="bookings-controls">
          <div className="filter-group">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="checkIn">Sort by Check-in</option>
              <option value="checkOut">Sort by Check-out</option>
              <option value="createdAt">Sort by Booking Date</option>
            </select>
          </div>
        </div>
      </div>

      <div className="date-filter-section">
        <div className="date-filter-header">
          <h3>Filter by Date Range</h3>
          <button 
            onClick={clearDateRange}
            className="clear-date-button"
          >
            Clear Dates
          </button>
        </div>
        <div className="date-range-group">
          <div className="date-input-group">
            <label>From</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>To</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="date-input"
            />
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Guest</th>
              <th>Room No</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Total Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking._id}>
                <td>{booking._id.slice(-6)}</td>
                <td>
                  <div className="guest-info">
                    <span>{booking.user?.name || 'N/A'}</span>
                    <span className="guest-email">{booking.user?.email || 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <div className="room-info">
                    <span className="room-number">{booking.room?.roomNumber || 'N/A'}</span>
                  </div>
                </td>
                <td>{formatDate(booking.checkIn)}</td>
                <td>{formatDate(booking.checkOut)}</td>
                <td>LKR {booking.totalAmount}</td>
                <td>
                  <select
                    value={booking.status}
                    onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                    className={`status-select ${getStatusColor(booking.status)}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  <div className="booking-actions">
                    <button
                      className="action-button delete"
                      onClick={() => handleDeleteBooking(booking._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <button
          style={{width: 'fit-content', marginTop: 0}}
          className="pagination-button"
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button
          style={{width: 'fit-content', marginTop: 0}}
          className="pagination-button"
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default BookingsManagement; 