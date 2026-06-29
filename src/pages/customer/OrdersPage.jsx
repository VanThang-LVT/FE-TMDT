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
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      'PENDING': { text: 'Chờ thanh toán', className: 'status-pending' },
      'PAID': { text: 'Đã thanh toán', className: 'status-paid' },
      'CANCELLED': { text: 'Đã hủy', className: 'status-cancelled' }
    };
    return statusMap[status] || { text: status, className: 'status-default' };
  };

  const getShopOrderStatusInfo = (status) => {
    const statusMap = {
      'UNPAID': { text: 'Chờ thanh toán', className: 'status-pending' },
      'PENDING': { text: 'Chờ xác nhận', className: 'status-pending' },
      'CONFIRMED': { text: 'Đã xác nhận', className: 'status-processing' },
      'READY': { text: 'Chờ lấy hàng', className: 'status-processing' },
      'SHIPPING': { text: 'Đã giao cho ĐVVC', className: 'status-shipped' },
      'COMPLETED': { text: 'Đã giao', className: 'status-delivered' },
      'CANCELLED': { text: 'Đã hủy', className: 'status-cancelled' }
    };
    return statusMap[status] || { text: status, className: 'status-default' };
  };

  const buildTimeline = (shopOrder, globalCreatedAt) => {
    if (!shopOrder.statusHistories || shopOrder.statusHistories.length === 0) {
      return [{ status: shopOrder.status, time: globalCreatedAt }];
    }
    
    // Sort ascending by created_at time
    const sortedHistories = [...shopOrder.statusHistories].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Initial state
    const timeline = [
      { status: sortedHistories[0].oldStatus, time: globalCreatedAt }
    ];
    
    // All transition new states
    sortedHistories.forEach(history => {
      timeline.push({ status: history.newStatus, time: history.createdAt });
    });
    
    return timeline;
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
                          <div className="shop-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div>
                              <span className="material-symbols-outlined shop-icon">storefront</span>
                              {shopOrder.shopName}
                              <span style={{ marginLeft: '10px', fontSize: '13px', color: '#666', fontWeight: 'normal' }}>
                                (Mã kiện hàng: #{shopOrder.shopOrderId})
                              </span>
                            </div>
                            <span className={`order-status-badge ${getShopOrderStatusInfo(shopOrder.status).className}`} style={{ fontSize: '12px', padding: '4px 8px' }}>
                              {getShopOrderStatusInfo(shopOrder.status).text}
                            </span>
                          </div>
                          {shopOrder.status === 'CANCELLED' && shopOrder.cancelReason && (
                            <div style={{ padding: '10px 15px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', marginBottom: '15px', borderRadius: '4px', fontSize: '14px', color: '#b91c1c' }}>
                              <strong>Lý do hủy:</strong> {shopOrder.cancelReason}
                            </div>
                          )}
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

                            {/* Timeline inline view */}
                            <div className="customer-timeline-container">
                              <div className="customer-timeline-title">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
                                Lịch sử cập nhật kiện hàng
                              </div>
                              <div className="horizontal-timeline-list">
                                {buildTimeline(shopOrder, order.createdAt).map((item, idx, arr) => (
                                  <div key={idx} className={`horizontal-timeline-item ${idx === arr.length - 1 ? 'active' : ''}`}>
                                    <div className="horizontal-timeline-marker"></div>
                                    <div className="horizontal-timeline-content">
                                      <p className="horizontal-timeline-status">
                                        {getShopOrderStatusInfo(item.status).text}
                                      </p>
                                      <p className="horizontal-timeline-time">
                                        {new Date(item.time).toLocaleString('vi-VN')}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-footer">
                    <div className="order-payment-method">
                      Thanh toán: <span>{order.paymentMethod === 'VNPAY' ? 'VNPay' : 'Thanh toán khi nhận hàng'}</span>
                    </div>
                    <div className="order-footer-right">
                      <div className="order-total">
                        <span>Tổng tiền:</span>
                        <span className="order-total-amount">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                        </span>
                      </div>
                      <div className="order-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                          Xem chi tiết
                        </button>
                        {order.paymentMethod === 'VNPAY' && order.orderStatus === 'PENDING' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleRepay(order.orderId, order.totalAmount)}
                            disabled={repayingOrderId === order.orderId}
                          >
                            {repayingOrderId === order.orderId ? 'Đang chuyển hướng...' : 'Thanh toán lại'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedOrder && (
          <div className="product-detail-modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="product-detail-modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
              <button 
                className="order-detail-close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              
              <h3 className="order-detail-modal-title">
                Chi tiết đơn hàng #{selectedOrder.orderId}
              </h3>
              
              <div className="order-detail-info-row">
                <div className="order-detail-info-left">
                  <h4 className="order-detail-section-title">Thông tin đơn hàng</h4>
                  <p className="order-detail-info-text"><strong>Ngày đặt:</strong> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                  <p className="order-detail-info-text"><strong>Trạng thái:</strong> <span className={`order-status-badge ${getStatusInfo(selectedOrder.orderStatus).className}`}>{getStatusInfo(selectedOrder.orderStatus).text}</span></p>
                  <p className="order-detail-info-text"><strong>Phương thức TT:</strong> {selectedOrder.paymentMethod === 'VNPAY' ? 'VNPay' : 'Thanh toán khi nhận hàng'}</p>
                </div>
                <div className="order-detail-info-right">
                  <h4 className="order-detail-section-title">Thông tin nhận hàng</h4>
                  <p className="order-detail-info-text"><strong>Người nhận:</strong> {selectedOrder.receiverName}</p>
                  <p className="order-detail-info-text"><strong>Điện thoại:</strong> {selectedOrder.receiverPhone}</p>
                  <p className="order-detail-info-text"><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress}</p>
                </div>
              </div>

              <h4 className="order-detail-list-title">Danh sách sản phẩm</h4>
              <div className="order-detail-products">
                {selectedOrder.shopOrders && selectedOrder.shopOrders.map(shopOrder => (
                  <div key={shopOrder.shopOrderId} className="order-detail-shop-card">
                    <div className="order-detail-shop-header">
                      <div className="order-detail-shop-name">
                        <span className="material-symbols-outlined order-detail-shop-icon">storefront</span>
                        {shopOrder.shopName}
                        <span className="order-detail-shop-id">(Kiện: #{shopOrder.shopOrderId})</span>
                      </div>
                      <span className={`order-status-badge ${getShopOrderStatusInfo(shopOrder.status).className} order-detail-shop-badge`}>
                        {getShopOrderStatusInfo(shopOrder.status).text}
                      </span>
                    </div>
                    
                    {shopOrder.status === 'CANCELLED' && shopOrder.cancelReason && (
                      <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', marginBottom: '15px', borderRadius: '4px', fontSize: '13px', color: '#b91c1c', marginTop: '10px' }}>
                        <strong>Lý do bị hủy:</strong> {shopOrder.cancelReason}
                      </div>
                    )}
                    
                    {shopOrder.orderItems.map(item => (
                      <div key={item.orderItemId} className="order-detail-item">
                        <div className="order-detail-img-box">
                          <img src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : 'https://via.placeholder.com/60'} alt={item.productName} />
                        </div>
                        <div className="order-detail-item-info">
                          <div className="order-item-col-name">
                            <h5 className="order-detail-item-title">{item.productName}</h5>
                            {item.variantAttributes && <p className="order-detail-item-variant">Phân loại: {item.variantAttributes}</p>}
                          </div>
                          <div className="order-item-col-price">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                          </div>
                          <div className="order-item-col-qty">
                            x{item.quantity}
                          </div>
                          <div className="order-item-col-total">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              <div className="order-detail-total-row">
                Tổng thanh toán: <strong className="order-detail-total-amount">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.totalAmount)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default OrdersPage;
