import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../layouts/AdminLayout';
import Alert from '../../components/Alert';
import '../../components/modals/Modal.css';
import { getAdminOrdersApi, adminCancelOrderApi } from '../../services/order.service';
import './AdminPage.css';

const formatVND = (amount) => {
  if (amount == null) return '0 ₫';
  return Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

const ORDER_STATUS_MAP = {
  PENDING: { text: 'Chờ xác nhận', cls: 'pending' },
  CONFIRMED: { text: 'Đã xác nhận', cls: 'active' },
  READY: { text: 'Chờ lấy hàng', cls: 'active' },
  SHIPPING: { text: 'Đã giao ĐVVC', cls: 'active' },
  COMPLETED: { text: 'Đã hoàn thành', cls: 'active' },
  CANCELLED: { text: 'Đã huỷ', cls: 'rejected' }
};

function AdminOrdersPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null, reason: '' });
  const [cancelling, setCancelling] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const getStatusText = (status) => {
    return ORDER_STATUS_MAP[status]?.text || status;
  };

  const getPaymentMethodText = (method) => {
    if (method === 'VNPAY') return 'Chuyển khoản (VNPAY)';
    if (method === 'COD') return 'Thanh toán khi nhận hàng (COD)';
    return method || 'Chưa rõ';
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
    const timeline = [{ status: sortedHistories[0].oldStatus, time: shopOrder.createdAt, user: 'Hệ thống' }];
    sortedHistories.forEach(history => {
      timeline.push({ status: history.newStatus, time: history.createdAt, user: history.updatedByFullName });
    });
    return timeline;
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminOrdersApi(token, keyword, statusFilter, page, 10);
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, keyword, statusFilter, page]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isAdmin()) navigate('/');
      else fetchOrders();
    }
  }, [user, authLoading, isAdmin, navigate, fetchOrders]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchOrders();
  };

  const handleCancelOrder = async () => {
    setError(null);
    setSuccess(null);
    if (!cancelModal.reason.trim()) {
      setError('Vui lòng nhập lý do huỷ đơn');
      return;
    }

    setCancelling(true);
    try {
      const res = await adminCancelOrderApi(cancelModal.orderId, cancelModal.reason, token);
      setSuccess(res.message || 'Đã huỷ đơn hàng thành công');
      setCancelModal({ show: false, orderId: null, reason: '' });
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Lỗi khi huỷ đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || !user || !isAdmin()) return null;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Quản Lý Đơn Hàng</h2>
          <p className="admin-page-desc">Theo dõi và giải quyết khiếu nại các đơn hàng trên toàn sàn</p>
        </div>
      </div>

      <div className="admin-category-card">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>search</span>
            <input
              type="text"
              className="admin-category-form-input"
              placeholder="Tìm theo mã đơn, sđt, tên khách hàng..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ margin: 0, paddingLeft: '40px' }}
            />
          </div>

          <select
            className="admin-category-form-input"
            style={{ margin: 0, width: '200px' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(ORDER_STATUS_MAP).map(([key, info]) => (
              <option key={key} value={key}>{info.text}</option>
            ))}
          </select>

          <button type="submit" className="admin-category-header-btn">
            Tìm kiếm
          </button>
        </form>

        <Alert type="danger" message={error} />
        <Alert type="success" message={success} />

        <div className="admin-table-container">
          {loading ? (
            <div className="admin-loading-container" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <div className="spinner"></div> Đang tải danh sách...
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Gian hàng</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-empty-state">
                      <div className="empty-content">
                        <span className="material-symbols-outlined empty-icon">receipt_long</span>
                        <p>Không tìm thấy đơn hàng nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const statusInfo = ORDER_STATUS_MAP[order.status] || { text: order.status, cls: 'pending' };
                    const firstItem = order.orderItems && order.orderItems.length > 0 ? order.orderItems[0] : null;
                    const extraItemsCount = order.orderItems ? order.orderItems.length - 1 : 0;

                    return (
                      <tr key={order.shopOrderId}>
                        <td>
                          <span style={{ fontWeight: 600, color: '#3b82f6' }}>#{order.shopOrderId}</span>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.shopName}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {order.shopId}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.receiverName || 'Chưa cập nhật'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{order.receiverPhone}</div>
                        </td>
                        <td>
                          {firstItem && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '250px' }}>
                              <img
                                src={firstItem.imageUrl ? (firstItem.imageUrl.startsWith('http') ? firstItem.imageUrl : `http://localhost:8080${firstItem.imageUrl}`) : '/placeholder.png'}
                                alt={firstItem.productName}
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {firstItem.productName}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  x{firstItem.quantity} {extraItemsCount > 0 && `(và ${extraItemsCount} sp khác)`}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                          {formatVND(order.subtotalAmount)}
                        </td>
                        <td>
                          <span className={`admin-status-badge ${statusInfo.cls}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="admin-action-btn approve"
                              title="Xem chi tiết"
                            >
                              <span className="material-symbols-outlined">visibility</span> Xem
                            </button>
                            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                              <button
                                onClick={() => setCancelModal({ show: true, orderId: order.shopOrderId, reason: '' })}
                                className="admin-action-btn reject"
                                title="Huỷ đơn khẩn cấp"
                              >
                                <span className="material-symbols-outlined">close</span> Huỷ
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="admin-pagination-container justify-center bg-light" style={{ marginTop: '20px' }}>
            <button
              className="admin-pagination-arrow-btn"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(p - 1, 0))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
              Trang {page + 1} / {totalPages}
            </span>
            <button
              className="admin-pagination-arrow-btn"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Xác nhận huỷ đơn #{cancelModal.orderId}</h3>
              <button className="modal-close" onClick={() => setCancelModal({ show: false, orderId: null, reason: '' })}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px' }}>
                Hành động này sẽ <strong>cưỡng chế huỷ đơn hàng</strong> của người dùng. Vui lòng ghi rõ lý do (VD: Gian lận, Tranh chấp không thể giải quyết).
              </p>
              <textarea
                className="modal-textarea"
                placeholder="Nhập lý do huỷ đơn..."
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
              />
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCancelModal({ show: false, orderId: null, reason: '' })}
              >
                Đóng
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Đang xử lý...' : 'Xác nhận Huỷ Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="product-detail-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="product-detail-modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="product-detail-modal-header">
              <h3>Chi tiết Đơn hàng #{selectedOrder.shopOrderId}</h3>
              <button className="admin-category-modal-close" onClick={() => setSelectedOrder(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="product-detail-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>Thông tin đơn hàng</h4>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Trạng thái:</strong> <span className={`admin-status-badge ${ORDER_STATUS_MAP[selectedOrder.status]?.cls || 'pending'}`}>{getStatusText(selectedOrder.status)}</span></p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Ngày đặt:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Thanh toán:</strong> {getPaymentMethodText(selectedOrder.paymentMethod)}</p>
                  {selectedOrder.voucherDiscount > 0 && (
                    <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Voucher (Sàn tài trợ):</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{formatVND(selectedOrder.voucherDiscount)}</span></p>
                  )}
                  {selectedOrder.status === 'CANCELLED' && selectedOrder.cancelReason && (
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#dc2626' }}><strong>Lý do hủy:</strong> {selectedOrder.cancelReason}</p>
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>Thông tin người nhận</h4>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Người nhận:</strong> {selectedOrder.receiverName || 'Không có'}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Điện thoại:</strong> {selectedOrder.receiverPhone || 'Không có'}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress || 'Không có'}</p>
                </div>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>Danh sách sản phẩm ({selectedOrder.orderItems?.length || 0})</h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
                {selectedOrder.orderItems?.map((item, index) => (
                  <div key={item.orderItemId || index} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: index < selectedOrder.orderItems.length - 1 ? '1px solid #e2e8f0' : 'none', background: '#fff' }}>
                    <div style={{ width: '60px', height: '60px', flexShrink: 0, marginRight: '12px' }}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8080${item.imageUrl}`}
                          alt={item.productName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>image</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 500 }}>{item.productName}</h5>
                      {item.variantAttributes && (
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Phân loại: {item.variantAttributes}</p>
                      )}
                    </div>
                    <div style={{ width: '100px', textAlign: 'right', fontSize: '14px' }}>{formatVND(item.price)}</div>
                    <div style={{ width: '50px', textAlign: 'right', fontSize: '14px', color: '#64748b' }}>x{item.quantity}</div>
                    <div style={{ width: '100px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>{formatVND(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Dòng tiền Khách hàng</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Tổng tiền hàng:</span>
                    <strong>{formatVND(selectedOrder.subtotalAmount)}</strong>
                  </div>
                  {selectedOrder.voucherDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>Voucher (Sàn tài trợ):</span>
                      <strong style={{ color: '#059669' }}>-{formatVND(selectedOrder.voucherDiscount)}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '15px' }}>
                    <span style={{ fontWeight: 600 }}>Khách đã trả:</span>
                    <strong style={{ color: '#0f172a' }}>{formatVND(selectedOrder.subtotalAmount - (selectedOrder.voucherDiscount || 0))}</strong>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Đối soát Gian hàng (Shop)</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Doanh thu bán hàng:</span>
                    <strong>{formatVND(selectedOrder.subtotalAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ color: '#64748b' }}>Phí hoa hồng sàn:</span>
                    <strong style={{ color: '#dc2626' }}>-{formatVND(selectedOrder.commissionAmount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '16px' }}>
                    <span style={{ fontWeight: 600 }}>Shop thực nhận:</span>
                    <strong style={{ color: '#059669', fontSize: '18px' }}>{formatVND(selectedOrder.sellerAmount)}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-form-actions" style={{ marginTop: '0', display: 'flex', justifyContent: 'flex-end', padding: '20px 32px 32px', borderTop: '1px solid #e2e8f0' }}>
              <button
                className="btn-primary"
                onClick={() => setSelectedOrder(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminOrdersPage;
