import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './Layout.css';
import { FaUser } from 'react-icons/fa';

const Layout = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
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
                to="/my-bookings" 
                className={`nav-link ${isActive('/my-bookings') ? 'active' : ''}`}
              >
                My Bookings
              </Link>
              {
                user && user.checkedIn && (
                  <>
                  <Link 
                    to="/order-food" 
                    className={`nav-link ${isActive('/order-food') ? 'active' : ''}`}
                  >
                    Order Food
                  </Link>
                  <Link 
                  to="/my-orders" 
                  className={`nav-link ${isActive('/my-orders') ? 'active' : ''}`}
                >
                  My Orders
                </Link>
                </>
                )
              }
              <span
                onClick={handleLogout}
                className="nav-link logout"
              >
                Logout
              </span>
              <div className='flex gap-2 items-center'>
                <div className='h-8 w-8 bg-gray-300 rounded-full text-white flex items-center justify-center'><FaUser /></div>
                <div className='text-gray-600'>{user?.name}</div>
              </div>
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