import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  //check if the current path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  //handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">Hotel Rasanga</Link>
        </div>
        <div className="nav-links">
          <Link 
            to="/rooms" 
            className={`nav-link ${isActive('/rooms') ? 'active' : ''}`}
          >
            Rooms
          </Link>
          {token ? (
            <>
              <Link 
                to="/bookings" 
                className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}
              >
                My Bookings
              </Link>
              <span
                onClick={handleLogout}
                className="nav-link logout"
              >
                Logout
              </span>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className={`nav-link ${isActive('/register') ? 'active' : ''}`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
      
      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>&copy; 2024 Hotel Booking. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout; 