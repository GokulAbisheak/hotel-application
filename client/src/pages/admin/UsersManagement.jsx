import React, { useState, useEffect } from 'react';
import { FaSearch, FaTrash, FaPlus, FaDownload } from 'react-icons/fa';
import { usersAPI } from '../../api/users';
import authAPI from '../../api/auth';
import './UsersManagement.css';
import jsPDF from 'jspdf';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    nic: '',
    phoneNumber: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    nic: '',
    phoneNumber: ''
  });
  const [formError, setFormError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers(pagination.currentPage, 10, searchTerm);
      setUsers(response.users);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      setUsers([]);
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

  const handleDelete = async (userId) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.deleteUser(userId);
        setUsers(prevUsers => prevUsers.filter(user => user?._id !== userId));
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const handleCheckIn = async (userId, currentStatus) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    try {
      const response = await usersAPI.toggleCheckIn(userId);
      if (response?.data) {
        setUsers(prevUsers => prevUsers.map(user => 
          user?._id === userId ? { ...user, checkedIn: response.data.checkedIn } : user
        ));
      }
    } catch (err) {
      setError('Failed to update check-in status');
    }
  };

  const validateUserData = (data) => {
    const errors = {};
    let isValid = true;

    // Name validation
    if (!data.name?.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (data.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters long';
      isValid = false;
    }

    // Email validation
    if (!data.email?.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // NIC validation
    if (!data.nic?.trim()) {
      errors.nic = 'NIC is required';
      isValid = false;
    } else if (!/^[0-9]{9}[vVxX]$|^[0-9]{12}$/.test(data.nic)) {
      errors.nic = 'Please enter a valid Sri Lankan NIC number';
      isValid = false;
    }

    // Phone number validation
    if (!data.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else if (!/^(\+94|0)[1-9][0-9]{8}$/.test(data.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid Sri Lankan phone number';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
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
    setFormError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!validateUserData(newUser)) {
      return;
    }

    try {
      const userData = {
        ...newUser,
        password: newUser.nic
      };
      const response = await authAPI.register(userData);
      
      if (response?.data) {
        setUsers(prevUsers => [...prevUsers, response.data]);
        setShowModal(false);
        setNewUser({
          name: '',
          email: '',
          nic: '',
          phoneNumber: ''
        });
        setFormErrors({});
        setShowModal(false);
      }
    } catch (err) {
      if (err?.message) {
        if (err.message.includes('email')) {
          setFormErrors(prev => ({ ...prev, email: 'Email already exists' }));
        } else if (err.message.includes('NIC')) {
          setFormErrors(prev => ({ ...prev, nic: 'NIC already exists' }));
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Failed to register user');
      }
    }
  };

  const downloadUsersPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Customer Details', 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
    
    // Table settings
    const startY = 35;
    const lineHeight = 7;
    const colWidth = 40;
    const headers = ['Name', 'Email', 'NIC', 'Phone', 'Checked In'];
    const colPositions = [14, 54, 94, 134, 174];
    
    // Draw table headers
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    headers.forEach((header, i) => {
      doc.text(header, colPositions[i], startY);
    });
    
    // Add user data
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let currentY = startY + 10;
    
    users.forEach(user => {
      // Check if we need a new page
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
        
        // Redraw headers on new page
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        headers.forEach((header, i) => {
          doc.text(header, colPositions[i], currentY);
        });
        currentY += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
      }
      
      // Add user data
      const userData = [
        user.name || 'N/A',
        user.email || 'N/A',
        user.nic || 'N/A',
        user.phoneNumber || 'N/A',
        user.checkedIn ? 'Yes' : 'No'
      ];
      
      userData.forEach((data, i) => {
        // Split text if it's too long
        const text = doc.splitTextToSize(data, colWidth - 5);
        text.forEach((line, lineIndex) => {
          doc.text(line, colPositions[i], currentY + (lineIndex * lineHeight));
        });
      });
      
      // Move to next row
      currentY += Math.max(...userData.map(data => 
        doc.splitTextToSize(data, colWidth - 5).length
      )) * lineHeight + 5;
    });
    
    // Save the PDF
    doc.save('customer-details.pdf');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="users-management">
      <div className="users-header">
        <h1>Customer Relationship Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            style={{ width: 'fit-content' }} 
            className="register-button" 
            onClick={() => setShowModal(true)}
          >
            <FaPlus /> Register User
          </button>
          {users.length > 0 && (
            <button 
              style={{ width: 'fit-content' }} 
              className="register-button" 
              onClick={downloadUsersPDF}
            >
              <FaDownload /> Download Details
            </button>
          )}
        </div>
      </div>
      
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search users by name, email, or NIC..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>NIC</th>
              <th>Phone</th>
              <th>Check-in Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!users?.length ? (
              <tr>
                <td colSpan="6" className="no-data">No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user?._id || Math.random()}>
                  <td>{user?.name || 'N/A'}</td>
                  <td>{user?.email || 'N/A'}</td>
                  <td>{user?.nic || 'N/A'}</td>
                  <td>{user?.phoneNumber || 'N/A'}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={!!user?.checkedIn}
                        onChange={() => handleCheckIn(user?._id, user?.checkedIn)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(user?._id)}
                      disabled={!user?._id}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Register New User</h2>
            {formError && <div className="form-error-box">{formError}</div>}
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? 'input-error' : ''}
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? 'input-error' : ''}
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="nic">NIC</label>
                <input
                  type="text"
                  id="nic"
                  name="nic"
                  value={newUser.nic}
                  onChange={handleInputChange}
                  className={formErrors.nic ? 'input-error' : ''}
                />
                {formErrors.nic && <span className="error-message">{formErrors.nic}</span>}
                <small>NIC will be used as the initial password</small>
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={newUser.phoneNumber}
                  onChange={handleInputChange}
                  className={formErrors.phoneNumber ? 'input-error' : ''}
                />
                {formErrors.phoneNumber && <span className="error-message">{formErrors.phoneNumber}</span>}
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement; 