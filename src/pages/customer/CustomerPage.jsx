import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';

function CustomerPage() {
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
    return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-primary)' }}>Đang tải thông tin khách hàng...</div>;
  }

  return (
    <DashboardLayout brandName="SÀN TMĐT VIỆT NAM">
      {/* Hero Welcome banner */}
      <div className="welcome-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        <h2 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Chào mừng bạn đến với tài khoản Khách hàng!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Hệ thống hiện tại đã ẩn đi tất cả các tính năng mua sắm, thanh toán và nâng cấp. Dưới đây là thông tin tài khoản của bạn sau khi đăng ký/đăng nhập thành công.
        </p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Profile Card */}
        <div className="info-card" style={{ padding: '35px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Thông Tin Cá Nhân Của Bạn
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
              <span style={{ color: 'var(--text-secondary)' }}>Số điện thoại:</span>
              <span style={{ color: 'var(--text-primary)' }}>{user.phone || 'Chưa cung cấp'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Nhóm Vai Trò:</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {user.roles?.map(role => (
                  <span key={role} className="badge">{role}</span>
                ))}
              </div>
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

export default CustomerPage;
