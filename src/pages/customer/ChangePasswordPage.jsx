import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendForgotPasswordOtpApi, resetPasswordApi } from '../../services/auth.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import Alert from '../../components/Alert';
import './CustomerPage.css';

function ChangePasswordPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingPw, setLoadingPw] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleSendOtp = async () => {
    setPwError('');
    setPwMessage('');
    setSendingOtp(true);
    try {
      await sendForgotPasswordOtpApi(user.email);
      setPwMessage('Đã gửi mã OTP đến email của bạn.');
    } catch (err) {
      setPwError(err.message || 'Không thể gửi OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwMessage('');

    if (!otp || !newPassword) {
      setPwError('Vui lòng nhập mã OTP và mật khẩu mới.');
      return;
    }
    
    setLoadingPw(true);
    try {
      await resetPasswordApi(user.email, otp, newPassword);
      setPwMessage('Đổi mật khẩu thành công!');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setPwError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoadingPw(false);
    }
  };

  if (authLoading || !user) {
    return <div className="profile-loading">Đang tải...</div>;
  }

  return (
    <DashboardLayout brandName="EoViTi">
      <div className="profile-container">
        <div className="info-card profile-card profile-password-card" style={{ marginTop: '40px' }}>
          <h3 className="profile-card-title">Đổi Mật Khẩu</h3>
          
          <Alert type="success" message={pwMessage} />
          <Alert type="danger" message={pwError} />

          <div className="profile-password-intro">
            <p className="profile-password-desc">
              Để đổi mật khẩu, vui lòng lấy mã xác nhận OTP gửi về email đăng ký <strong>{user.email}</strong> của bạn.
            </p>
            <button 
              className="btn btn-secondary profile-otp-btn" 
              onClick={handleSendOtp}
              disabled={sendingOtp}
            >
              {sendingOtp ? 'Đang gửi...' : 'Lấy mã OTP'}
            </button>
          </div>

          <form onSubmit={handleChangePassword}>
            <div className="form-group profile-password-form-group">
              <label>Mã OTP</label>
              <input 
                type="text" 
                className="profile-input"
                placeholder="Nhập 6 số OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            
            <div className="form-group profile-password-form-group">
              <label>Mật khẩu mới</label>
              <input 
                type="password" 
                className="profile-input"
                placeholder="Tối thiểu 8 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary profile-submit-btn" disabled={loadingPw}>
              {loadingPw ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ChangePasswordPage;
