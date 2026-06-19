import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { placeOrderApi } from '../../services/order.service';
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
        cartItemIds: selectedItems.map(i => i.cartItemId)
      };

      await placeOrderApi(orderData, token);
      await refreshCart();
      setSuccessMsg('Đặt hàng thành công!');
      setTimeout(() => {
        navigate('/orders');
      }, 2000);

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

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.subTotal, 0);

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
              <span>{formatPrice(totalAmount)}</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển:</span>
              <span>0 ₫</span>
            </div>
            <div className="summary-row total">
              <span>Tổng thanh toán:</span>
              <span className="total-amount">{formatPrice(totalAmount)}</span>
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
    </div>
    </DashboardLayout>
  );
};

export default CheckoutPage;
