import axios from 'axios';

const AUTH_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_URL = process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_URL = process.env.REACT_APP_ORDER_SERVICE_URL || 'http://localhost:3003';

// Helper: get auth headers
const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Auth API ─────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => axios.post(`${AUTH_URL}/api/auth/register`, data),
  login: (data) => axios.post(`${AUTH_URL}/api/auth/login`, data),
  getMe: () => axios.get(`${AUTH_URL}/api/auth/me`, { headers: authHeader() }),
};

// ─── Product API ──────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params = {}) => axios.get(`${PRODUCT_URL}/api/products`, { params }),
  getById: (id) => axios.get(`${PRODUCT_URL}/api/products/${id}`),
  create: (data) => axios.post(`${PRODUCT_URL}/api/products`, data, { headers: authHeader() }),
  update: (id, data) => axios.put(`${PRODUCT_URL}/api/products/${id}`, data, { headers: authHeader() }),
  delete: (id) => axios.delete(`${PRODUCT_URL}/api/products/${id}`, { headers: authHeader() }),
};

// ─── Order API ────────────────────────────────────────────────────────────
export const orderAPI = {
  create: (data) => axios.post(`${ORDER_URL}/api/orders`, data, { headers: authHeader() }),
  getMyOrders: () => axios.get(`${ORDER_URL}/api/orders`, { headers: authHeader() }),
  getById: (id) => axios.get(`${ORDER_URL}/api/orders/${id}`, { headers: authHeader() }),
  updateStatus: (id, status) => axios.patch(`${ORDER_URL}/api/orders/${id}/status`, { status }, { headers: authHeader() }),
};
