import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../../api/rooms';
import './AddRoom.css';

const AddRoom = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
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

  const handleInputChange = (e) => {
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
    setError(null);
  };

  const handleAmenitiesChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      amenities: value
    }));
    // Clear error when user starts typing
    if (formErrors.amenities) {
      setFormErrors(prev => ({
        ...prev,
        amenities: ''
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

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Process amenities before validation
    const processedAmenities = formData.amenities
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item !== '');

    // Validate form before submission
    if (!validateForm(processedAmenities)) {
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData object
      const roomData = new FormData();
      
      // Append all form fields
      roomData.append('name', formData.name.trim());
      roomData.append('capacity', parseInt(formData.capacity));
      roomData.append('price', parseFloat(formData.price));
      
      // Append processed amenities
      roomData.append('amenities', processedAmenities.join(','));
      
      // Append image
      if (formData.image) {
        roomData.append('image', formData.image);
      }

      roomData.append('category', formData.category.trim());

      await roomsAPI.createRoom(roomData);
      alert('Room added successfully!');
      navigate('/admin/rooms');
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to add room');
    } finally {
      setIsLoading(false);
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

    // Image validation
    if (!formData.image) {
      errors.image = 'Room image is required';
      isValid = false;
    }

    if (!formData.category) {
      errors.category = 'Room category is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  return (
    <div className="add-room-container">
      <h1>Add New Room</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="add-room-form">
        <div className="form-group">
          <label htmlFor="name">Room Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={formErrors.name ? 'input-error' : ''}
            placeholder="Enter room name"
          />
          {formErrors.name && <span className="error-message">{formErrors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="capacity">Capacity (persons)</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleInputChange}
            className={formErrors.capacity ? 'input-error' : ''}
            min="1"
            placeholder="Enter room capacity"
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
            onChange={handleInputChange}
            className={formErrors.price ? 'input-error' : ''}
            min="0"
            step="0.01"
            placeholder="Enter room price"
          />
          {formErrors.price && <span className="error-message">{formErrors.price}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="amenities">Amenities (one per line or comma-separated)</label>
          <textarea
            id="amenities"
            name="amenities"
            value={formData.amenities}
            onChange={handleAmenitiesChange}
            className={formErrors.amenities ? 'input-error' : ''}
            placeholder="Enter amenities, one per line or separated by commas&#10;Example:&#10;WiFi&#10;TV&#10;Mini Bar"
            rows="4"
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
            onChange={handleInputChange}
            className={formErrors.category ? 'input-error' : ''}
            placeholder="Enter room category"
          />
          {formErrors.name && <span className="error-message">{formErrors.category}</span>}
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
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="Room preview" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Adding Room...' : 'Add Room'}
          </button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/admin/rooms')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRoom; 