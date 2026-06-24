import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi, sendRegisterOtpApi } from '../../services/auth.service';
import AuthLayout from '../../layouts/AuthLayout';
import Alert from '../../components/Alert';

function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (otpCooldown > 0) {
      timer = setInterval(() => setOtpCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleSendOtp = async () => {
    if (!email) {
      setError('Vui lòng nhập email trước khi lấy mã OTP.');
      return;
    }
    setError('');
    setSuccess('');
    setSendingOtp(true);
    try {
      await sendRegisterOtpApi(email);
      setSuccess('Đã gửi mã OTP. Vui lòng kiểm tra hộp thư đến (hoặc thư rác) của bạn.');
      setOtpCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi mã OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await registerApi(fullName, email, password, phone, otp);
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. OTP có thể đã sai hoặc hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="EoViTi" subtitle="Tạo tài khoản mua sắm mới">
      <Alert type="danger" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label htmlFor="fullName">Họ và Tên</label>
          <input
            id="fullName"
            type="text"
            placeholder="Nguyễn Văn A"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <div className="auth-otp-group">
            <input
              id="email"
              type="email"
              placeholder="nguyenvana@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="btn btn-secondary auth-otp-btn" 
              onClick={handleSendOtp}
              disabled={sendingOtp || otpCooldown > 0 || !email}
            >
              {sendingOtp ? 'Đang gửi...' : (otpCooldown > 0 ? `Thử lại sau ${otpCooldown}s` : 'Lấy mã OTP')}
            </button>
          </div>
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
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            placeholder="Mật khẩu tối thiểu 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Số điện thoại</label>
          <input
            id="phone"
            type="tel"
            placeholder="09XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ'}
        </button>
      </form>

      <p className="footer-text">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;
