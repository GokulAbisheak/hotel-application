import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaSpinner } from 'react-icons/fa';
import '../styles/PaymentForm.css';

const PaymentForm = ({ amount, clientSecret, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              // You can add billing details here if needed
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

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount">
        <h3>Total Amount: LKR {amount.toFixed(2)}</h3>
      </div>

      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && <div className="payment-error">{error}</div>}

      <button
        type="submit"
        className="payment-button"
        disabled={!stripe || processing}
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