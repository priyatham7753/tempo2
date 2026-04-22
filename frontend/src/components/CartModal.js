import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { orderAPI } from '../services/api';

const CartModal = ({ onClose }) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);

  const handlePlaceOrder = async () => {
    if (!address.trim() || address.trim().length < 5) {
      setError('Please enter a valid shipping address (at least 5 characters)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const orderPayload = {
        items: items.map(i => ({ product_id: i._id, quantity: i.quantity })),
        shipping_address: address.trim()
      };
      const res = await orderAPI.create(orderPayload);
      setOrderId(res.data.id);
      clearCart();
      setStep('success');
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || 'Failed to place order. Please try again.';
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 'cart' ? '🛒 Your Cart' : step === 'checkout' ? '📦 Checkout' : '✅ Order Placed!'}
          </h2>
          <button className="modal-close" onClick={onClose} id="close-cart-btn">✕</button>
        </div>

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--success)' }}>
              Order Confirmed!
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Your order has been placed successfully.</p>
            {orderId && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                Order ID: #{orderId.slice(-8).toUpperCase()}
              </p>
            )}
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={onClose} id="order-success-close-btn">
              Continue Shopping
            </button>
          </div>
        )}

        {step === 'cart' && (
          <>
            {items.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
                  {items.map(item => (
                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>${item.price.toFixed(2)} each</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-sm btn-secondary" style={{ padding: '0.25rem 0.625rem' }}
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button>
                        <span style={{ fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                        <button className="btn btn-sm btn-secondary" style={{ padding: '0.25rem 0.625rem' }}
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}>+</button>
                      </div>
                      <div style={{ fontWeight: 700, minWidth: '60px', textAlign: 'right', color: '#a78bfa' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button className="btn btn-danger btn-sm" style={{ padding: '0.25rem 0.625rem' }}
                        onClick={() => removeFromCart(item._id)}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-secondary" onClick={() => { clearCart(); }} style={{ flex: 1 }} id="clear-cart-btn">
                    Clear Cart
                  </button>
                  <button className="btn btn-primary" onClick={() => setStep('checkout')} style={{ flex: 2 }} id="proceed-checkout-btn">
                    Proceed to Checkout →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {step === 'checkout' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>ORDER SUMMARY</h4>
              {items.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                  <span>{item.name} ×{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: '#a78bfa' }}>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="shipping-address">Shipping Address</label>
              <textarea
                id="shipping-address"
                className="form-textarea"
                placeholder="123 Main St, City, State, ZIP, Country"
                value={address}
                onChange={e => { setAddress(e.target.value); setError(''); }}
                rows={3}
              />
            </div>

            {error && <div className="alert alert-error">⚠ {error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setStep('cart')} style={{ flex: 1 }}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={loading}
                style={{ flex: 2 }}
                id="place-order-btn"
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Placing Order...</>
                ) : (
                  '🎯 Place Order'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
