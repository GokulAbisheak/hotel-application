import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  MdDashboard, 
  MdHotel, 
  MdEventNote, 
  MdPeople, 
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
  MdRestaurant,
  MdShoppingBasket
} from 'react-icons/md';
import './AdminLayout.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/admin/rooms', label: 'Rooms', icon: <MdHotel size={24} /> },
    { path: '/admin/bookings', label: 'Bookings', icon: <MdEventNote size={24} /> },
    { path: '/admin/users', label: 'CRM', icon: <MdPeople size={24} /> },
    { path: '/admin/foods', label: 'Foods', icon: <MdRestaurant size={24} /> },
    { path: '/admin/orders', label: 'Orders', icon: <MdShoppingBasket size={24} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 style={{textTransform: 'uppercase'}}>Admin Panel</h2>
          <button 
            className="toggle-sidebar"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {isSidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <span className="nav-icon"><MdLogout size={24} /></span>
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-content">
            <h1>{menuItems.find(item => item.path === location.pathname)?.label || 'Admin'}</h1>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 