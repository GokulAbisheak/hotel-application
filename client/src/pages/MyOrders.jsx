import React, { useState, useEffect } from 'react';
import { FaSpinner, FaUtensils, FaClock, FaCheck, FaTimes, FaDownload } from 'react-icons/fa';
import { getUserOrders } from '../api/orders';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getUserOrders();
        setOrders(response.data);
      } catch (err) {
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'preparing':
        return <FaUtensils className="status-icon preparing" />;
      case 'ready':
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

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter(order => order.status === statusFilter);

  const downloadAllOrders = () => {
    const doc = new jsPDF();
    doc.text('My Orders', 14, 15);

    let y = 25;
    filteredOrders.forEach((order, index) => {
      if (y > 250) {
        doc.addPage();
        y = 25;
      }

      doc.text(`Order #${order._id.slice(-6)}`, 14, y);
      doc.text(`Date: ${formatDate(order.createdAt)}`, 14, y + 5);
      doc.text(`Status: ${order.status}`, 14, y + 10);

      let itemY = y + 15;
      order.items.forEach(item => {
        doc.text(`${item?.food?.name} x ${item?.quantity} - LKR ${(item?.price * item?.quantity).toFixed(2)}`, 14, itemY);
        itemY += 5;
      });

      doc.text(`Total Amount: LKR ${order.totalAmount.toFixed(2)}`, 14, itemY);
      if (order.specialInstructions) {
        doc.text(`Special Instructions: ${order.specialInstructions}`, 14, itemY + 5);
      }
      if (order.deliveryTime) {
        doc.text(`Delivery Time: ${formatDate(order.deliveryTime)}`, 14, itemY + 10);
      }

      y = itemY + 15;
    });

    doc.save('my-orders.pdf');
  };

  const downloadOrder = (order) => {
    const doc = new jsPDF();
    doc.text(`Order #${order._id.slice(-6)}`, 14, 15);
    doc.text(`Date: ${formatDate(order.createdAt)}`, 14, 20);
    doc.text(`Status: ${order.status}`, 14, 25);

    let y = 35;
    order.items.forEach(item => {
      doc.text(`${item.food.name} x ${item.quantity} - LKR ${(item.price * item.quantity).toFixed(2)}`, 14, y);
      y += 5;
    });

    doc.text(`Total Amount: LKR ${order.totalAmount.toFixed(2)}`, 14, y);
    if (order.specialInstructions) {
      doc.text(`Special Instructions: ${order.specialInstructions}`, 14, y + 5);
    }
    if (order.deliveryTime) {
      doc.text(`Delivery Time: ${formatDate(order.deliveryTime)}`, 14, y + 10);
    }

    doc.save(`order-${order._id.slice(-6)}.pdf`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <h1>My Orders</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="status-filter"
            style={{
              padding: '6px 10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {filteredOrders.length > 0 && (
            <button
              onClick={downloadAllOrders}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <FaDownload /> Download All
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found for the selected status.</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="order-status">
                    {getStatusIcon(order.status)}
                    <span className={`status-text ${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadOrder(order)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 10px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <FaDownload />
                  </button>
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-details">
                      <h4>{item.food?.name}</h4>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;