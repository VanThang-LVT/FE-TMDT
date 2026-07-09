import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { searchShopsApi, updateShopStatusByAdminApi } from '../../services/shop.service';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/modals/ConfirmModal';

function AdminShopsPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const pageSize = 10;
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, shopId: null, newStatus: '', title: '', message: '' });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  const fetchShops = useCallback(async (page = 0, keyword = '', status = '') => {
    try {
      setLoading(true);
      const params = { page, size: pageSize };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      
      const data = await searchShopsApi(token, params);
      setShops(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(page);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách gian hàng');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isAdmin()) navigate('/');
      else fetchShops(0, debouncedKeyword, filterStatus);
    }
  }, [authLoading, user, isAdmin, navigate, fetchShops, debouncedKeyword, filterStatus]);

  const handleUpdateStatus = (shopId, newStatus) => {
    const actionText = newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa';
    setConfirmModal({
      isOpen: true,
      shopId,
      newStatus,
      title: 'Xác nhận thay đổi trạng thái',
      message: `Bạn có chắc chắn muốn ${actionText} gian hàng này?`
    });
  };

  const confirmStatusUpdate = async () => {
    try {
      const { shopId, newStatus } = confirmModal;
      setConfirmModal({ ...confirmModal, isOpen: false });
      
      const actionText = newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa';
      await updateShopStatusByAdminApi(token, shopId, newStatus);
      toast.success(`Đã ${actionText} gian hàng thành công`);
      fetchShops(currentPage, debouncedKeyword, filterStatus);
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') return <span className="admin-status-badge active">Hoạt động</span>;
    if (status === 'INACTIVE' || status === 'BLOCKED' || status === 'LOCKED') return <span className="admin-status-badge rejected">Bị khóa</span>;
    if (status === 'PENDING') return <span className="admin-status-badge pending">Chờ duyệt</span>;
    if (status === 'REJECTED') return <span className="admin-status-badge rejected">Từ chối</span>;
    return <span className="admin-status-badge">{status}</span>;
  };

  if (authLoading || !user || !isAdmin()) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Đang xác thực...</div>;
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2 className="admin-page-title">Quản lý Gian hàng</h2>
            <p className="admin-page-desc">Xem danh sách và quản lý các gian hàng trên hệ thống.</p>
          </div>
          <div className="admin-search-group">
            <select
              className="admin-select-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
            <div className="admin-search-wrapper">
              <span className="material-symbols-outlined admin-search-icon">search</span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Tìm tên gian hàng, email..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Gian hàng</th>
                  <th>Chủ sở hữu</th>
                  <th>Thống kê</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="admin-empty-state">
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                      <p style={{ marginTop: '8px', color: '#94a3b8' }}>Đang tải...</p>
                    </td>
                  </tr>
                ) : shops.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-empty-state">
                      <div className="empty-content">
                        <span className="material-symbols-outlined empty-icon">storefront</span>
                        <p>Không tìm thấy gian hàng nào.</p>
                      </div>
                    </td>
                  </tr>
                ) : shops.map(s => (
                  <tr key={s.shopId}>
                    <td className="text-strong">#{s.shopId}</td>
                    <td>
                      <div className="admin-user-info-flex">
                        {s.logoUrl ? (
                          <img src={s.logoUrl.startsWith('http') ? s.logoUrl : `http://localhost:8080${s.logoUrl}`} alt="logo" className="admin-user-avatar-img" />
                        ) : (
                          <div className="admin-user-avatar-placeholder">
                            {s.shopName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-strong">{s.shopName}</div>
                          <div className="text-muted-small">{s.address}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-strong">{s.fullName}</div>
                      <div className="text-muted-small">{s.email}</div>
                      <div className="text-muted-small">{s.phone || 'Chưa cập nhật SĐT'}</div>
                    </td>
                    <td>
                      <div className="text-normal-small">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px', color: '#64748b' }}>inventory_2</span>
                        {s.totalProducts || 0} sản phẩm
                      </div>
                      <div className="text-normal-small" style={{ marginTop: '4px', color: '#eab308', fontWeight: 500 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>star</span>
                        {s.averageRating > 0 ? `${s.averageRating} / 5.0` : 'Chưa có đánh giá'}
                      </div>
                    </td>
                    <td>
                      <div className="text-normal-small">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td>{getStatusBadge(s.status)}</td>
                    <td>
                      <div className="admin-actions justify-center">
                        {s.status === 'ACTIVE' ? (
                          <button
                            className="admin-action-btn reject"
                            onClick={() => handleUpdateStatus(s.shopId, 'LOCKED')}
                            title="Khóa gian hàng"
                          >
                            <span className="material-symbols-outlined">lock</span> Khóa
                          </button>
                        ) : s.status === 'LOCKED' ? (
                          <button
                            className="admin-action-btn approve"
                            onClick={() => handleUpdateStatus(s.shopId, 'ACTIVE')}
                            title="Mở khóa gian hàng"
                          >
                            <span className="material-symbols-outlined">lock_open</span> Mở
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="admin-pagination-chevron-container">
            <button
              className="admin-pagination-chevron-btn"
              disabled={currentPage === 0}
              onClick={() => fetchShops(Math.max(0, currentPage - 1), debouncedKeyword, filterStatus)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            
            <span className="admin-pagination-chevron-info">
              Trang {currentPage + 1} / {totalPages}
            </span>
            
            <button
              className="admin-pagination-chevron-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => fetchShops(Math.min(totalPages - 1, currentPage + 1), debouncedKeyword, filterStatus)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmStatusUpdate}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          confirmText="Xác nhận"
          cancelText="Huỷ"
          type="danger"
        />
      </div>
    </AdminLayout>
  );
}

export default AdminShopsPage;
