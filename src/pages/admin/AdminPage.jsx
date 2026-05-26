import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';

function AdminPage() {
  const { user, isAdmin, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isAdmin()) {
        navigate('/customer'); // Protect route
      }
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  if (authLoading || !user || !isAdmin()) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-primary)' }}>Đang xác thực quyền Admin...</div>;
  }

  return (
    <DashboardLayout brandName="TMDT ADMIN PORTAL">
      {/* Welcome Banner */}
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Xin chào Admin, {user.fullName}!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Hệ thống hiện tại đã lược bỏ toàn bộ các chức năng quản trị phức tạp khác và chỉ giữ lại chức năng Đăng ký & Đăng nhập theo yêu cầu của bạn.
        </p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="info-card" style={{ padding: '35px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Thông Tin Tài Khoản Quản Trị
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Họ và tên:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{user.fullName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email đăng ký:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user.email}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Vai trò:</span>
              <span className="badge badge-admin">ROLE_ADMIN</span>
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
              ĐĂNG XUẤT KHỎI HỆ THỐNG
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminPage;
