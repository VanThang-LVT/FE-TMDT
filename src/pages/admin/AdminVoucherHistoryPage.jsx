import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllVoucherUsagesApi } from '../../services/voucher.service';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

function AdminVoucherHistoryPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  const fetchUsages = useCallback(async (page = 0, keyword = '') => {
    try {
      setLoading(true);
      const data = await getAllVoucherUsagesApi(page, 10, keyword, token);
      setUsages(data.content);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách sử dụng');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isAdmin()) navigate('/');
      else fetchUsages(0, debouncedKeyword);
    }
  }, [authLoading, user, isAdmin, navigate, fetchUsages, debouncedKeyword]);

  const formatDate = (str) => {
    if (!str) return '';
    return new Date(str).toLocaleString('vi-VN');
  };

  if (authLoading || !user || !isAdmin()) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Đang xác thực...</div>;
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2 className="admin-page-title">
              Lịch sử dùng Voucher
            </h2>
            <p className="admin-page-desc">Danh sách toàn bộ lịch sử sử dụng voucher của khách hàng.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
              <input
                type="text"
                className="admin-category-form-input"
                placeholder="Tìm mã, tên KH, email..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: '280px', paddingLeft: '40px', margin: 0, height: '42px' }}
              />
            </div>
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Voucher</th>
                  <th>Khách hàng</th>
                  <th>Mã đơn hàng</th>
                  <th style={{ textAlign: 'right' }}>Giá gốc</th>
                  <th style={{ textAlign: 'right' }}>Tiền giảm</th>
                  <th style={{ textAlign: 'right' }}>Thanh toán</th>
                  <th>Thời gian sử dụng</th>
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
                ) : usages.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-empty-state">
                      <div className="empty-content">
                        <span className="material-symbols-outlined empty-icon">history</span>
                        <p>Chưa có lịch sử sử dụng nào.</p>
                      </div>
                    </td>
                  </tr>
                ) : usages.map(u => (
                  <tr key={u.usageId}>
                    <td>
                      <span className="badge-orange">
                        {u.voucherCode}
                      </span>
                    </td>
                    <td>
                      <div className="text-strong">{u.userFullName}</div>
                      <div className="text-muted-small">{u.userEmail}</div>
                    </td>
                    <td>
                      <span className="badge-blue">
                        #{u.orderId}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#475569' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(u.orderOriginalAmount || 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(u.orderDiscountAmount || 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(u.orderTotalAmount || 0)}
                    </td>
                    <td className="text-normal-small">
                      {formatDate(u.usedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button
              className="admin-pagination-arrow-btn"
              disabled={currentPage === 0}
              onClick={() => fetchUsages(currentPage - 1, debouncedKeyword)}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span style={{ lineHeight: '36px', fontSize: '14px', color: '#475569' }}>
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              className="admin-pagination-arrow-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => fetchUsages(currentPage + 1, debouncedKeyword)}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminVoucherHistoryPage;
