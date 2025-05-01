import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSpinner, FaSearch } from 'react-icons/fa';
import { getFoods } from '../api/foods';
import { createOrder } from '../api/orders';
import { getUser } from '../api/auth';
import { createOrderPaymentIntent, confirmPayment } from '../api/payments';
import StripeProvider from '../components/StripeProvider';
import PaymentForm from '../components/PaymentForm';
import '../styles/FoodOrdering.css';

const FoodOrdering = () => {
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        setUserLoading(true);
        const response = await getUser();
        if (!response?.checkedIn) {
          navigate('/login');
          return;
        }
        setUser(response);
      } catch (err) {
        console.error('Error checking user status:', err);
        navigate('/login');
      } finally {
        setUserLoading(false);
      }
    };

    checkUserStatus();
  }, [navigate]);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        setError(null);
        const response = await getFoods();
        if (response?.success && response?.foods) {
          setFoods(response.foods);
          setFilteredFoods(response.foods);
        } else {
          setError('Failed to load food items. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching foods:', err);
        setError('Failed to load food items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [user]);

  useEffect(() => {
    // Filter foods based on search term and category
    let filtered = [...foods];
    
    if (searchTerm) {
      filtered = filtered.filter(food => 
        food?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(food => food?.category === selectedCategory);
    }
    
    setFilteredFoods(filtered);
  }, [searchTerm, selectedCategory, foods]);

  // Get unique categories from foods
  const categories = ['all', ...new Set(foods.map(food => food?.category).filter(Boolean))];

  const addToCart = (food) => {
    if (!food?._id) return;

    const existingItem = cart.find(item => item?.food?._id === food._id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item?.food?._id === food._id
          ? { ...item, quantity: (item.quantity || 0) + 1 }
          : item
      ));
    } else {
      setCart([...cart, { food, quantity: 1 }]);
    }
  };

  const removeFromCart = (foodId) => {
    if (!foodId) return;
    setCart(cart.filter(item => item?.food?._id !== foodId));
  };

  const updateQuantity = (foodId, newQuantity) => {
    if (!foodId || newQuantity < 1) {
      removeFromCart(foodId);
      return;
    }

    setCart(cart.map(item =>
      item?.food?._id === foodId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemPrice = item?.food?.price || 0;
      const itemQuantity = item?.quantity || 0;
      return total + (itemPrice * itemQuantity);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (!cart?.length) {
      setError('Please add items to your cart');
      return;
    }

    if (!user?.checkedIn) {
      setError('You must be checked in to place an order');
      return;
    }

    setOrderSubmitting(true);
    setError(null);

    try {
      const data = {
        items: cart.map(item => ({
          food: item?.food?._id,
          quantity: item?.quantity || 0,
          price: item?.food?.price || 0
        })).filter(item => item.food && item.quantity > 0),
        totalAmount: calculateTotal(),
        specialInstructions: specialInstructions?.trim() || undefined,
        deliveryTime: deliveryTime || undefined
      };

      // Create order first
      const response = await createOrder(data);
      
      if (response?.success) {
        // Store order data for later use
        setOrderData(response.data);

        // Create payment intent
        const paymentData = await createOrderPaymentIntent({
          orderId: response.data?._id
        });

        if (paymentData?.clientSecret) {
          setClientSecret(paymentData.clientSecret);
          setShowPayment(true);
        } else {
          throw new Error('Failed to create payment intent');
        }
      } else {
        throw new Error(response?.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order error:', err);
      setError(err?.message || 'Failed to place order. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    if (!paymentIntent?.id || !orderData?._id) {
      setError('Invalid payment or order data');
      return;
    }

    try {
      // Update order with payment information
      await confirmPayment({
        paymentIntentId: paymentIntent.id,
        type: 'order',
        id: orderData._id
      });
      
      setCart([]);
      setSpecialInstructions('');
      setDeliveryTime('');
      setShowPayment(false);
      alert('Order placed successfully!');
      navigate('/my-orders');
    } catch (error) {
      console.error('Error confirming payment:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to confirm payment. Please try again.';
      alert(errorMessage);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert(error?.message || 'Payment failed. Please try again.');
    setShowPayment(false);
  };

  if (userLoading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Checking user status...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading food items...</p>
      </div>
    );
  }

  return (
    <div className="food-ordering-container">
      <h1>Order Food</h1>
      {error && <div className="error-message">{error}</div>}
      
      {showPayment && clientSecret && (
        <div className="payment-modal">
          <div className="payment-modal-content">
            <h2>Complete Your Order</h2>
            <p>Total Amount: LKR {orderData?.totalAmount?.toFixed(2) || '0.00'}</p>
            <StripeProvider>
              <PaymentForm
                amount={orderData?.totalAmount || 0}
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </StripeProvider>
            <button 
              className="cancel-payment-button"
              onClick={() => setShowPayment(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="food-ordering-content">
        <div className="food-list">
          <h2>Available Food Items</h2>
          
          <div className="search-filter-container">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e?.target?.value || '')}
              />
            </div>
            
            <div style={{margin: 0,  border: 'none'}} className="category-filter">
              <select
                style={{margin: 0}}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e?.target?.value || 'all')}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category?.charAt(0)?.toUpperCase() + category?.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!filteredFoods?.length ? (
            <p className="no-items">No food items found matching your search.</p>
          ) : (
            <div className="food-grid">
              {filteredFoods.map(food => (
                <div key={food?._id} className="food-card">
                  <img 
                    src={food?.image ? `http://localhost:4000/uploads/${food.image}` : ''} 
                    alt={food?.name || 'Food item'} 
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                  <h3>{food?.name || 'Unnamed Item'}</h3>
                  <p>{food?.description || 'No description available'}</p>
                  <p className="price">LKR {food?.price?.toFixed(2) || '0.00'}</p>
                  <button 
                    onClick={() => addToCart(food)}
                    className="add-to-cart-btn"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-section">
          <h2>Your Cart</h2>
          {!cart?.length ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item?.food?._id} className="cart-item">
                    <div className="item-details">
                      <h4>{item?.food?.name || 'Unnamed Item'}</h4>
                      <p>LKR {item?.food?.price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="quantity-controls">
                      <button style={{color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', fontSize: '1.2rem', margin: 0}} onClick={() => updateQuantity(item?.food?._id, (item?.quantity || 0) - 1)}>-</button>
                      <span style={{margin: 0}}>{item?.quantity || 0}</span>
                      <button style={{color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', fontSize: '1.2rem', margin: 0}} onClick={() => updateQuantity(item?.food?._id, (item?.quantity || 0) + 1)}>+</button>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item?.food?._id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="order-details">
                <div className="form-group">
                  <label htmlFor="specialInstructions">Special Instructions:</label>
                  <textarea
                    id="specialInstructions"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e?.target?.value || '')}
                    placeholder="Any special requests or dietary requirements?"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="deliveryTime">Preferred Delivery Time:</label>
                  <input
                    type="datetime-local"
                    id="deliveryTime"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e?.target?.value || '')}
                  />
                </div>

                <div className="total-section">
                  <h3>Total: LKR {calculateTotal().toFixed(2)}</h3>
                  <button
                    className="place-order-btn"
                    onClick={handleSubmitOrder}
                    disabled={orderSubmitting}
                  >
                    {orderSubmitting ? (
                      <>
                        <FaSpinner className="spinner" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <FaShoppingCart />
                        Place Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodOrdering; 