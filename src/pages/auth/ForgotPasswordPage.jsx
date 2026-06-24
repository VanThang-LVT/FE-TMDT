import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendForgotPasswordOtpApi, resetPasswordApi } from '../../services/auth.service';
import AuthLayout from '../../layouts/AuthLayout';
import Alert from '../../components/Alert';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [step, setStep] = useState(1); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập email.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await sendForgotPasswordOtpApi(email);
      setSuccess('Đã gửi mã OTP. Vui lòng kiểm tra hộp thư đến của bạn.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Vui lòng nhập đủ mã OTP và Mật khẩu mới.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải từ 8 ký tự trở lên.');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPasswordApi(email, otp, newPassword);
      setSuccess('Cập nhật mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại. OTP có thể đã sai hoặc hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Khôi phục mật khẩu" subtitle="Đặt lại mật khẩu mới cho tài khoản">
      <Alert type="danger" message={error} />
      <Alert type="success" message={success} />

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label htmlFor="email">Email đã đăng ký</label>
            <input
              id="email"
              type="email"
              placeholder="nguyenvana@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Đang gửi...' : 'LẤY MÃ OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} disabled className="auth-input-disabled" />
          </div>

          <div className="form-group">
            <label htmlFor="otp">Mã xác nhận OTP (Gửi qua email)</label>
            <input
              id="otp"
              type="text"
              placeholder="Nhập 6 số OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <input
              id="newPassword"
              type="password"
              placeholder="Mật khẩu tối thiểu 8 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'ĐẶT LẠI MẬT KHẨU'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary auth-back-btn" 
            onClick={() => { setStep(1); setError(''); setSuccess(''); }}
            disabled={loading}
          >
            Quay lại
          </button>
        </form>
      )}

      <p className="footer-text">
        Nhớ mật khẩu? <Link to="/login">Đăng nhập ngay</Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
