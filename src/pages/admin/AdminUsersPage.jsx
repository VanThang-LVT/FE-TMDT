import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUsersApi, updateUserStatusApi } from '../../services/user.service';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/modals/ConfirmModal';

function AdminUsersPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const pageSize = 10;
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, newStatus: '', title: '', message: '' });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  const fetchUsers = useCallback(async (page = 0, keyword = '', status = '', role = '') => {
    try {
      setLoading(true);
      const params = { page, size: pageSize };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      if (role) params.role = role;
      
      const data = await getUsersApi(token, params);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(page);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isAdmin()) navigate('/');
      else fetchUsers(0, debouncedKeyword, filterStatus, filterRole);
    }
  }, [authLoading, user, isAdmin, navigate, fetchUsers, debouncedKeyword, filterStatus, filterRole]);

  const handleUpdateStatus = (userId, newStatus) => {
    if (userId === user.userId) {
      toast.error('Không thể thay đổi trạng thái của chính mình');
      return;
    }
    const actionText = newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa';
    setConfirmModal({
      isOpen: true,
      userId,
      newStatus,
      title: 'Xác nhận thay đổi trạng thái',
      message: `Bạn có chắc chắn muốn ${actionText} người dùng này?`
    });
  };

  const confirmStatusUpdate = async () => {
    try {
      const { userId, newStatus } = confirmModal;
      setConfirmModal({ ...confirmModal, isOpen: false });
      
      const actionText = newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa';
      await updateUserStatusApi(token, userId, newStatus);
      toast.success(`Đã ${actionText} người dùng thành công`);
      fetchUsers(currentPage, debouncedKeyword, filterStatus, filterRole);
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'ACTIVE') return <span className="admin-status-badge active">Hoạt động</span>;
    if (status === 'INACTIVE' || status === 'BLOCKED' || status === 'LOCKED') return <span className="admin-status-badge rejected">Bị khóa</span>;
    return <span className="admin-status-badge">{status}</span>;
  };

  const getRolesText = (roles) => {
    if (!roles || roles.length === 0) return 'Người dùng';
    if (roles.includes('ADMIN')) return 'Quản trị viên';
    if (roles.includes('SELLER')) return 'Người bán';
    return 'Khách hàng';
  };

  if (authLoading || !user || !isAdmin()) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Đang xác thực...</div>;
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2 className="admin-page-title">Quản lý Người dùng</h2>
            <p className="admin-page-desc">Xem danh sách và quản lý tài khoản người dùng trên hệ thống.</p>
          </div>
          <div className="admin-search-group">
            <select
              className="admin-select-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Tất cả vai trò</option>
              <option value="CUSTOMER">Khách hàng</option>
              <option value="SELLER">Người bán</option>
            </select>
            <select
              className="admin-select-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Bị khóa</option>
            </select>
            <div className="admin-search-wrapper">
              <span className="material-symbols-outlined admin-search-icon">search</span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Tìm email, tên..."
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
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Liên hệ</th>
                  <th>Ngày tham gia</th>
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-empty-state">
                      <div className="empty-content">
                        <span className="material-symbols-outlined empty-icon">group_off</span>
                        <p>Không tìm thấy người dùng nào.</p>
                      </div>
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.userId}>
                    <td className="text-strong">#{u.userId}</td>
                    <td>
                      <div className="admin-user-info-flex">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl.startsWith('http') ? u.avatarUrl : `http://localhost:8080${u.avatarUrl}`} alt="avatar" className="admin-user-avatar-img" />
                        ) : (
                          <div className="admin-user-avatar-placeholder">
                            {u.fullName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-strong">{u.fullName}</div>
                          <div className="text-muted-small">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-role-badge ${u.roles?.includes('ADMIN') ? 'admin' : (u.roles?.includes('SELLER') ? 'seller' : 'customer')}`}>
                        {getRolesText(u.roles)}
                      </span>
                    </td>
                    <td>
                      <div className="text-normal-small">{u.phone || 'Chưa cập nhật'}</div>
                    </td>
                    <td>
                      <div className="text-normal-small">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td>{getStatusBadge(u.status)}</td>
                    <td>
                      <div className="admin-actions justify-center">
                        {u.userId !== user.userId && (
                          u.status === 'ACTIVE' ? (
                            <button
                              className="admin-action-btn reject"
                              onClick={() => handleUpdateStatus(u.userId, 'INACTIVE')}
                              title="Khóa tài khoản"
                            >
                              <span className="material-symbols-outlined">lock</span> Khóa
                            </button>
                          ) : (
                            <button
                              className="admin-action-btn approve"
                              onClick={() => handleUpdateStatus(u.userId, 'ACTIVE')}
                              title="Mở khóa tài khoản"
                            >
                              <span className="material-symbols-outlined">lock_open</span> Mở
                            </button>
                          )
                        )}
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
              onClick={() => fetchUsers(Math.max(0, currentPage - 1), debouncedKeyword, filterStatus, filterRole)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            
            <span className="admin-pagination-chevron-info">
              Trang {currentPage + 1} / {totalPages}
            </span>
            
            <button
              className="admin-pagination-chevron-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => fetchUsers(Math.min(totalPages - 1, currentPage + 1), debouncedKeyword, filterStatus, filterRole)}
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

export default AdminUsersPage;
