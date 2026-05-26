import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar({ brandName = 'SÀN TMĐT VIỆT NAM' }) {
  const { user, logout, isAdmin, isSeller } = useAuth();
  const navigate = useNavigate();

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
