import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyNotificationsApi, getUnreadCountApi, markAsReadApi, markAllAsReadApi } from '../services/notification.service';
import logoImg from '../assets/logo.png';
import PromptModal from './modals/PromptModal';

function Navbar({ brandName = 'EoViTi' }) {
  const { user, token, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();

  const { cart } = useCart();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [searchInput, setSearchInput] = useState('');

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

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      navigate(`/?keyword=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handlePromptSearch = (prompt) => {
    setShowPromptModal(false);
    if (prompt.trim()) {
      navigate(`/?prompt=${encodeURIComponent(prompt.trim())}`);
    }
  };

  return (
    <>
      <header className="navbar-container">
      <div className="navbar-content">

        {/* Brand Logo */}
        <Link to="/" className="navbar-logo-link">
          <img
            src={logoImg}
            alt="EoViTi Logo"
            className="navbar-logo-img"
          />
          <span className="brand">
            {brandName}
          </span>
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="navbar-search navbar-search-wrapper">
          <div className="navbar-search-input-container">
            <input
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearch}
            />
            <span 
              className="material-symbols-outlined search-icon navbar-search-icon-clickable" 
              onClick={() => {
                if (searchInput.trim()) {
                  navigate(`/?keyword=${encodeURIComponent(searchInput.trim())}`);
                }
              }}
            >
              search
            </span>
          </div>
          <button 
            onClick={() => setShowPromptModal(true)}
            className="icon-btn navbar-ai-btn" 
            title="Tìm kiếm thông minh bằng AI"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
          </button>
        </div>

        {/* Navigation Links & Actions */}
        <nav className="nav-actions">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="icon-btn"
                >
                  <span className="material-symbols-outlined navbar-icon-28">notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge-count">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="user-dropdown-menu notif-menu">
                    <div className="user-dropdown-header flex-header">
                      <p className="user-name">Thông báo</p>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="dropdown-scroll-area">
                      {notifications.length === 0 ? (
                        <div className="dropdown-empty-state">
                          <p>Không có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.notificationId}
                            className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
                            onClick={(e) => handleNotificationClick(notif, e)}
                          >
                            <div className="notif-icon-wrapper">
                              <span className="material-symbols-outlined">info</span>
                            </div>
                            <div className="notif-content-wrapper">
                              <h5 className={`notif-title ${notif.isRead ? 'read' : 'unread'}`}>{notif.title}</h5>
                              <p className="notif-body">{notif.content}</p>
                              <span className="notif-time">
                                {new Date(notif.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            {!notif.isRead && <div className="notif-unread-dot"></div>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Shopping Cart Dropdown */}
              <div className="relative" ref={cartRef}>
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="icon-btn"
                >
                  <span className="material-symbols-outlined navbar-icon-28">shopping_cart</span>
                  {cart?.items?.length > 0 && (
                    <span className="badge-count">
                      {cart.items.length > 9 ? '9+' : cart.items.length}
                    </span>
                  )}
                </button>

                {showCart && (
                  <div className="user-dropdown-menu cart-menu">
                    <div className="user-dropdown-header flex-header">
                      <p className="user-name">Giỏ hàng</p>
                    </div>
                    
                    <div className="dropdown-scroll-area">
                      {!cart || !cart.items || cart.items.length === 0 ? (
                        <div className="dropdown-empty-state">
                          <p>Giỏ hàng trống</p>
                        </div>
                      ) : (
                        cart.items.map(item => (
                          <div
                            key={item.cartItemId}
                            className="cart-item"
                          >

                            <img 
                              src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : 'https://via.placeholder.com/50'} 
                              alt={item.productName} 
                              className="cart-item-img"
                            />
                            <div className="cart-item-info">
                              <h5 className="cart-item-name">
                                {item.productName}
                              </h5>
                              {item.attributes && item.attributes.length > 0 && (
                                <p className="cart-item-attrs">
                                  {item.attributes.map(a => a.value).join(', ')}
                                </p>
                              )}
                              <div className="cart-item-meta">
                                <span className="cart-item-price">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                </span>
                                <span className="cart-item-qty">x{item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {cart && cart.items && cart.items.length > 0 && (
                      <div className="cart-dropdown-footer">
                        <span className="cart-summary-text">
                          {cart.items.length} mặt hàng
                        </span>
                        <button 
                          onClick={() => { setShowCart(false); navigate('/cart'); }}
                          className="cart-view-details-btn"
                        >
                          Xem Chi Tiết
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="icon-btn"
                >
                  <span className="material-symbols-outlined navbar-icon-32">account_circle</span>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <p className="user-name">{user.fullName}</p>
                      <p className="user-email">{user.email}</p>

                      <div className="user-badge-container">
                        {isAdmin() ? (
                          <span className="badge badge-admin">Quản trị viên</span>
                        ) : isSeller() ? (
                          <span className="badge badge-seller">Người bán</span>
                        ) : (
                          <span className="badge">Khách hàng</span>
                        )}
                      </div>
                    </div>

                    <div className="dropdown-items-list">
                      <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="material-symbols-outlined">person</span>
                        Thông tin cá nhân
                      </Link>
                      <Link to="/change-password" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <span className="material-symbols-outlined">lock_reset</span>
                        Đổi mật khẩu
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

                      <div className="user-dropdown-divider"></div>

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
            <div className="auth-buttons-container">
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
      
      <PromptModal
        isOpen={showPromptModal}
        title="Tìm kiếm thông minh (AI)"
        label="Bạn đang tìm kiếm gì?"
        placeholder="Ví dụ: Tôi muốn tìm một chiếc áo sơ mi nam màu trắng để đi dự tiệc, chất liệu mát mẻ..."
        onConfirm={handlePromptSearch}
        onCancel={() => setShowPromptModal(false)}
        confirmText="Tìm kiếm"
        type="primary"
      />
    </>
  );
}

export default Navbar;
