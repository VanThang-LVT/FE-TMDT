import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyNotificationsApi, getUnreadCountApi, markAsReadApi, markAllAsReadApi } from '../services/notification.service';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', newState);
      return newState;
    });
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Optional: Polling every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

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
    <div className={`admin-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <div className="admin-logo-box">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="admin-sidebar-title">
                <h1>Admin Portal</h1>
                <p>Quản trị hệ thống</p>
              </div>
            )}
          </div>
          <button 
            className="admin-sidebar-toggle-btn"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Phóng to" : "Thu nhỏ"}
          >
            <span className="material-symbols-outlined">
              {isSidebarCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`} title="Duyệt cửa hàng">
            <span className="material-symbols-outlined">storefront</span>
            {!isSidebarCollapsed && <span>Duyệt cửa hàng</span>}
          </NavLink>
          <NavLink to="/admin/categories" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`} title="Quản lý danh mục">
            <span className="material-symbols-outlined">category</span>
            {!isSidebarCollapsed && <span>Quản lý danh mục</span>}
          </NavLink>
          <NavLink to="/admin/products" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`} title="Duyệt Sản phẩm">
            <span className="material-symbols-outlined">inventory_2</span>
            {!isSidebarCollapsed && <span>Duyệt Sản phẩm</span>}
          </NavLink>
          <NavLink to="/admin/banners" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`} title="Quản lý Banner">
            <span className="material-symbols-outlined">view_carousel</span>
            {!isSidebarCollapsed && <span>Quản lý Banner</span>}
          </NavLink>
          <NavLink to="/admin/commissions" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`} title="Quản lý Hoa hồng">
            <span className="material-symbols-outlined">percent</span>
            {!isSidebarCollapsed && <span>Cấu hình Hoa hồng</span>}
          </NavLink>
          <NavLink to="/admin/email-logs" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`} title="Lịch sử Gửi Email">
            <span className="material-symbols-outlined">mail</span>
            {!isSidebarCollapsed && <span>Lịch sử Gửi Email</span>}
          </NavLink>
          <NavLink to="/admin/payments" className={({isActive}) => `admin-nav-item ${isActive ? 'active' : ''}`} title="Nhật ký thanh toán">
            <span className="material-symbols-outlined">receipt_long</span>
            {!isSidebarCollapsed && <span>Nhật ký thanh toán</span>}
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <a className="admin-nav-item text-error" onClick={handleLogoutClick} title="Đăng xuất">
            <span className="material-symbols-outlined">logout</span>
            {!isSidebarCollapsed && <span>Đăng xuất</span>}
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-search-placeholder"></div>
          
          <div className="admin-topbar-right">
            <div className="admin-notification" ref={notificationRef} onClick={() => setShowNotifications(!showNotifications)}>
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="admin-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Thông báo</h4>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} className="mark-all-read">Đánh dấu đã đọc</button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <p className="no-notifications">Không có thông báo nào</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.notificationId} 
                          className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                          onClick={(e) => handleNotificationClick(notif, e)}
                        >
                          <div className="notification-icon">
                            <span className="material-symbols-outlined">info</span>
                          </div>
                          <div className="notification-content" style={{ textAlign: 'left' }}>
                            <h5>{notif.title}</h5>
                            <p>{notif.content}</p>
                            <span className="notification-time">
                              {new Date(notif.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {!notif.isRead && <div className="unread-dot"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-profile">
              <div className="admin-profile-text">
                <p className="admin-profile-name">{user?.fullName || 'Admin'}</p>
                <p className="admin-profile-role">Quản trị viên cấp cao</p>
              </div>
              <div className="admin-avatar">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
