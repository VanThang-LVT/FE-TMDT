import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { placeOrderApi, createVNPayPaymentUrlApi } from '../../services/order.service';
import { previewBestVoucherApi, getAvailableVouchersApi } from '../../services/voucher.service';
import Alert from '../../components/Alert';
import DashboardLayout from '../../layouts/DashboardLayout';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, loading, refreshCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    receiverName: '',
    receiverPhone: '',
    shippingAddress: '',
    paymentMethod: 'COD'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voucher auto-apply state
  const [voucher, setVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);

  const handleOpenVoucherModal = async () => {
    setIsVoucherModalOpen(true);
    try {
      const total = selectedItems.reduce((sum, item) => sum + item.subTotal, 0);
      const vouchers = await getAvailableVouchersApi(total);
      setAvailableVouchers(vouchers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectVoucher = (v) => {
    setVoucher(v);
    setIsVoucherModalOpen(false);
  };

  useEffect(() => {
    if (!location.state || !location.state.selectedItemIds || location.state.selectedItemIds.length === 0) {
      navigate('/cart');
      return;
    }

    if (cart && cart.items) {
      const items = cart.items.filter(item => location.state.selectedItemIds.includes(item.cartItemId));
      setSelectedItems(items);
    }
  }, [cart, location.state, navigate]);

  // Tự động tìm voucher tốt nhất khi totalAmount thay đổi
  useEffect(() => {
    if (selectedItems.length === 0) return;
    const total = selectedItems.reduce((sum, item) => sum + item.subTotal, 0);
    if (total <= 0) return;

    let cancelled = false;
    setVoucherLoading(true);
    previewBestVoucherApi(total).then(data => {
      if (!cancelled) {
        setVoucher(data || null);
        setVoucherLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setVoucherLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!formData.receiverName || !formData.receiverPhone || !formData.shippingAddress) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const orderData = {
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        shippingAddress: formData.shippingAddress,
        paymentMethod: formData.paymentMethod,
        cartItemIds: selectedItems.map(i => i.cartItemId),
        voucherId: voucher ? voucher.voucherId : null
      };
      const order = await placeOrderApi(orderData, token);
      await refreshCart();

      if (formData.paymentMethod === 'VNPAY') {
        setSuccessMsg('Đang chuyển hướng sang VNPAY...');
        const paymentUrl = await createVNPayPaymentUrlApi(order.totalAmount, order.orderId, token);
        window.location.href = paymentUrl;
      } else {
        setSuccessMsg('Đặt hàng thành công!');
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      }

    } catch (error) {
      setErrorMsg(error.message || 'Có lỗi xảy ra khi đặt hàng');
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading || selectedItems.length === 0) {
    return (
      <DashboardLayout brandName="EoViTi">
        <div className="checkout-page-wrapper">
          <div className="loading-overlay">
            <div className="spinner"></div> Đang tải...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const originalAmount = selectedItems.reduce((sum, item) => sum + item.subTotal, 0);
  const discountAmount = voucher ? parseFloat(voucher.discountAmount || 0) : 0;
  const finalAmount = originalAmount - discountAmount;

  return (
    <DashboardLayout brandName="EoViTi">
      <div className="checkout-page-wrapper">
        <h2 className="checkout-header">Thanh Toán</h2>
      
      {errorMsg && <Alert message={errorMsg} type="error" />}
      {successMsg && <Alert message={successMsg} type="success" />}

      <div className="checkout-container">
        <form className="checkout-form" onSubmit={handlePlaceOrder}>
          
          <div className="checkout-section">
            <h2>Địa chỉ nhận hàng</h2>
            <div className="form-group">
              <label>Tên người nhận</label>
              <input type="text" name="receiverName" value={formData.receiverName} onChange={handleInputChange} placeholder="Họ và tên" required />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input type="text" name="receiverPhone" value={formData.receiverPhone} onChange={handleInputChange} placeholder="Số điện thoại liên hệ" required />
            </div>
            <div className="form-group">
              <label>Địa chỉ giao hàng cụ thể</label>
              <textarea name="shippingAddress" value={formData.shippingAddress} onChange={handleInputChange} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" rows="3" required></textarea>
            </div>
          </div>

          <div className="checkout-section">
            <h2>Phương thức thanh toán</h2>
            <div className="payment-methods">
              <label className={`payment-method-label ${formData.paymentMethod === 'COD' ? 'active' : ''}`}>
                <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleInputChange} />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label className={`payment-method-label ${formData.paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                <input type="radio" name="paymentMethod" value="VNPAY" checked={formData.paymentMethod === 'VNPAY'} onChange={handleInputChange} />
                Thanh toán qua VNPay
              </label>
            </div>
          </div>

        </form>

        <div className="checkout-summary">
          <h2>Sản phẩm đã chọn</h2>
          <div className="summary-items">
            {selectedItems.map(item => (
              <div key={item.cartItemId} className="summary-item">
                <img src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : 'https://via.placeholder.com/60'} alt={item.productName} />
                <div className="summary-item-info">
                  <div className="summary-item-name">{item.productName}</div>
                  {item.variantAttributes && <div className="summary-item-variant">{item.variantAttributes}</div>}
                  <div className="summary-item-price-qty">
                    <span className="price">{formatPrice(item.price)}</span>
                    <span className="qty">x{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="summary-total-section">
            <div className="summary-row">
              <span>Tổng tiền hàng:</span>
              <span>{formatPrice(originalAmount)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>0 ₫</span>
            </div>

            {/* Voucher auto-apply */}
            {voucherLoading && (
              <div className="summary-row voucher-loading">
                <span>🎫 Đang tìm voucher...</span>
              </div>
            )}
            {!voucherLoading && voucher && (
              <div className="summary-row voucher-applied" onClick={handleOpenVoucherModal} style={{ cursor: 'pointer', padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🎫 <strong>{voucher.voucherCode}</strong>
                  <span className="voucher-name" style={{ color: '#64748b', fontSize: '13px' }}> - Thay đổi</span>
                </span>
                <span className="discount-value">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            {!voucherLoading && !voucher && originalAmount > 0 && (
              <div className="summary-row voucher-none" onClick={handleOpenVoucherModal} style={{ cursor: 'pointer', color: '#6366f1', fontWeight: 600, padding: '8px', background: '#eef2ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🎫 Chọn mã giảm giá</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
              </div>
            )}

            <div className="summary-row total">
              <span>Tổng thanh toán:</span>
              <span className="total-amount">{formatPrice(finalAmount)}</span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn-place-order" 
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : 'Đặt Hàng'}
          </button>
        </div>
      </div>

      {/* Voucher Modal */}
      {isVoucherModalOpen && (
        <div className="voucher-modal-overlay" onClick={() => setIsVoucherModalOpen(false)}>
          <div className="voucher-modal" onClick={e => e.stopPropagation()}>
            <div className="voucher-modal-header">
              <h3>Chọn Voucher</h3>
              <button onClick={() => setIsVoucherModalOpen(false)}>&times;</button>
            </div>
            <div className="voucher-modal-body">
              {availableVouchers.length === 0 ? (
                <p className="no-vouchers">Không có mã giảm giá nào phù hợp với đơn hàng này.</p>
              ) : (
                availableVouchers.map(v => (
                  <div 
                    key={v.voucherId} 
                    className={`voucher-card ${voucher && voucher.voucherId === v.voucherId ? 'selected' : ''}`}
                    onClick={() => handleSelectVoucher(v)}
                  >
                    <div className="voucher-card-icon">🎫</div>
                    <div className="voucher-card-info">
                      <h4>{v.voucherCode} - {v.voucherName}</h4>
                      <p>Giảm {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatPrice(v.discountValue)}</p>
                      {v.minOrderAmount && <p className="min-order">Đơn tối thiểu {formatPrice(v.minOrderAmount)}</p>}
                    </div>
                    {voucher && voucher.voucherId === v.voucherId && (
                      <div className="voucher-selected-check">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                    )}
                  </div>
                ))
              )}
              {/* Option to clear voucher */}
              {voucher && (
                <div className="voucher-clear-btn" onClick={() => handleSelectVoucher(null)}>
                  Không dùng voucher
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
    </DashboardLayout>
  );
};

export default CheckoutPage;
