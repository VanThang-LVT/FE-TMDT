import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '../../services/auth.service';
import AuthLayout from '../../layouts/AuthLayout';
import Alert from '../../components/Alert';

function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await registerApi(fullName, email, password, phone);
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Email có thể đã tồn tại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Đăng Ký" subtitle="Tạo tài khoản khách hàng mới của bạn">
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
          <input
            id="email"
            type="email"
            placeholder="nguyenvana@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
