import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SellerLayout from '../../layouts/SellerLayout';
import './SellerPage.css';

function SellerPage() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isSeller()) {
        navigate('/');
      }
    }
  }, [user, authLoading, isSeller, navigate]);


  if (authLoading || !user || !isSeller()) {
    return <div className="seller-loading">Đang tải không gian Nhà Bán Hàng...</div>;
  }

  return (
    <SellerLayout>
      <div className="welcome-card seller-welcome-card">
        <h2 className="seller-welcome-title">Chào mừng Nhà Bán Hàng, {user.fullName}!</h2>
        <p className="seller-welcome-text">
          Đây là không gian dành riêng cho Người bán (Seller). Bạn có thể truy cập Quản lý sản phẩm để đăng bán và chờ duyệt.
        </p>
      </div>

      <div className="seller-profile-container">
        <div className="info-card seller-profile-card">
          <h3 className="seller-profile-title">
            Thông Tin Chủ Gian Hàng
          </h3>

          <div className="seller-profile-list">
            <div className="seller-profile-row">
              <span className="seller-profile-label">Họ và tên:</span>
              <strong className="seller-profile-value">{user.fullName}</strong>
            </div>

            <div className="seller-profile-row">
              <span className="seller-profile-label">Email liên hệ:</span>
              <span className="seller-profile-value">{user.email}</span>
            </div>

            <div className="seller-profile-row">
              <span className="seller-profile-label">Vai trò truy cập:</span>
              <span className="badge seller-role-badge">ROLE_SELLER</span>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}

export default SellerPage;
