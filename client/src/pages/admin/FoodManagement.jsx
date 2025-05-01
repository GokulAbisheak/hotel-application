import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { createFood, getFoods, updateFood, deleteFood } from '../../api/foods';
import './FoodManagement.css';

const FoodManagement = () => {
  const [foods, setFoods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'appetizer',
    image: null,
    preparationTime: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    preparationTime: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalFoods: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchFoods();
  }, [pagination.currentPage, searchTerm, categoryFilter]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await getFoods(pagination.currentPage, 10, searchTerm, categoryFilter);
      setFoods(response.foods);
      setPagination(response.pagination);
      setError(null);
    } catch (error) {
      setError('Failed to fetch foods');
      setFoods([]);
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

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on category change
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters long';
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
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

    // Category validation
    if (!formData.category) {
      errors.category = 'Category is required';
      isValid = false;
    }

    // Image validation (only for new food items)
    if (!editingFood && !formData.image) {
      errors.image = 'Image is required for new food items';
      isValid = false;
    }

    // Preparation time validation
    if (!formData.preparationTime) {
      errors.preparationTime = 'Preparation time is required';
      isValid = false;
    } else if (isNaN(formData.preparationTime) || parseInt(formData.preparationTime) <= 0) {
      errors.preparationTime = 'Preparation time must be a positive number';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

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
    setError('');

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData object
      const foodData = new FormData();
      
      // Append all form fields
      foodData.append('name', formData.name.trim());
      foodData.append('description', formData.description.trim());
      foodData.append('price', parseFloat(formData.price));
      foodData.append('category', formData.category);
      foodData.append('preparationTime', parseInt(formData.preparationTime));
      
      // Only append image if it exists
      if (formData.image) {
        foodData.append('image', formData.image);
      }

      if (editingFood) {
        await updateFood(editingFood._id, foodData);
      } else {
        await createFood(foodData);
      }

      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'appetizer',
        image: null,
        preparationTime: ''
      });
      setPreviewImage(null);
      setEditingFood(null);
      setFormErrors({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        preparationTime: ''
      });
      fetchFoods();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save food item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      description: food.description,
      price: food.price.toString(),
      category: food.category,
      image: null,
      preparationTime: food.preparationTime.toString()
    });
    setPreviewImage(food.image);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      try {
        await deleteFood(id);
        fetchFoods();
      } catch (error) {
        setError('Failed to delete food item');
      }
    }
  };

  return (
    <div className="food-management">
      <div className="food-management-header">
        <h2>Food Management</h2>
        <button 
          className="add-food-button"
          style={{width: 'fit-content'}}
          onClick={() => {
            setEditingFood(null);
            setFormData({
              name: '',
              description: '',
              price: '',
              category: 'appetizer',
              image: null,
              preparationTime: ''
            });
            setPreviewImage(null);
            setShowModal(true);
          }}
        >
          <FaPlus /> Add New Food
        </button>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search foods by name or description..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={handleCategoryChange}
          className="category-filter"
        >
          <option value="">All Categories</option>
          <option value="appetizer">Appetizer</option>
          <option value="main course">Main Course</option>
          <option value="dessert">Dessert</option>
          <option value="beverage">Beverage</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="foods-table-container">
        <table className="foods-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Prep Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {foods.map(food => (
              <tr key={food._id}>
                <td>
                  <img 
                    src={`http://localhost:4000/uploads/${food.image}`} 
                    alt={food.name} 
                    className="food-thumbnail"
                  />
                </td>
                <td>{food.name}</td>
                <td style={{textTransform: 'capitalize'}}>{food.category}</td>
                <td>LKR {food.price.toFixed(2)}</td>
                <td>{food.preparationTime} mins</td>
                <td>
                  <button 
                    className="edit-button"
                    onClick={() => handleEdit(food)}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(food._id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingFood ? 'Edit Food Item' : 'Add New Food Item'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? 'error' : ''}
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={formErrors.description ? 'error' : ''}
                />
                {formErrors.description && <span className="error-message">{formErrors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="price">Price (LKR)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={formErrors.price ? 'error' : ''}
                />
                {formErrors.price && <span className="error-message">{formErrors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={formErrors.category ? 'error' : ''}
                >
                  <option value="appetizer">Appetizer</option>
                  <option value="main course">Main Course</option>
                  <option value="dessert">Dessert</option>
                  <option value="beverage">Beverage</option>
                </select>
                {formErrors.category && <span className="error-message">{formErrors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="image">Food Image</label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/*"
                  className={formErrors.image ? 'error' : ''}
                />
                {formErrors.image && <span className="error-message">{formErrors.image}</span>}
                {previewImage && (
                  <div className="image-preview">
                    <img src={`http://localhost:4000/uploads/${previewImage}`} alt="Food preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="preparationTime">Preparation Time (minutes)</label>
                <input
                  type="number"
                  id="preparationTime"
                  name="preparationTime"
                  value={formData.preparationTime}
                  onChange={handleInputChange}
                  min="0"
                  className={formErrors.preparationTime ? 'error' : ''}
                />
                {formErrors.preparationTime && <span className="error-message">{formErrors.preparationTime}</span>}
              </div>

              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingFood ? 'Update' : 'Add Food'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodManagement; 