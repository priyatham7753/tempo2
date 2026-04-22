import React, { useState, useEffect, useCallback } from 'react';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartModal from '../components/CartModal';

const CATEGORIES = ['All', 'Electronics', 'Clothing', 'Books', 'Food', 'Furniture', 'Sports', 'Toys', 'Beauty', 'Other'];

const ProductsPage = () => {
  const { addToCart, totalItems } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cartOpen, setCartOpen] = useState(false);
  const [addedMap, setAddedMap] = useState({});

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      const res = await productAPI.getAll(params);
      let prods = res.data.products || [];
      if (search.trim()) {
        const s = search.toLowerCase();
        prods = prods.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
      }
      setProducts(prods);
    } catch (err) {
      setError('Failed to load products. Please check that the product service is running.');
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedMap(prev => ({ ...prev, [product._id]: true }));
    setTimeout(() => setAddedMap(prev => ({ ...prev, [product._id]: false })), 1500);
  };

  return (
    <div className="app-wrapper">
      {/* Hero */}
      <div className="main-content">
        <div className="hero">
          <h1 className="hero-title">Discover Premium Products</h1>
          <p className="hero-subtitle">Shop from our curated collection of top-quality products. Fast shipping, easy returns.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' })}>
              Browse Products
            </button>
            <button className="btn btn-secondary" onClick={() => setCartOpen(true)}>
              🛒 Cart {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="hero-stat-number">{products.length}+</div><div className="hero-stat-label">Products</div></div>
            <div className="hero-stat"><div className="hero-stat-number">4</div><div className="hero-stat-label">Microservices</div></div>
            <div className="hero-stat"><div className="hero-stat-number">99.9%</div><div className="hero-stat-label">Uptime</div></div>
          </div>
        </div>

        {/* Filters */}
        <div id="products-section" className="page-header">
          <h2 className="page-title">All Products</h2>
          <p className="page-subtitle">
            Welcome back, <strong style={{ color: '#a78bfa' }}>{user?.name}</strong>! Find something you love.
          </p>
        </div>

        <div className="filter-bar">
          <input
            className="filter-input"
            type="text"
            placeholder="🔍  Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="search-input"
          />
          <select
            className="filter-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
            id="category-filter"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={() => setCartOpen(true)} id="open-cart-btn">
            🛒 Cart {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
        </div>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span>Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No products found</h3>
            <p>Try a different search term or category</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product._id} className="product-card">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="product-image"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className="product-image-placeholder" style={{ display: product.imageUrl ? 'none' : 'flex' }}>📦</div>
                <div className="product-body">
                  <div className="product-category">{product.category}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-description">{product.description}</div>
                  <div className="product-footer">
                    <div>
                      <div className="product-price">${product.price.toFixed(2)}</div>
                      <div className={`product-stock ${product.stock === 0 ? 'out' : product.stock < 10 ? 'low' : ''}`}>
                        {product.stock === 0 ? 'Out of stock' : product.stock < 10 ? `Only ${product.stock} left` : `${product.stock} in stock`}
                      </div>
                    </div>
                    <button
                      className={`btn btn-sm ${addedMap[product._id] ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      id={`add-cart-${product._id}`}
                    >
                      {addedMap[product._id] ? '✓ Added!' : '+ Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartOpen && <CartModal onClose={() => setCartOpen(false)} />}
    </div>
  );
};

export default ProductsPage;
