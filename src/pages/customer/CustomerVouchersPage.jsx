import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableVouchersApi } from '../../services/voucher.service';
import './CustomerVouchersPage.css';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';

function CustomerVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAvailableVouchersApi(999999999);
      setVouchers(data || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách voucher:', error);
      setError('Đã xảy ra lỗi khi tải danh sách voucher. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="vouchers-container page-container">
      <div className="vouchers-header">
        <button onClick={() => navigate(-1)} className="btn-outline vouchers-back-btn">
          <span className="material-symbols-outlined vouchers-back-icon">arrow_back</span>
          Quay lại
        </button>
        <h2 className="page-title">Voucher Của Tôi</h2>
      </div>

      {loading ? (
        <div className="vouchers-loading">Đang tải danh sách voucher...</div>
      ) : error ? (
        <div className="vouchers-error" style={{ margin: '20px 0' }}>
          <Alert type="danger" message={error} />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="vouchers-empty">
          <span className="material-symbols-outlined vouchers-empty-icon">local_offer</span>
          <p className="vouchers-empty-text">Bạn chưa có voucher nào có thể áp dụng.</p>
        </div>
      ) : (
        <div className="vouchers-grid">
          {vouchers.map((voucher) => (
            <div key={voucher.voucherId} className="my-voucher-card">
              <div className="my-voucher-card-left">
                <div className="voucher-icon-wrapper">
                  <span className="material-symbols-outlined">loyalty</span>
                </div>
                <div className="voucher-name-wrapper">
                  <span className="voucher-code">{voucher.voucherCode}</span>
                </div>
              </div>
              <div className="my-voucher-card-right">
                <h3 className="voucher-title">{voucher.voucherName}</h3>
                <p className="voucher-desc">
                  Giảm {voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}%` : formatCurrency(voucher.discountValue)}
                  {voucher.discountType === 'PERCENTAGE' && voucher.maxDiscountAmount && ` (Tối đa ${formatCurrency(voucher.maxDiscountAmount)})`}
                </p>
                <p className="voucher-condition" style={{ marginBottom: '8px' }}>
                  {voucher.minOrderAmount > 0 ? `Đơn tối thiểu ${formatCurrency(voucher.minOrderAmount)}` : 'Áp dụng mọi đơn'}
                </p>
                <div className="voucher-progress-container">
                  <div className="voucher-progress-bar">
                    <div 
                      className="voucher-progress-fill" 
                      style={{ width: `${Math.min(100, ((voucher.usedQuantity || 0) / voucher.quantity) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="voucher-progress-text">
                    Còn {voucher.quantity - (voucher.usedQuantity || 0)}
                  </span>
                </div>
                <div className="voucher-footer">
                  <span className="voucher-date">HSD: {formatDate(voucher.endDate)}</span>
                  <button className="voucher-use-btn" onClick={() => window.location.href = '/'}>
                    Dùng ngay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerVouchersPage;
