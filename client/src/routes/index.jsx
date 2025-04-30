import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Rooms from '../pages/Rooms';
import MyBookings from '../pages/MyBookings';
import Layout from '../components/Layout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Rooms />
      },
      {
        path: '/login',
        element: <Login />
      },
      {
        path: '/register',
        element: <Register />
      },
      {
        path: '/rooms',
        element: <Rooms />
      },
      {
        path: '/bookings',
        element: <MyBookings />
      }
    ]
  }
]);

export default router; 