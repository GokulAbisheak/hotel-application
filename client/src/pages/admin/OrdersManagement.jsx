import React, { useState, useEffect } from 'react';
import { FaSpinner, FaUtensils, FaClock, FaCheck, FaTimes, FaSearch, FaTrash } from 'react-icons/fa';
import { getOrders, updateOrderStatus, deleteOrder } from '../../api/orders';
import '../../styles/admin/OrdersManagement.css';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.currentPage, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getOrders(pagination.currentPage, 10, searchTerm, statusFilter);
      setOrders(response.orders);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on search
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on status change
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(orderId);
      const response = await updateOrderStatus(orderId, newStatus);
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // Clear any previous errors
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to update order status. Please try again.');
      // Revert the status in the UI if the update failed
      await fetchOrders();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteOrder(orderId);
      await fetchOrders(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to delete order. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'preparing':
        return <FaUtensils className="status-icon preparing" />;
      case 'ready':
        return <FaCheck className="status-icon ready" />;
      case 'delivered':
        return <FaCheck className="status-icon delivered" />;
      case 'cancelled':
        return <FaTimes className="status-icon cancelled" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-management-container">
      <div className="orders-header">
        <h1>Order Management</h1>
        
        <div className="filters">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or room number..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found matching your criteria.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
                  <p className="customer-info">
                    Customer: {order.user.name} | Room: {order.roomNumber}
                  </p>
                </div>
                <div className="order-status">
                  {getStatusIcon(order.status)}
                  <span className={`status-text ${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-details">
                      <h4>{item.food.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                    </div>
                    <p className="item-price">LKR {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <h4>Total Amount:</h4>
                  <p>LKR {order.totalAmount.toFixed(2)}</p>
                </div>
                
                {order.specialInstructions && (
                  <div className="special-instructions">
                    <h4>Special Instructions:</h4>
                    <p>{order.specialInstructions}</p>
                  </div>
                )}
                
                {order.deliveryTime && (
                  <div className="delivery-time">
                    <h4>Preferred Delivery Time:</h4>
                    <p>{formatDate(order.deliveryTime)}</p>
                  </div>
                )}

                <div className="status-actions">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    disabled={updatingStatus === order._id}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {updatingStatus === order._id && (
                    <FaSpinner className="spinner" />
                  )}
                  <button
                    style={{maxWidth: '200px', marginTop: 0}}
                    className="delete-button"
                    onClick={() => handleDelete(order._id)}
                    title="Delete Order"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
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

export default OrdersManagement; 