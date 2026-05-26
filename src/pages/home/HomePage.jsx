import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';

function HomePage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout brandName="SÀN TMĐT VIỆT NAM">
      <div className="welcome-card" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '50px' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '32px' }}>Trang Chủ Sàn Thương Mại Điện Tử</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '16px' }}>
          Hệ thống hiện tại đang trong giai đoạn phát triển. Tính năng trưng bày sản phẩm sẽ được cập nhật sau.<br/>
          Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>
            ĐĂNG NHẬP
          </button>
          <button className="btn" onClick={() => navigate('/register')}>
            ĐĂNG KÝ
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default HomePage;