import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerShopApi, getMyShopApi } from '../../services/shop.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import Alert from '../../components/Alert';
import './CustomerPage.css';

function ShopRegistrationPage() {
  const { user, token, authLoading } = useAuth();
  const navigate = useNavigate();
  
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

        });
    }
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      const res = await registerShopApi(shopName, phone, address, description, token);
      setSuccess('Đăng ký thành công! Đang chờ Admin duyệt.');
      setShopData(res.data);
    } catch {
      setError('Đăng ký không thành công. Vui lòng kiểm tra kết nối mạng.');
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-primary)' }}>Đang tải...</div>;
  }

  return (
    <DashboardLayout brandName="EoViTi">
      <div className="shop-reg-container">
        <div className="info-card shop-reg-card">
          <h2 className="shop-reg-title">
            Đăng Ký Trở Thành Người Bán
          </h2>
          
          <div className="shop-reg-alerts">
            <Alert type="danger" message={error} />
            <Alert type="success" message={success} />
          </div>
          
          {shopData ? (
            <div className="shop-reg-data-container">
              <p className="shop-reg-data-row">
                Tên gian hàng: <strong className="shop-reg-data-value">{shopData.shopName}</strong>
              </p>
              <p className="shop-reg-data-row">
                Địa chỉ: <strong className="shop-reg-data-value">{shopData.address}</strong>
              </p>
              <p className="shop-reg-status-row">
                Trạng thái: 
                <span className={
                  shopData.status === 'PENDING' ? 'badge badge-admin shop-reg-badge' :
                  shopData.status === 'REJECTED' ? 'badge badge-danger shop-reg-badge' : 'badge shop-reg-badge'
                }>
                  {shopData.status === 'PENDING' ? 'ĐANG CHỜ DUYỆT' : 
                   shopData.status === 'REJECTED' ? 'BỊ TỪ CHỐI' : shopData.status}
                </span>
              </p>
              {shopData.status === 'PENDING' && (
                <p className="shop-reg-pending-msg">
                  Yêu cầu của bạn đã được gửi. Vui lòng chờ Quản trị viên xét duyệt. Sau khi được duyệt, hãy đăng xuất và đăng nhập lại để vào trang Người Bán.
                </p>
              )}
              {shopData.status === 'ACTIVE' && (
                <p className="shop-reg-active-msg">
                  Gian hàng của bạn đã được duyệt. Hãy thoát ra và đăng nhập lại để cập nhật quyền hạn!
                </p>
              )}
              {shopData.status === 'REJECTED' && (
                <div className="shop-reg-rejected-container">
                  <p className="shop-reg-rejected-title">
                    Yêu cầu đăng ký gian hàng của bạn đã bị từ chối!
                  </p>
                  {shopData.rejectReason && (
                    <p className="shop-reg-rejected-reason">
                      <strong>Lý do: </strong> {shopData.rejectReason}
                    </p>
                  )}
                  <button 
                    type="button"
                    className="btn shop-reg-resubmit-btn" 
                    onClick={() => {
                        setShopName(shopData.shopName || '');
                        setPhone(shopData.phone || '');
                        setAddress(shopData.address || '');
                        setDescription(shopData.description || '');
                        setShopData(null); 
                    }}
                  >
                    Gửi lại yêu cầu đăng ký
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="shop-reg-form">
              <div className="form-group shop-reg-form-group">
                <label>Tên gian hàng</label>
                <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} required placeholder="VD: Shop Đồ Gia Dụng" />
              </div>
              <div className="form-group shop-reg-form-group">
                <label>Số điện thoại liên hệ</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="VD: 0987654321" />
              </div>
              <div className="form-group shop-reg-form-group">
                <label>Địa chỉ kho hàng</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Nhập địa chỉ chi tiết" />
              </div>
              <div className="form-group shop-reg-form-group">
                <label>Mô tả (Ngành hàng chính)</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  required 
                  placeholder="VD: Chuyên các mặt hàng điện tử, phụ kiện..."
                  className="shop-reg-textarea"
                />
              </div>
              <button type="submit" className="btn shop-reg-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'ĐANG XỬ LÝ...' : 'GỬI YÊU CẦU ĐĂNG KÝ'}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ShopRegistrationPage;
