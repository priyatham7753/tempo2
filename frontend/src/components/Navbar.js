import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="navbar" role="navigation">
      <NavLink to="/" className="navbar-brand">ShopMesh</NavLink>
      <div className="navbar-links">
        <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-products">
          🛍 Products
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} id="nav-orders">
          📋 Orders {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </NavLink>
      </div>
      {user && (
        <div className="nav-user">
          <div className="nav-avatar" title={user.name}>{getInitials(user.name)}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.name}</span>
          <button className="btn-logout" onClick={logout} id="logout-btn">Sign Out</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
