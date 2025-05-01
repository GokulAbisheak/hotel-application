import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Rooms from '../pages/Rooms';
import MyBookings from '../pages/MyBookings';
import AdminLayout from '../layouts/AdminLayout';
import AddRoom from '../pages/admin/AddRoom';
import RoomsManagement from '../pages/admin/RoomsManagement';
import EditRoom from '../pages/admin/EditRoom';
import BookingsManagement from '../pages/admin/BookingsManagement';
import UsersManagement from '../pages/admin/UsersManagement';
import FoodManagement from '../pages/admin/FoodManagement';
import Layout from '../components/Layout';
import FoodOrdering from '../pages/FoodOrdering';
import MyOrders from '../pages/MyOrders';
import OrdersManagement from '../pages/admin/OrdersManagement';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
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
        path: '/my-bookings',
        element: <MyBookings />
      },
      {
        path: '/order-food',
        element: <FoodOrdering />
      },
      {
        path: '/my-orders',
        element: <MyOrders />
      }
    ]
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        path: 'dashboard',
        element: <div>Dashboard</div>
      },
      {
        path: 'rooms',
        element: <RoomsManagement />
      },
      {
        path: 'rooms/add',
        element: <AddRoom />
      },
      {
        path: 'rooms/edit/:roomId',
        element: <EditRoom />
      },
      {
        path: 'bookings',
        element: <BookingsManagement />
      },
      {
        path: 'users',
        element: <UsersManagement />
      },
      {
        path: 'foods',
        element: <FoodManagement />
      },
      {
        path: 'orders',
        element: <OrdersManagement />
      },
      {
        path: 'settings',
        element: <div>Settings</div>
      }
    ]
  }
]);

export default router; 