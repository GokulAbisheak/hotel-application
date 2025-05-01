import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { roomsAPI } from '../../api/rooms';
import './RoomsManagement.css';

const RoomsManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAllRooms();
      setRooms(response);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch rooms');
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        setLoading(true);
        await roomsAPI.deleteRoom(roomId);
        setRooms(rooms.filter(room => room._id !== roomId));
        setError('');
      } catch (err) {
        console.error('Error deleting room:', err);
        setError(err.message || 'Failed to delete room');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading rooms...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="rooms-management">
      <div className="rooms-header">
        <h2>Rooms Management</h2>
        <button 
          style={{width: 'fit-content'}}
          className="add-room-button"
          onClick={() => navigate('/admin/rooms/add')}
        >
          <MdAdd size={20} />
          Add New Room
        </button>
      </div>

      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room._id} className="room-card">
            <div className="room-image">
              <img 
                src={`http://localhost:4000${room.image}` || '/default-room.jpg'} 
                alt={room.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-room.jpg';
                }}
              />
            </div>
            <div className="room-details">
              <h3>{room.name}</h3>
              <p className="room-number">Room #{room.roomNumber}</p>
              <div className="room-info">
                <span>Capacity: {room.capacity} persons</span>
                <span>Price: LKR {room.price}/night</span>
              </div>
              <div className="room-amenities">
                {room.amenities.map((amenity, index) => (
                  <span key={index} className="amenity-tag">{amenity}</span>
                ))}
              </div>
              <div className="room-actions">
                <button 
                  className="edit-button"
                  onClick={() => navigate(`/admin/rooms/edit/${room._id}`)}
                >
                  <MdEdit size={18} />
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteRoom(room._id)}
                >
                  <MdDelete size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomsManagement; 