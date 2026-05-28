import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyNotificationsApi, getUnreadCountApi, markAsReadApi, markAllAsReadApi } from '../services/notification.service';

function Navbar({ brandName = 'SÀN TMĐT VIỆT NAM' }) {
  const { user, token, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="brand">{brandName}</div>
      </Link>
      <div className="user-nav-info">
        {user ? (
          <>
            <div className="admin-notification" onClick={() => setShowNotifications(!showNotifications)} style={{ marginRight: '10px' }}>
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="admin-badge" style={{ top: '0px', right: '0px', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              
              {showNotifications && (
                <div className="notification-dropdown" style={{ top: '45px' }}>
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
            
            <span>Xin chào, <strong>{user.fullName}</strong></span>
            {isAdmin() ? (
              <span className="badge badge-admin">Quản trị viên</span>
            ) : isSeller() ? (
              <span className="badge" style={{ background: 'var(--success-glow)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.3)' }}>Người bán</span>
            ) : (
              <span className="badge">Khách hàng</span>
            )}
            <button className="btn-logout" onClick={handleLogoutClick}>ĐĂNG XUẤT</button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-logout" onClick={() => navigate('/login')}>ĐĂNG NHẬP</button>
            <button className="btn" style={{ padding: '8px 16px', margin: 0, width: 'auto', fontSize: '13px' }} onClick={() => navigate('/register')}>ĐĂNG KÝ</button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
