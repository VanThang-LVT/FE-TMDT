import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerShopApi, getMyShopApi } from '../../services/shop.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import Alert from '../../components/Alert';

function CustomerPage() {
  const { user, token, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // State for shop registration form
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  
  const [shopData, setShopData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && token) {
      getMyShopApi(token)
        .then(res => setShopData(res.data))
        .catch(err => {
          // Không log lỗi ra vì nếu chưa đăng ký nó sẽ văng lỗi 400
        });
    }
  }, [user, token]);

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      const res = await registerShopApi(shopName, phone, address, description, token);
      setSuccess('Đăng ký thành công! Đang chờ Admin duyệt.');
      setShopData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Shop Registration Box */}
        <div className="info-card" style={{ marginTop: '30px', padding: '35px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Đăng Ký Trở Thành Người Bán
          </h3>
          
          <div style={{ marginTop: '20px' }}>
            <Alert type="danger" message={error} />
            <Alert type="success" message={success} />
          </div>
          
          {shopData ? (
            <div style={{ marginTop: '10px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Tên gian hàng: <strong style={{ color: 'var(--text-primary)' }}>{shopData.shopName}</strong>
              </p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Địa chỉ: <strong style={{ color: 'var(--text-primary)' }}>{shopData.address}</strong>
              </p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
                Trạng thái: 
                <span className={
                  shopData.status === 'PENDING' ? 'badge badge-admin' :
                  shopData.status === 'REJECTED' ? 'badge badge-danger' : 'badge'
                } style={{ marginLeft: '10px' }}>
                  {shopData.status === 'PENDING' ? 'ĐANG CHỜ DUYỆT' : 
                   shopData.status === 'REJECTED' ? 'BỊ TỪ CHỐI' : shopData.status}
                </span>
              </p>
              {shopData.status === 'PENDING' && (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', marginTop: '10px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
                  Yêu cầu của bạn đã được gửi. Vui lòng chờ Quản trị viên xét duyệt. Sau khi được duyệt, hãy đăng xuất và đăng nhập lại để vào trang Người Bán.
                </p>
              )}
              {shopData.status === 'ACTIVE' && (
                <p style={{ color: '#6ee7b7', fontSize: '14px', marginTop: '10px' }}>
                  Gian hàng của bạn đã được duyệt. Hãy thoát ra và đăng nhập lại để cập nhật quyền hạn!
                </p>
              )}
              {shopData.status === 'REJECTED' && (
                <div style={{ marginTop: '15px', background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>
                    Yêu cầu đăng ký gian hàng của bạn đã bị từ chối!
                  </p>
                  {shopData.rejectReason && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                      <strong>Lý do: </strong> {shopData.rejectReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Tên gian hàng</label>
                <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} required placeholder="VD: Shop Đồ Gia Dụng" />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Số điện thoại liên hệ</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="VD: 0987654321" />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Địa chỉ kho hàng</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Nhập địa chỉ chi tiết" />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Mô tả (Ngành hàng chính)</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} required placeholder="VD: Chuyên các mặt hàng điện tử, phụ kiện..." />
              </div>
              <button type="submit" className="btn" disabled={isSubmitting} style={{ marginTop: '10px' }}>
                {isSubmitting ? 'ĐANG XỬ LÝ...' : 'GỬI YÊU CẦU ĐĂNG KÝ'}
              </button>
            </form>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default CustomerPage;
