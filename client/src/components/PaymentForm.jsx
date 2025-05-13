import React, { useState } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { FaSpinner } from 'react-icons/fa';
import './PaymentForm.css';

const PaymentForm = ({ amount, clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [cardComplete, setCardComplete] = useState(false);
  const [expiryComplete, setExpiryComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);

  const handleChange = (event, setComplete) => {
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
    setComplete(event.complete);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);
    setError(null);

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              // Optional billing details
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError(stripeError);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      onError(err);
    } finally {
      setProcessing(false);
    }
  };

  const isFormComplete = cardComplete && expiryComplete && cvcComplete;

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount">
        <h3>Total Amount: LKR {amount.toFixed(2)}</h3>
      </div>

      <div className="card-element-row">
        <label>Card Number</label>
        <CardNumberElement
          className="card-input"
          onChange={(e) => handleChange(e, setCardComplete)}
        />
      </div>

      <div className="card-element-row">
        <label>Expiry Date</label>
        <CardExpiryElement
          className="card-input"
          onChange={(e) => handleChange(e, setExpiryComplete)}
        />
      </div>

      <div className="card-element-row">
        <label>CVC</label>
        <CardCvcElement
          className="card-input"
          onChange={(e) => handleChange(e, setCvcComplete)}
        />
      </div>

      {error && <div className="payment-error">{error}</div>}

      <button
        type="submit"
        className="payment-button"
        disabled={!stripe || processing || !isFormComplete}
      >
        {processing ? (
          <FaSpinner className="spinner" />
        ) : (
          `Pay LKR ${amount}`
        )}
      </button>
    </form>
  );
};

export default PaymentForm;
