import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyNotificationsApi, getUnreadCountApi, markAsReadApi, markAllAsReadApi } from '../../services/notification.service';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-box">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </div>
          <div className="admin-sidebar-title">
            <h1>Admin Portal</h1>
            <p>Quản trị hệ thống</p>
          </div>
        </div>

        <nav className="admin-nav">
          <a className="admin-nav-item active" onClick={() => navigate('/admin')}>
            <span className="material-symbols-outlined">storefront</span>
            Duyệt cửa hàng
          </a>
        </nav>

        <div className="admin-sidebar-footer">
          <a className="admin-nav-item text-error" onClick={handleLogoutClick}>
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-search">
            <span className="material-symbols-outlined" style={{color: '#94a3b8'}}>search</span>
            <input type="text" placeholder="Tìm kiếm gian hàng..." />
          </div>
          
          <div className="admin-topbar-right">
            <div className="admin-notification" onClick={() => setShowNotifications(!showNotifications)}>
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
