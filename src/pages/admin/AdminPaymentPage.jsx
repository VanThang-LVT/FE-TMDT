import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPaymentTransactionsApi } from '../../services/payment.service';
import AdminLayout from '../../layouts/AdminLayout';
import './AdminPage.css';

function AdminPaymentPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getPaymentTransactionsApi(keyword, status, page, pageSize, token);
      setTransactions(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [keyword, status, page, pageSize, token]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isAdmin()) {
        navigate('/customer');
      } else {
        fetchTransactions();
      }
    }
  }, [user, authLoading, isAdmin, navigate, fetchTransactions]);

  const handleSearchChange = (e) => {
    setKeyword(e.target.value);
    setPage(0); 
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(0); 
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const getStatusBadgeClass = (statusStr) => {
    if (statusStr === 'SUCCESS' || statusStr === 'HOAN_TIEN_THANH_CONG') return 'success';
    if (statusStr === 'FAILED' || statusStr === 'CANCELLED' || statusStr === 'HOAN_TIEN_THAT_BAI') return 'failed';
    return 'pending';
  };

  const translateStatus = (statusStr) => {
    if (statusStr === 'SUCCESS') return 'Thành công';
    if (statusStr === 'FAILED') return 'Thất bại';
    if (statusStr === 'CANCELLED') return 'Đã hủy';
    if (statusStr === 'HOAN_TIEN_THANH_CONG') return 'Hoàn tiền T.Công';
    if (statusStr === 'HOAN_TIEN_THAT_BAI') return 'Hoàn tiền Thất bại';
    return statusStr;
  };

  if (authLoading || !user || !isAdmin()) {
    return <div style={{ padding: '50px', textAlign: 'center', color: '#181c20' }}>Đang xác thực quyền Admin...</div>;
  }

  return (
    <AdminLayout>
      {error && <div className="admin-alert error">{error}</div>}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Nhật ký thanh toán</h2>
          <p className="admin-page-desc">Xem và theo dõi tất cả lịch sử giao dịch thanh toán trên hệ thống.</p>
        </div>
        <div className="admin-header-actions">
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
            <input
              type="text"
              className="admin-category-form-input"
              placeholder="Tìm theo Tên, Email, Mã Đơn, Mã GD..."
              value={keyword}
              onChange={handleSearchChange}
              style={{ width: '280px', paddingLeft: '40px', margin: 0, height: '42px' }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="admin-select-filter admin-payment-select"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="HOAN_TIEN_THANH_CONG">Hoàn tiền T.Công</option>
            <option value="HOAN_TIEN_THAT_BAI">Hoàn tiền Thất bại</option>
          </select>

          {/* Tải lại Button */}
          <button 
            onClick={fetchTransactions} 
            className="btn-primary admin-payment-btn-refresh"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
            Tải lại
          </button>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID / Ngày tạo</th>
                <th>Mã DH</th>
                <th>Khách hàng</th>
                <th className="admin-table-col-right">Số tiền</th>
                <th>Cổng & Phương thức</th>
                <th>Mã GD Cổng</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div className="spinner"></div> Đang tải nhật ký giao dịch...
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-empty-state">
                    <div className="empty-content">
                      <span className="material-symbols-outlined empty-icon">payments</span>
                      <p>Không tìm thấy nhật ký giao dịch thanh toán nào.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.transactionId}>
                    <td>
                      <div>
                        <span style={{ fontWeight: '600' }}>#{txn.transactionId}</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                          {new Date(txn.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', color: '#2563eb' }}>#{txn.orderId}</span>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: '600' }}>{txn.customerName}</span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                          {txn.customerEmail}
                        </p>
                      </div>
                    </td>
                    <td className="admin-table-col-right" style={{ fontWeight: '700', color: '#0f172a' }}>
                      {formatVND(txn.amount)}
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: '600', textTransform: 'uppercase' }}>{txn.gatewayName}</span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                          Cách thức: {txn.paymentMethod}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', wordBreak: 'break-all' }}>
                        {txn.gatewayTransactionCode || 'N/A'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`admin-status-badge ${getStatusBadgeClass(txn.transactionStatus)}`}>
                        {translateStatus(txn.transactionStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', paddingBottom: '20px' }}>
            <button
              disabled={page === 0}
              onClick={() => handlePageChange(page - 1)}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', 
                border: page === 0 ? '1px solid #e2e8f0' : '1px solid #bbf7d0', 
                background: page === 0 ? '#f8fafc' : '#f0fdf4', 
                color: page === 0 ? '#94a3b8' : '#16a34a', 
                cursor: page === 0 ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s' 
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>
              Trang {page + 1} / {totalPages}
            </span>
            
            <button
              disabled={page >= totalPages - 1}
              onClick={() => handlePageChange(page + 1)}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', 
                border: page >= totalPages - 1 ? '1px solid #e2e8f0' : '1px solid #bbf7d0', 
                background: page >= totalPages - 1 ? '#f8fafc' : '#f0fdf4', 
                color: page >= totalPages - 1 ? '#94a3b8' : '#16a34a', 
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s' 
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminPaymentPage;
