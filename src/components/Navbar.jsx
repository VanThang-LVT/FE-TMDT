import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyNotificationsApi, getUnreadCountApi, markAsReadApi, markAllAsReadApi } from '../services/notification.service';
import logoImg from '../assets/logo.png';

function Navbar({ brandName = 'EoViTi' }) {
  const { user, token, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();

  const { cart } = useCart();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const cartRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setShowCart(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  const fetchNotifications = async () => {
    try {
      const [notifs, unread] = await Promise.all([
        getMyNotificationsApi(token),
        getUnreadCountApi(token)
      ]);
      setNotifications(notifs);
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif, e) => {
    e.stopPropagation();
    if (!notif.isRead) {
      try {
        await markAsReadApi(notif.notificationId, token);
        setNotifications(notifications.map(n =>
          n.notificationId === notif.notificationId ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsReadApi(token);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">

        {/* Brand Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={logoImg}
            alt="EoViTi Logo"
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }}
          />
          <span className="brand" style={{ margin: 0 }}>
            {brandName}
          </span>
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="navbar-search">
          <input
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            type="text"
          />
          <span className="material-symbols-outlined search-icon">search</span>
        </div>

        {/* Navigation Links & Actions */}
        <nav className="nav-actions">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="icon-btn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge-count">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="user-dropdown-menu" style={{ width: '320px' }}>
                    <div className="user-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p className="user-name">Thông báo</p>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12px', cursor: 'pointer' }}>
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <p>Không có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.notificationId}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid var(--border-color)',
                              display: 'flex',
                              gap: '12px',
                              cursor: 'pointer',
                              background: notif.isRead ? 'transparent' : '#f8fafc',
                              opacity: notif.isRead ? 0.7 : 1
                            }}
                            onClick={(e) => handleNotificationClick(notif, e)}
                          >
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined">info</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <h5 style={{ margin: 0, fontSize: '14px', color: notif.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{notif.title}</h5>
                              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{notif.content}</p>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                                {new Date(notif.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            {!notif.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', marginTop: '6px', flexShrink: 0 }}></div>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Shopping Cart Dropdown */}
              <div className="relative" ref={cartRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="icon-btn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>shopping_cart</span>
                  {cart?.items?.length > 0 && (
                    <span className="badge-count">
                      {cart.items.length > 9 ? '9+' : cart.items.length}
                    </span>
                  )}
                </button>

                {showCart && (
                  <div className="user-dropdown-menu" style={{ width: '380px' }}>
                    <div className="user-dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p className="user-name">Giỏ hàng</p>
                    </div>
                    
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      {!cart || !cart.items || cart.items.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <p>Giỏ hàng trống</p>
                        </div>
                      ) : (
                        cart.items.map(item => (
                          <div
                            key={item.cartItemId}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid var(--border-color)',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center',
                              cursor: 'pointer'
                            }}
                          >

                            <img 
                              src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : 'https://via.placeholder.com/50'} 
                              alt={item.productName} 
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h5 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.productName}
                              </h5>
                              {item.attributes && item.attributes.length > 0 && (
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  {item.attributes.map(a => a.value).join(', ')}
                                </p>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#e53e3e' }}>
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>x{item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {cart && cart.items && cart.items.length > 0 && (
                      <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {cart.items.length} mặt hàng
                        </span>
                        <button 
                          onClick={() => { setShowCart(false); navigate('/cart'); }}
                          style={{
                            padding: '8px 16px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Xem Chi Tiết
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative" ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="icon-btn"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>account_circle</span>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <p className="user-name">{user.fullName}</p>
                      <p className="user-email">{user.email}</p>

                      <div style={{ marginTop: '8px' }}>
                        {isAdmin() ? (
                          <span className="badge badge-admin">Quản trị viên</span>
                        ) : isSeller() ? (
                          <span className="badge" style={{ background: 'var(--success-glow)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>Người bán</span>
                        ) : (
                          <span className="badge">Khách hàng</span>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '8px 0' }}>
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="material-symbols-outlined">person</span>
                        Thông tin cá nhân
                      </Link>
                      <Link to="/cart" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="material-symbols-outlined">shopping_cart</span>
                        Giỏ hàng
                      </Link>
                      <Link to="/orders/history" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="material-symbols-outlined">history</span>
                        Lịch sử đơn hàng
                      </Link>
                      <Link to="/orders" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="material-symbols-outlined">receipt_long</span>
                        Đơn hàng
                      </Link>

                      {(!isSeller() && !isAdmin()) && (
                        <Link to="/register-shop" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <span className="material-symbols-outlined">storefront</span>
                          Đăng ký gian hàng
                        </Link>
                      )}

                      {isAdmin() && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <span className="material-symbols-outlined">admin_panel_settings</span>
                          Trang Quản Trị
                        </Link>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }}></div>

                      <button onClick={handleLogoutClick} className="dropdown-item danger">
                        <span className="material-symbols-outlined">logout</span>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => navigate('/login')}
                className="btn-outline"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary"
              >
                Đăng ký
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
