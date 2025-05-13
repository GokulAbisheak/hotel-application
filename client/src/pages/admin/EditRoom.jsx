import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import { roomsAPI } from '../../api/rooms';
import './EditRoom.css';

const EditRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    price: '',
    amenities: '',
    image: null,
    category: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    capacity: '',
    price: '',
    amenities: '',
    image: '',
    category: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const room = await roomsAPI.getRoomById(roomId);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        price: room.price,
        amenities: room.amenities.join(', '),
        image: null,
        category: room.category
      });
      setImagePreview(room.image ? `http://localhost:4000${room.image}` : null);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch room details');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setFormErrors(prev => ({
        ...prev,
        image: ''
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = (processedAmenities) => {
    const errors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Room name is required';
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Room name must be at least 3 characters long';
      isValid = false;
    }

    // Capacity validation
    if (!formData.capacity) {
      errors.capacity = 'Capacity is required';
      isValid = false;
    } else if (isNaN(formData.capacity) || parseInt(formData.capacity) <= 0) {
      errors.capacity = 'Capacity must be a positive number';
      isValid = false;
    }

    // Price validation
    if (!formData.price) {
      errors.price = 'Price is required';
      isValid = false;
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
      isValid = false;
    }

    // Amenities validation
    if (!processedAmenities || processedAmenities.length === 0) {
      errors.amenities = 'At least one amenity is required';
      isValid = false;
    }

    if (!formData.category.trim()) {
      errors.category = 'Room category is required';
      isValid = false;
    } else if (formData.category.trim().length < 3) {
      errors.category = 'Room category must be at least 3 characters long';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Process amenities before validation
    const processedAmenities = formData.amenities
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item !== '');

    // Validate form before submission
    if (!validateForm(processedAmenities)) {
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Add basic fields
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('capacity', formData.capacity);
      formDataToSend.append('price', formData.price);
      
      // Add processed amenities
      formDataToSend.append('amenities', processedAmenities.join(','));

      formDataToSend.append('category', formData.category.trim());

      // Add image if it exists
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      await roomsAPI.updateRoom(roomId, formDataToSend);
      navigate('/admin/rooms');
    } catch (err) {
      console.error('Error updating room:', err);
      setError(err.message || 'Failed to update room');
    }
  };

  if (loading) {
    return <div className="loading">Loading room details...</div>;
  }

  return (
    <div className="edit-room">
      <div className="edit-room-header">
        <button 
          className="back-button"
          onClick={() => navigate('/admin/rooms')}
        >
          <MdArrowBack size={20} />
          Back to Rooms
        </button>
      </div>
      <div className='edit-room-header-title'>
        <h2>Edit Room</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="edit-room-form">
        <div className="form-group">
          <label htmlFor="name">Room Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={formErrors.name ? 'input-error' : ''}
          />
          {formErrors.name && <span className="error-message">{formErrors.name}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="capacity">Capacity (persons)</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              className={formErrors.capacity ? 'input-error' : ''}
            />
            {formErrors.capacity && <span className="error-message">{formErrors.capacity}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="price">Price per Night (LKR)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={formErrors.price ? 'input-error' : ''}
            />
            {formErrors.price && <span className="error-message">{formErrors.price}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="amenities">Amenities (comma-separated)</label>
          <textarea
            id="amenities"
            name="amenities"
            value={formData.amenities}
            onChange={handleChange}
            placeholder="e.g., WiFi, TV, Air Conditioning"
            className={`amenities-input ${formErrors.amenities ? 'input-error' : ''}`}
          />
          {formErrors.amenities && <span className="error-message">{formErrors.amenities}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="name">Room Category</label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={formErrors.category ? 'input-error' : ''}
          />
          {formErrors.category && <span className="error-message">{formErrors.category}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="image">Room Image</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            accept="image/*"
            className={formErrors.image ? 'input-error' : ''}
          />
          {formErrors.image && <span className="error-message">{formErrors.image}</span>}
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Room preview" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={() => navigate('/admin/rooms')}>
            Cancel
          </button>
          <button type="submit" className="save-button">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRoom; 