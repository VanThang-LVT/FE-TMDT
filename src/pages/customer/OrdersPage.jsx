import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyOrdersApi, createVNPayPaymentUrlApi } from '../../services/order.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import './CustomerPage.css';
import './OrdersPage.css';

function OrdersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repayingOrderId, setRepayingOrderId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrdersApi(token);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'PENDING': { text: 'Chờ xác nhận/Thanh toán', className: 'status-pending' },
      'PAID': { text: 'Đã thanh toán', className: 'status-paid' },
      'PROCESSING': { text: 'Đang xử lý', className: 'status-processing' },
      'SHIPPED': { text: 'Đang giao hàng', className: 'status-shipped' },
      'DELIVERED': { text: 'Đã giao', className: 'status-delivered' },
      'CANCELLED': { text: 'Đã hủy', className: 'status-cancelled' }
    };
    return statusMap[status] || { text: status, className: 'status-default' };
  };

  const handleRepay = async (orderId, amount) => {
    try {
      setRepayingOrderId(orderId);
      const paymentUrl = await createVNPayPaymentUrlApi(amount, orderId, token);
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (err) {
      console.error('Lỗi khi tạo lại URL thanh toán:', err);
      alert('Có lỗi xảy ra khi kết nối với cổng thanh toán VNPAY!');
      setRepayingOrderId(null);
    }
  };

  if (authLoading || !user) {
    return <div className="profile-loading">Đang tải...</div>;
  }

  return (
    <DashboardLayout brandName="EoViTi">
      <div className="orders-container">
        <h2 className="orders-title">Đơn Hàng Của Tôi</h2>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải danh sách đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <span className="material-symbols-outlined orders-empty-icon">receipt_long</span>
            <h3 className="orders-empty-text">Bạn chưa có đơn hàng nào</h3>
            <button className="btn btn-primary" style={{ marginTop: '20px', width: 'auto', padding: '10px 24px' }} onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.orderStatus);
              return (
                <div key={order.orderId} className="order-card">
                  <div className="order-header">
                    <div>
                      <span className="order-id">Mã ĐH: #{order.orderId}</span>
                      <span className="order-date">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className={`order-status-badge ${statusInfo.className}`}>
                      {statusInfo.text}
                    </div>
                  </div>

                  <div className="order-body">
                    <div className="shop-orders-list">
                      {order.shopOrders && order.shopOrders.map(shopOrder => (
                        <div key={shopOrder.shopOrderId} className="shop-order-card">
                          <div className="shop-name">
                            <span className="material-symbols-outlined shop-icon">storefront</span>
                            {shopOrder.shopName}
                          </div>
                          {shopOrder.orderItems.map(item => (
                            <div key={item.orderItemId} className="order-item">
                              <img
                                src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : 'https://via.placeholder.com/80'}
                                alt={item.productName}
                                className="order-item-img"
                              />
                              <div className="order-item-info">
                                <h4 className="order-item-name">{item.productName}</h4>
                                {item.variantAttributes && (
                                  <p className="order-item-variant">
                                    Phân loại hàng: {item.variantAttributes}
                                  </p>
                                )}
                                <div className="order-item-quantity">
                                  x{item.quantity}
                                </div>
                              </div>
                              <div className="order-item-price">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="order-payment-method">
                      Thanh toán: <span>{order.paymentMethod === 'VNPAY' ? 'VNPay' : 'Thanh toán khi nhận hàng'}</span>
                    </div>
                    <div className="order-total">
                      Tổng tiền: <span className="order-total-amount">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Hiển thị nút Thanh toán lại nếu đơn hàng VNPAY đang ở trạng thái PENDING */}
                  {order.paymentMethod === 'VNPAY' && order.orderStatus === 'PENDING' && (
                    <div className="order-actions" style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleRepay(order.orderId, order.totalAmount)}
                        disabled={repayingOrderId === order.orderId}
                        style={{ padding: '8px 20px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        {repayingOrderId === order.orderId ? 'Đang chuyển hướng...' : 'Thanh toán lại (VNPAY)'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OrdersPage;
