import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-col-wide">
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <img 
                src={logoImg} 
                alt="EoViTi Logo" 
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)' }} 
              />
              <span className="footer-brand" style={{ margin: 0 }}>EoViTi</span>
            </Link>
            <p className="footer-desc">Địa chỉ: 123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh</p>
            <p className="footer-desc">Email: contact@marketpro.vn</p>
            <p className="footer-desc">Hotline: 1900 1234</p>
            <div className="social-links">
              <a href="#" className="social-icon">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a href="#" className="social-icon">
                <span className="material-symbols-outlined">share</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="footer-heading">Về chúng tôi</h4>
            <ul className="footer-links">
              <li><Link to="/about" className="footer-link">Giới thiệu Sàn TMĐT</Link></li>
              <li><Link to="/contact" className="footer-link">Liên hệ với chúng tôi</Link></li>
              <li><Link to="/faq" className="footer-link">Câu hỏi thường gặp (FAQ)</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="footer-heading">Chính sách</h4>
            <ul className="footer-links">
              <li><Link to="/privacy" className="footer-link">Chính sách bảo mật</Link></li>
              <li><Link to="/terms" className="footer-link">Điều khoản dịch vụ</Link></li>
              <li><Link to="/shipping" className="footer-link">Chính sách giao hàng</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="footer-heading">Thanh toán an toàn</h4>
            <div className="payment-methods">
              <div className="payment-box"></div>
              <div className="payment-box"></div>
              <div className="payment-box"></div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">© 2026 EoViTi. Tất cả các quyền được bảo lưu.</p>
          <div className="language-selector">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>language</span>
            <span>Tiếng Việt (VN)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
