import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SellerLayout from '../../layouts/SellerLayout';
import { getShopOrdersApi, updateShopOrderStatusApi, getOrderCountsApi } from '../../services/shop.service';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Alert from '../../components/Alert';
import '../admin/AdminPage.css';
import './SellerOrdersPage.css';

function SellerOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmModalData, setConfirmModalData] = useState({ isOpen: false, orderId: null, newStatus: null });

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [success, setSuccess] = useState(null);

  const [cancelModalData, setCancelModalData] = useState({ isOpen: false, orderId: null });
  const [cancelReason, setCancelReason] = useState('');

  const [orderCounts, setOrderCounts] = useState({});

  useEffect(() => {
    setPage(0);
  }, [activeTab, keyword, startDate, endDate]);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token, activeTab, page, keyword, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let statuses = [];
      if (activeTab === 'PENDING') statuses = ['PENDING'];
      else if (activeTab === 'CONFIRMED') statuses = ['CONFIRMED', 'READY'];
      else if (activeTab === 'SHIPPING') statuses = ['SHIPPING', 'COMPLETED'];
      else if (activeTab === 'CANCELLED') statuses = ['CANCELLED'];

      const params = {
        page,
        size,
        keyword,
        statuses,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null
      };

      const pageData = await getShopOrdersApi(token, params);
      setOrders(pageData.content || []);
      setTotalPages(pageData.totalPages || 1);
      setTotalElements(pageData.totalElements || 0);

      const countsData = await getOrderCountsApi(token);
      setOrderCounts(countsData || {});
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (shopOrderId, newStatus) => {
    if (newStatus === 'CANCELLED') {
      setCancelModalData({ isOpen: true, orderId: shopOrderId });
    } else {
      setConfirmModalData({ isOpen: true, orderId: shopOrderId, newStatus });
    }
  };

  const confirmUpdate = async () => {
    const { orderId, newStatus } = confirmModalData;
    setError(null);
    setSuccess(null);
    try {
      const res = await updateShopOrderStatusApi(orderId, newStatus, token);
      setSuccess(res.message || 'Cập nhật trạng thái thành công');
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setConfirmModalData({ isOpen: false, orderId: null, newStatus: null });
    }
  };

  const confirmCancel = async () => {
    setError(null);
    setSuccess(null);
    if (!cancelReason.trim()) {
      setError("Vui lòng nhập lý do hủy đơn");
      setCancelModalData({ isOpen: false, orderId: null });
      return;
    }
    try {
      const res = await updateShopOrderStatusApi(cancelModalData.orderId, 'CANCELLED', token, cancelReason);
      setSuccess(res.message || 'Hủy đơn hàng thành công');
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Lỗi khi hủy đơn hàng');
    } finally {
      setCancelModalData({ isOpen: false, orderId: null });
      setCancelReason('');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'READY': return 'Chờ lấy hàng';
      case 'SHIPPING': return 'Đã giao cho ĐVVC';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentMethodText = (method) => {
    if (method === 'VNPAY') return 'Chuyển khoản (VNPAY)';
    if (method === 'COD') return 'Thanh toán khi nhận hàng (COD)';
    return method || 'Chưa rõ';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const buildTimeline = (shopOrder) => {
    if (!shopOrder.statusHistories || shopOrder.statusHistories.length === 0) {
      return [{ status: shopOrder.status, time: shopOrder.createdAt, user: 'Hệ thống' }];
    }

    const sortedHistories = [...shopOrder.statusHistories].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const timeline = [
      { status: sortedHistories[0].oldStatus, time: shopOrder.createdAt, user: 'Hệ thống' }
    ];

    sortedHistories.forEach(history => {
      timeline.push({ status: history.newStatus, time: history.createdAt, user: history.updatedByFullName });
    });

    return timeline;
  };


  if (loading) {
    return (
      <SellerLayout>
        <div className="seller-orders-loading">
          <div className="spinner"></div>
          <p>Đang tải đơn hàng...</p>
        </div>
      </SellerLayout>
    );
  }

  const renderActionIcons = (order) => {
    return (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          className="admin-action-btn"
          title="Xem chi tiết"
          onClick={() => setSelectedOrder(order)}
          style={{ backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}
        >
          <span className="material-symbols-outlined icon-18">visibility</span> Chi tiết
        </button>
        {order.status === 'PENDING' && (
          <>
            <button
              className="admin-action-btn approve"
              title="Xác nhận đơn"
              onClick={() => handleUpdateStatus(order.shopOrderId, 'CONFIRMED')}
            >
              <span className="material-symbols-outlined icon-18">check_circle</span> Xác nhận
            </button>
            <button
              className="admin-action-btn reject"
              title="Hủy đơn"
              onClick={() => handleUpdateStatus(order.shopOrderId, 'CANCELLED')}
            >
              <span className="material-symbols-outlined icon-18">cancel</span> Hủy
            </button>
          </>
        )}
        {order.status === 'CONFIRMED' && (
          <button
            className="admin-action-btn approve"
            title="Đã chuẩn bị xong"
            onClick={() => handleUpdateStatus(order.shopOrderId, 'READY')}
          >
            <span className="material-symbols-outlined icon-18">inventory_2</span> Chuẩn bị xong
          </button>
        )}
        {order.status === 'READY' && (
          <button
            className="admin-action-btn approve"
            title="Giao cho vận chuyển"
            onClick={() => handleUpdateStatus(order.shopOrderId, 'SHIPPING')}
          >
            <span className="material-symbols-outlined icon-18">local_shipping</span> Giao ĐVVC
          </button>
        )}
      </div>
    );
  };


  return (
    <SellerLayout>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '20px' }}>
        <div>
          <h2 className="admin-page-title">Quản lý Đơn hàng</h2>
          <p className="admin-page-desc">Theo dõi và xử lý các đơn hàng từ khách hàng.</p>
        </div>

        <div className="admin-filter-bar" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'nowrap', backgroundColor: '#fff', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="admin-search-box" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0 12px', borderRadius: '6px', border: '1px solid #e2e8f0', minWidth: '250px' }}>
            <span className="material-symbols-outlined admin-search-icon" style={{ fontSize: '18px', color: '#64748b' }}>search</span>
            <input
              type="text"
              placeholder="Mã đơn, tên, SĐT..."
              className="admin-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setKeyword(searchInput)}
              style={{ border: 'none', background: 'transparent', padding: '8px', outline: 'none', width: '100%', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Từ:</span>
            <input
              type="date"
              className="admin-filter-select"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Từ ngày"
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Đến:</span>
            <input
              type="date"
              className="admin-filter-select"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Đến ngày"
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setKeyword(searchInput)} style={{ padding: '8px 16px', whiteSpace: 'nowrap', width: 'auto' }}>Tìm kiếm</button>

          {(searchInput || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchInput('');
                setKeyword('');
                setStartDate('');
                setEndDate('');
              }}
              style={{
                background: '#fee2e2',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              title="Xóa bộ lọc"
              onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
              onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      <div className="admin-tabs admin-tabs-container">
        <button
          className={`btn ${activeTab === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('PENDING')}
        >
          Chờ xác nhận {orderCounts['PENDING'] > 0 ? `(${orderCounts['PENDING']})` : ''}
        </button>
        <button
          className={`btn ${activeTab === 'CONFIRMED' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('CONFIRMED')}
        >
          Chờ lấy hàng {((orderCounts['CONFIRMED'] || 0) + (orderCounts['READY'] || 0)) > 0 ? `(${(orderCounts['CONFIRMED'] || 0) + (orderCounts['READY'] || 0)})` : ''}
        </button>
        <button
          className={`btn ${activeTab === 'SHIPPING' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('SHIPPING')}
        >
          Đã giao ĐVVC {((orderCounts['SHIPPING'] || 0) + (orderCounts['COMPLETED'] || 0)) > 0 ? `(${(orderCounts['SHIPPING'] || 0) + (orderCounts['COMPLETED'] || 0)})` : ''}
        </button>
        <button
          className={`btn ${activeTab === 'CANCELLED' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('CANCELLED')}
        >
          Đã hủy {orderCounts['CANCELLED'] > 0 ? `(${orderCounts['CANCELLED']})` : ''}
        </button>
      </div>



      {error && <div className="error-message">{error}</div>}

      <div className="admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Sản phẩm</th>
                <th>Doanh thu</th>
                <th>Ngày đặt</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!error && orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-empty-state">Không có đơn hàng nào trong mục này.</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.shopOrderId}>
                    <td>
                      <strong>#{order.shopOrderId}</strong>
                    </td>
                    <td>
                      {order.orderItems && order.orderItems.length > 0 ? (
                        <div className="product-list-item">
                          <div className="product-list-img-box">
                            {order.orderItems[0].imageUrl ? (
                              <img
                                src={order.orderItems[0].imageUrl.startsWith('http') ? order.orderItems[0].imageUrl : `http://localhost:8080${order.orderItems[0].imageUrl}`}
                                className="product-list-img"
                                alt={order.orderItems[0].productName}
                              />
                            ) : (
                              <span className="material-symbols-outlined product-list-img-placeholder">image</span>
                            )}
                          </div>
                          <div>
                            <div className="product-list-name" style={{ WebkitLineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {order.orderItems[0].productName}
                            </div>
                            {order.orderItems.length > 1 && (
                              <div className="product-list-brand" style={{ color: 'var(--primary-color)', marginTop: '4px' }}>
                                + {order.orderItems.length - 1} sản phẩm khác
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Không có sản phẩm</span>
                      )}
                    </td>
                    <td>
                      <div className="font-number" style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '15px' }}>
                        {formatCurrency(order.sellerAmount)}
                      </div>
                    </td>
                    <td className="font-number">{formatDate(order.createdAt)}</td>
                    <td>
                      <span className={`admin-status-badge ${order.status === 'PENDING' ? 'pending' : (order.status === 'CANCELLED' ? 'inactive' : 'active')}`} style={{ whiteSpace: 'nowrap' }}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions" style={{ justifyContent: 'center' }}>
                        {renderActionIcons(order)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 0 && (
        <div className="admin-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
          <button
            className="admin-pagination-btn"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === 0 ? '#f1f5f9' : '#fff', color: page === 0 ? '#94a3b8' : '#334155', cursor: page === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <span className="admin-pagination-info" style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>
            Trang {page + 1} / {totalPages}
          </span>

          <button
            className="admin-pagination-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page >= totalPages - 1 ? '#f1f5f9' : '#fff', color: page >= totalPages - 1 ? '#94a3b8' : '#334155', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {selectedOrder && (
        <div className="product-detail-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="product-detail-modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="product-detail-modal-header">
              <h3>Chi tiết Đơn hàng #{selectedOrder.shopOrderId}</h3>
              <button className="admin-category-modal-close" onClick={() => setSelectedOrder(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="product-detail-body">
              <div className="order-detail-info-row">
                <div className="order-detail-info-left">
                  <h4 className="order-detail-section-title">Thông tin đơn hàng</h4>
                  <p><strong>Trạng thái:</strong> <span className={`admin-status-badge ${selectedOrder.status === 'PENDING' ? 'pending' : (selectedOrder.status === 'CANCELLED' ? 'inactive' : 'active')}`}>{getStatusText(selectedOrder.status)}</span></p>
                  <p><strong>Ngày đặt:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Thanh toán:</strong> {getPaymentMethodText(selectedOrder.paymentMethod)}</p>
                  {selectedOrder.voucherDiscount > 0 && (
                    <p><strong>Voucher:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(selectedOrder.voucherDiscount)}</span></p>
                  )}
                  {selectedOrder.status === 'CANCELLED' && selectedOrder.cancelReason && (
                    <p style={{ color: '#dc2626', marginTop: '5px' }}><strong>Lý do hủy:</strong> {selectedOrder.cancelReason}</p>
                  )}
                </div>
                <div className="order-detail-info-right">
                  <h4 className="order-detail-section-title">Thông tin người nhận</h4>
                  <p><strong>Người nhận:</strong> {selectedOrder.receiverName || 'Không có'}</p>
                  <p><strong>Điện thoại:</strong> {selectedOrder.receiverPhone || 'Không có'}</p>
                  <p><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress || 'Không có'}</p>
                </div>
              </div>

              <h4 className="order-detail-list-title">Danh sách sản phẩm ({selectedOrder.orderItems?.length || 0})</h4>
              <div className="order-detail-products">
                {selectedOrder.orderItems?.map((item, index) => (
                  <div key={item.orderItemId || index} className={`order-detail-item ${index < selectedOrder.orderItems.length - 1 ? 'has-border' : ''}`}>
                    <div className="order-detail-img-box">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8080${item.imageUrl}`}
                          alt={item.productName}
                          className="order-detail-img"
                        />
                      ) : (
                        <div className="order-detail-img-placeholder">
                          <span className="material-symbols-outlined">image</span>
                        </div>
                      )}
                    </div>
                    <div className="order-detail-item-info">
                      <div className="order-item-col-name">
                        <h5 className="order-detail-item-title">{item.productName}</h5>
                        {item.variantAttributes && (
                          <p className="order-detail-item-variant">Phân loại: {item.variantAttributes}</p>
                        )}
                      </div>
                      <div className="order-item-col-price">
                        {formatCurrency(item.price)}
                      </div>
                      <div className="order-item-col-qty">
                        x{item.quantity}
                      </div>
                      <div className="order-item-col-total">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-detail-financial-block">
                <div className="order-detail-financial-content">
                  <div className="order-detail-financial-row">
                    <span className="order-detail-financial-label">Tổng tiền hàng:</span>
                    <strong className="order-detail-financial-value">{formatCurrency(selectedOrder.subtotalAmount)}</strong>
                  </div>
                  <div className="order-detail-financial-row">
                    <span className="order-detail-financial-label">Phí sàn:</span>
                    <strong className="order-detail-financial-value fee">-{formatCurrency(selectedOrder.commissionAmount)}</strong>
                  </div>
                  <div className="order-detail-financial-row total">
                    <span className="order-detail-financial-label total">Thực nhận:</span>
                    <strong className="order-detail-financial-value total">{formatCurrency(selectedOrder.sellerAmount)}</strong>
                  </div>
                </div>
              </div>

              <div className="customer-timeline-container">
                <div className="customer-timeline-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
                  Lịch sử cập nhật kiện hàng
                </div>
                <div className="horizontal-timeline-list">
                  {buildTimeline(selectedOrder).map((item, idx, arr) => (
                    <div key={idx} className={`horizontal-timeline-item ${idx === arr.length - 1 ? 'active' : ''}`}>
                      <div className="horizontal-timeline-marker"></div>
                      <div className="horizontal-timeline-content">
                        <p className="horizontal-timeline-status">
                          {getStatusText(item.status)}
                        </p>
                        <p className="horizontal-timeline-time">
                          {formatDate(item.time)}
                        </p>
                        {item.user && (
                          <p className="horizontal-timeline-user">
                            Bởi: {item.user}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancelModalData.isOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Lý do hủy đơn hàng #{cancelModalData.orderId}</h3>
              <button className="modal-close" onClick={() => setCancelModalData({ isOpen: false, orderId: null })}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>Vui lòng nhập lý do hủy đơn hàng (Bắt buộc):</p>
              <textarea
                className="modal-textarea"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Hết hàng, Sai giá..."
              />
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setCancelModalData({ isOpen: false, orderId: null })}>Đóng</button>
              <button className="btn btn-danger" onClick={confirmCancel}>Xác nhận hủy</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModalData.isOpen}
        title="Xác nhận cập nhật"
        message={`Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "${confirmModalData.newStatus ? getStatusText(confirmModalData.newStatus) : ''}"?`}
        onConfirm={confirmUpdate}
        onCancel={() => setConfirmModalData({ isOpen: false, orderId: null, newStatus: null })}
        type="primary"
        confirmText="Xác nhận"
        cancelText="Hủy"
      />
    </SellerLayout>
  );
}

export default SellerOrdersPage;
