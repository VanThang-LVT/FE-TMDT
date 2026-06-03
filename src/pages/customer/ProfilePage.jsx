import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import './CustomerPage.css';

function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  if (authLoading || !user) {
    return <div className="profile-loading">Đang tải thông tin cá nhân...</div>;
  }

  return (
    <DashboardLayout brandName="EoViTi">
      {/* Hero Welcome banner */}
      <div className="welcome-card profile-welcome-card">
        <h2 className="profile-welcome-title">Xin chào, {user.fullName}!</h2>
        <p className="profile-welcome-text">
          Đây là trang quản lý thông tin cá nhân của bạn. Dưới đây là các thông tin chi tiết về tài khoản của bạn trên hệ thống EoViTi.
        </p>
      </div>

      <div className="profile-container">
        {/* Profile Card */}
        <div className="info-card profile-card">
          <h3 className="profile-card-title">
            Thông Tin Cá Nhân Của Bạn
          </h3>

          <div className="profile-info-list">
            <div className="profile-info-row">
              <span className="profile-info-label">Họ và tên:</span>
              <strong className="profile-info-value">{user.fullName}</strong>
            </div>

            <div className="profile-info-row">
              <span className="profile-info-label">Email đăng ký:</span>
              <span className="profile-info-value">{user.email}</span>
            </div>

            <div className="profile-info-row">
              <span className="profile-info-label">Số điện thoại:</span>
              <span className="profile-info-value">{user.phone || 'Chưa cung cấp'}</span>
            </div>

            <div className="profile-info-row">
              <span className="profile-info-label">Nhóm Vai Trò:</span>
              <div className="profile-roles-container">
                {user.roles?.map(role => (
                  <span key={role} className="badge">{role}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-logout-container">
            <button
              className="btn btn-secondary profile-logout-btn"
              onClick={handleLogoutClick}
            >
              ĐĂNG XUẤT KHỎI HỆ THỐNG
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;
