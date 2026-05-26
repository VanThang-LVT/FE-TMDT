import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';

function SellerPage() {
  const { user, isSeller, logout, loading: authLoading } = useAuth();
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

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  if (authLoading || !user || !isSeller()) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-primary)' }}>Đang tải không gian Nhà Bán Hàng...</div>;
  }

  return (
    <DashboardLayout brandName="SÀN TMĐT VIỆT NAM">
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Chào mừng Nhà Bán Hàng, {user.fullName}!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Đây là không gian dành riêng cho Người bán (Seller). Hiện tại các chức năng thêm sản phẩm và quản lý đơn hàng đang được ẩn đi để tập trung vào luồng tài khoản.
        </p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="info-card" style={{ padding: '35px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Thông Tin Chủ Gian Hàng
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Họ và tên:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user.fullName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email liên hệ:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user.email}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Vai trò truy cập:</span>
              <span className="badge" style={{ background: 'var(--success-glow)', color: '#6ee7b7', borderColor: 'rgba(16, 185, 129, 0.3)' }}>ROLE_SELLER</span>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={handleLogoutClick}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--error-color)', color: '#fda4af', transition: 'all 0.3s' }}
              onMouseOver={(e) => e.target.style.background = 'var(--error-glow)'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              ĐĂNG XUẤT
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SellerPage;
