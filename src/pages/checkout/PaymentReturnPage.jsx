import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyVNPayPaymentApi } from '../../services/order.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import './PaymentReturnPage.css';

const PaymentReturnPage = () => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Đang xác thực thanh toán...');
  const location = useLocation();
  const navigate = useNavigate();
  const verifyCalled = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (verifyCalled.current) return;
      verifyCalled.current = true;

      const queryString = location.search; //location.search = sau ? VNPay trả về
      if (!queryString) {
        setStatus('fail');
        setMessage('Không tìm thấy thông tin giao dịch.');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await verifyVNPayPaymentApi(queryString, token);
        
        if (response.code === '00') {
          setStatus('success');
          setMessage(response.message || 'Thanh toán thành công!');
        } else {
          setStatus('fail');
          setMessage(response.message || 'Thanh toán thất bại.');
        }
      } catch (error) {
        setStatus('fail');
        setMessage(error.message || 'Lỗi hệ thống khi xác thực.');
      }
    };
    verifyPayment();
  }, [location]);

  return (
    <DashboardLayout brandName="EoViTi">
      <div className="payment-return-wrapper">
        <div className={`payment-return-card ${status}`}>
          {status === 'processing' && (
            <>
              <div className="spinner"></div>
              <h2>Đang xử lý giao dịch</h2>
              <p>{message}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="icon-success">✓</div>
              <h2>Thanh Toán Thành Công!</h2>
              <p>{message}</p>
              <button className="btn-return-primary" onClick={() => navigate('/orders')}>
                Xem Đơn Hàng Của Tôi
              </button>
            </>
          )}
          {status === 'fail' && (
            <>
              <div className="icon-fail">✕</div>
              <h2>Giao Dịch Thất Bại</h2>
              <p>{message}</p>
              <div className="btn-return-group">
                <button className="btn-return-secondary" onClick={() => navigate('/cart')}>
                  Quay Lại Giỏ Hàng
                </button>
                <button className="btn-return-primary" onClick={() => navigate('/orders')}>
                  Xem Đơn Hàng
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentReturnPage;
