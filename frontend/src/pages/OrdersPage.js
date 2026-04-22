import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';

const STATUS_CLASSES = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.data || []);
    } catch (err) {
      setError('Failed to load orders. Please check that the order service is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(orderId);
    try {
      await orderAPI.updateStatus(orderId, 'cancelled');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel order');
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">Track and manage your orders</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders} id="refresh-orders-btn">
          ↻ Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
          <span>Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No orders yet</h3>
          <p>Browse products and place your first order!</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-id">Order #{order.id.slice(-8).toUpperCase()}</div>
                  <div className="order-date">{formatDate(order.created_at)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`order-status ${STATUS_CLASSES[order.status] || 'status-pending'}`}>
                    {order.status}
                  </span>
                  {order.status === 'pending' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(order.id)}
                      disabled={cancelling === order.id}
                      id={`cancel-order-${order.id}`}
                    >
                      {cancelling === order.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <div className="order-item-name">
                      {item.product_name} <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span>
                    </div>
                    <div>${item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {order.shipping_address && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  📦 {order.shipping_address}
                </div>
              )}

              <div className="order-total">
                <span className="order-total-label">Total Amount</span>
                <span className="order-total-amount">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
