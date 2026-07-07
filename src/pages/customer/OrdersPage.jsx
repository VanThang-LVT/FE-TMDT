import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyOrdersApi, createVNPayPaymentUrlApi, completeShopOrderApi } from '../../services/order.service';
import { createReviewApi, getReviewByOrderItemApi } from '../../services/review.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { toast } from 'react-hot-toast';
import './CustomerPage.css';
import './OrdersPage.css';

function OrdersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [repayingOrderId, setRepayingOrderId] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingShopOrderId, setConfirmingShopOrderId] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewImage1, setReviewImage1] = useState('');
  const [reviewImage2, setReviewImage2] = useState('');
  const [reviewImageFile1, setReviewImageFile1] = useState(null);
  const [reviewImageFile2, setReviewImageFile2] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isReviewReadOnly, setIsReviewReadOnly] = useState(false);

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

  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return orders;

    return orders.map(order => {
      const filteredShopOrders = (order.shopOrders || []).filter(so => {
        if (activeTab === 'PENDING') return ['UNPAID', 'PENDING'].includes(so.status);
        if (activeTab === 'SHIPPING') return ['CONFIRMED', 'READY', 'SHIPPING'].includes(so.status);
        if (activeTab === 'COMPLETED') return so.status === 'COMPLETED';
        if (activeTab === 'CANCELLED') return so.status === 'CANCELLED';
        return true;
      });
      return { ...order, shopOrders: filteredShopOrders };
    }).filter(order => order.shopOrders.length > 0);
  }, [orders, activeTab]);

  const getStatusInfo = (status) => {
    const statusMap = {
      'PENDING': { text: 'Chờ thanh toán', className: 'status-pending' },
      'PAID': { text: 'Đã thanh toán', className: 'status-paid' },
      'SHIPPING': { text: 'Đang giao', className: 'status-shipped' },
      'COMPLETED': { text: 'Hoàn thành', className: 'status-delivered' },
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

    const sortedHistories = [...shopOrder.statusHistories].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const timeline = [
      { status: sortedHistories[0].oldStatus, time: globalCreatedAt }
    ];

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
      toast.error('Có lỗi xảy ra khi kết nối với cổng thanh toán VNPAY!');
      setRepayingOrderId(null);
    }
  };

  const handleConfirmReceipt = (shopOrderId) => {
    setConfirmingShopOrderId(shopOrderId);
    setShowConfirmModal(true);
  };

  const executeConfirmReceipt = async () => {
    if (!confirmingShopOrderId) return;
    try {
      setLoading(true);
      await completeShopOrderApi(confirmingShopOrderId, token);
      toast.success('Xác nhận đã nhận hàng thành công!');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xác nhận nhận hàng');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setConfirmingShopOrderId(null);
    }
  };

  const handleOpenReviewModal = (item) => {
    setReviewItem(item);
    setRating(5);
    setReviewContent('');
    setReviewImage1('');
    setReviewImage2('');
    setReviewImageFile1(null);
    setReviewImageFile2(null);
    setIsReviewReadOnly(false);
    setShowReviewModal(true);
  };

  const handleViewReview = async (item) => {
    try {
      const reviewData = await getReviewByOrderItemApi(item.orderItemId, token);
      setReviewItem(item);
      setRating(reviewData.rating || 5);
      setReviewContent(reviewData.content || '');
      setReviewImage1(reviewData.imageUrl1 ? `http://localhost:8080${reviewData.imageUrl1}` : '');
      setReviewImage2(reviewData.imageUrl2 ? `http://localhost:8080${reviewData.imageUrl2}` : '');
      setReviewImageFile1(null);
      setReviewImageFile2(null);
      setIsReviewReadOnly(true);
      setShowReviewModal(true);
    } catch (err) {
      toast.error('Không thể tải thông tin đánh giá');
    }
  };

  const handleImageUpload = (e, imageIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chỉ chọn tệp hình ảnh!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (imageIndex === 1) {
        setReviewImage1(reader.result);
        setReviewImageFile1(file);
      } else {
        setReviewImage2(reader.result);
        setReviewImageFile2(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Vui lòng chọn số sao đánh giá!');
      return;
    }
    try {
      setSubmittingReview(true);
      await createReviewApi({
        orderItemId: reviewItem.orderItemId,
        rating,
        content: reviewContent,
        image1: reviewImageFile1,
        image2: reviewImageFile2
      }, token);
      toast.success('Gửi đánh giá sản phẩm thành công!');
      setShowReviewModal(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (authLoading || !user) {
    return <div className="profile-loading">Đang tải...</div>;
  }

  return (
    <DashboardLayout brandName="EoViTi">
      <div className="orders-container">
        <h2 className="orders-title">Đơn Hàng Của Tôi</h2>

        <div className="orders-tabs">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ xác nhận' },
            { id: 'SHIPPING', label: 'Đang giao' },
            { id: 'COMPLETED', label: 'Hoàn thành' },
            { id: 'CANCELLED', label: 'Đã hủy' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`order-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-danger orders-error-alert">{error}</div>
        )}

        {loading ? (
          <div className="orders-loading-text">Đang tải danh sách đơn hàng...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <span className="material-symbols-outlined orders-empty-icon">receipt_long</span>
            <h3 className="orders-empty-text">Bạn chưa có đơn hàng nào</h3>
            <button className="btn btn-primary orders-empty-btn" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map(order => {
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
                            <div>
                              <span className="material-symbols-outlined shop-icon">storefront</span>
                              {shopOrder.shopName}
                              <span className="shop-id-text">
                                (Mã kiện hàng: #{shopOrder.shopOrderId})
                              </span>
                            </div>
                            <span className={`order-status-badge ${getShopOrderStatusInfo(shopOrder.status).className} shop-order-status-badge`}>
                              {getShopOrderStatusInfo(shopOrder.status).text}
                            </span>
                          </div>
                          {shopOrder.status === 'CANCELLED' && shopOrder.cancelReason && (
                            <div className="shop-order-cancel-reason">
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
                                <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</div>
                                {shopOrder.status === 'COMPLETED' && (
                                  <div>
                                    {item.reviewed ? (
                                      <span className="order-item-reviewed-text" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleViewReview(item)}>
                                        <span className="material-symbols-outlined order-item-reviewed-icon">check_circle</span>
                                        Đã đánh giá (Xem)
                                      </span>
                                    ) : (
                                      <button
                                        className="order-item-review-btn"
                                        onClick={() => handleOpenReviewModal(item)}
                                      >
                                        <span className="material-symbols-outlined order-item-review-icon">rate_review</span>
                                        Đánh giá sản phẩm
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Timeline inline view */}
                          <div className="customer-timeline-container">
                            <div className="customer-timeline-title">
                              <span className="material-symbols-outlined customer-timeline-icon">history</span>
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

                          {shopOrder.status === 'SHIPPING' && (
                            <div className="confirm-receipt-section">
                              <button
                                className="btn btn-primary confirm-receipt-btn"
                                onClick={() => handleConfirmReceipt(shopOrder.shopOrderId)}
                              >
                                <span className="material-symbols-outlined confirm-receipt-icon">check_circle</span>
                                Đã nhận được hàng
                              </button>
                            </div>
                          )}
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
                      <div className="order-detail-cancel-reason">
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

              <div className="order-detail-total-section">
                <div className="order-detail-total-line">
                  <span>Tổng tiền hàng:</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.originalAmount || selectedOrder.totalAmount)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="order-detail-total-line discount">
                    <span>Voucher giảm giá {selectedOrder.voucherCode ? `(${selectedOrder.voucherCode})` : ''}:</span>
                    <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="order-detail-total-row">
                  <span className="order-detail-total-label">Tổng thanh toán:</span>
                  <strong className="order-detail-total-amount">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.totalAmount)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {showReviewModal && reviewItem && (
          <div className="review-modal-overlay">
            <div className="review-modal-container">
              <div className="review-modal-header">
                <h3>
                  <span className="material-symbols-outlined review-modal-title-icon">rate_review</span>
                  {isReviewReadOnly ? 'Đánh giá của bạn' : 'Đánh giá sản phẩm'}
                </h3>
                <button className="review-modal-close" onClick={() => setShowReviewModal(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (!isReviewReadOnly) handleSubmitReview(e); }} className="review-modal-body">
                <div className="review-product-card">
                  <img
                    src={reviewItem.imageUrl ? `http://localhost:8080${reviewItem.imageUrl}` : 'https://via.placeholder.com/80'}
                    alt={reviewItem.productName}
                    className="review-product-img"
                  />
                  <div className="review-product-info">
                    <h5 className="review-product-name">{reviewItem.productName}</h5>
                    {reviewItem.variantAttributes && (
                      <p className="review-product-variant">Phân loại: {reviewItem.variantAttributes}</p>
                    )}
                  </div>
                </div>

                <div className="review-section review-rating-section">
                  <label className="review-section-title">CHẤT LƯỢNG SẢN PHẨM</label>
                  <div className="review-stars-container">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="material-symbols-outlined review-star"
                        style={{
                          color: star <= rating ? '#fbbf24' : '#cbd5e1',
                          fontVariationSettings: star <= rating ? '"FILL" 1' : '"FILL" 0',
                          cursor: isReviewReadOnly ? 'default' : 'pointer'
                        }}
                        onClick={() => !isReviewReadOnly && setRating(star)}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="review-rating-text">
                    {rating === 1 && 'Tệ'}
                    {rating === 2 && 'Không hài lòng'}
                    {rating === 3 && 'Bình thường'}
                    {rating === 4 && 'Hài lòng'}
                    {rating === 5 && 'Tuyệt vời'}
                  </span>
                </div>

                <div className="review-section">
                  <label className="review-section-title">NỘI DUNG ĐÁNH GIÁ</label>
                  <textarea
                    className="review-textarea"
                    placeholder="Hãy chia sẻ trải nghiệm của bạn về sản phẩm này nhé..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    readOnly={isReviewReadOnly}
                  />
                </div>

                <div className="review-section">
                  <label className="review-section-title">HÌNH ẢNH MINH HỌA (TỐI ĐA 2 ẢNH)</label>

                  <div className="review-images-container">
                    {/* Image 1 upload slot */}
                    {(!isReviewReadOnly || reviewImage1) && (
                      <div className="review-image-slot">
                        {reviewImage1 ? (
                          <div className="review-image-preview">
                            <img src={reviewImage1} alt="Preview 1" />
                            {!isReviewReadOnly && (
                              <button
                                type="button"
                                className="review-image-remove"
                                onClick={() => { setReviewImage1(''); setReviewImageFile1(null); }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ) : (
                          <label className="review-upload-label">
                            <span className="material-symbols-outlined review-upload-icon">add_a_photo</span>
                            <span className="review-upload-text">TẢI ẢNH 1</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 1)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Image 2 upload slot */}
                    {(!isReviewReadOnly || reviewImage2) && (
                      <div className="review-image-slot">
                        {reviewImage2 ? (
                          <div className="review-image-preview">
                            <img src={reviewImage2} alt="Preview 2" />
                            {!isReviewReadOnly && (
                              <button
                                type="button"
                                className="review-image-remove"
                                onClick={() => { setReviewImage2(''); setReviewImageFile2(null); }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ) : (
                          <label className="review-upload-label">
                            <span className="material-symbols-outlined review-upload-icon">add_a_photo</span>
                            <span className="review-upload-text">TẢI ẢNH 2</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 2)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="review-modal-footer">
                  {isReviewReadOnly ? (
                    <button
                      type="button"
                      className="btn btn-primary review-btn-submit"
                      onClick={() => setShowReviewModal(false)}
                      style={{ width: '100%' }}
                    >
                      Đóng
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary review-btn-cancel"
                        onClick={() => setShowReviewModal(false)}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary review-btn-submit"
                        disabled={submittingReview}
                      >
                        {submittingReview ? 'Đang gửi...' : 'Hoàn thành'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showConfirmModal}
          title="Xác nhận nhận hàng"
          message="Bạn xác nhận đã nhận được kiện hàng này và muốn hoàn thành đơn hàng?"
          onConfirm={executeConfirmReceipt}
          onCancel={() => {
            setShowConfirmModal(false);
            setConfirmingShopOrderId(null);
          }}
          confirmText="Đồng ý"
          cancelText="Huỷ"
          type="primary"
        />
      </div>
    </DashboardLayout>
  );
}

export default OrdersPage;
