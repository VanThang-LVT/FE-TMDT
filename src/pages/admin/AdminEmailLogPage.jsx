import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../layouts/AdminLayout';
import { getEmailLogsApi } from '../../services/emailLog.service';
import './AdminPage.css';

function AdminEmailLogPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [keyword, statusFilter]);

  useEffect(() => {
    if (token) fetchLogs();
  }, [token, page, keyword, statusFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        size,
        keyword: keyword.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      };

      const data = await getEmailLogsApi(token, params);
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách Email Log');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  const clearFilters = () => {
    setSearchInput('');
    setKeyword('');
    setStatusFilter('ALL');
  };

  const getStatusBadge = (status) => {
    if (status === 'SUCCESS') return <span className="status-badge status-active">Thành công</span>;
    if (status === 'FAILED') return <span className="status-badge status-inactive">Thất bại</span>;
    return <span className="status-badge">{status}</span>;
  };

  return (
    <AdminLayout>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '20px' }}>
        <div>
          <h2 className="admin-page-title">Lịch sử Gửi Email</h2>
          <p className="admin-page-desc">Theo dõi toàn bộ lịch sử gửi thư từ hệ thống đến người dùng.</p>
        </div>

        <div className="admin-filter-bar-right">
          <form onSubmit={handleSearch} className="admin-search-form-inline">
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
              <input 
                type="text" 
                className="admin-category-form-input"
                placeholder="Email, tiêu đề..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: '280px', paddingLeft: '40px', margin: 0, height: '42px' }}
              />
            </div>
            <button type="submit" className="admin-category-header-btn">
              Tìm kiếm
            </button>
          </form>

          <select 
            className="admin-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
          </select>

          {(keyword || statusFilter !== 'ALL') && (
            <button 
              onClick={clearFilters}
              className="admin-btn-clear-filter"
              title="Xóa bộ lọc"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-table-card">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ngày Gửi</th>
                    <th>Người Nhận</th>
                    <th>Tiêu Đề</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.emailId}>
                        <td>#{log.emailId}</td>
                        <td>{new Date(log.sentAt).toLocaleString('vi-VN')}</td>
                        <td>
                          {log.recipientEmail}
                        </td>
                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.subject}
                        </td>
                        <td>{getStatusBadge(log.sendStatus)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn btn-outline"
                            onClick={() => setSelectedLog(log)}
                            style={{ padding: '4px 8px', fontSize: '13px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>visibility</span>
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', padding: '15px 0' }}>
              <button 
                className="admin-action-btn approve" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', opacity: page === 0 ? 0.5 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer', width: 'auto' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
              </button>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                Trang {page + 1} / {Math.max(1, totalPages)}
              </span>
              <button 
                className="admin-action-btn approve" 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', opacity: page >= totalPages - 1 ? 0.5 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', width: 'auto' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
              </button>
            </div>
          </>
        )}
      </div>

      {selectedLog && (
        <div className="email-log-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="email-log-modal" onClick={e => e.stopPropagation()}>
            
            <div className="email-log-modal-header">
              <h3 className="email-log-modal-title">
                <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '24px' }}>mail</span>
                Chi tiết Email #{selectedLog.emailId}
              </h3>
              <button className="email-log-modal-close" onClick={() => setSelectedLog(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="email-log-modal-body">
              <div className="email-log-info-grid">
                <div className="email-log-info-item">
                  <div className="label">Người nhận</div>
                  <div className="value">{selectedLog.recipientEmail}</div>
                </div>
                <div className="email-log-info-item">
                  <div className="label">Trạng thái</div>
                  <div>{getStatusBadge(selectedLog.sendStatus)}</div>
                </div>
                <div className="email-log-info-item full-width">
                  <div className="label">Tiêu đề</div>
                  <div className="value">{selectedLog.subject}</div>
                </div>
                <div className="email-log-info-item">
                  <div className="label">Ngày gửi</div>
                  <div className="value">{new Date(selectedLog.sentAt).toLocaleString('vi-VN')}</div>
                </div>
              </div>
              
              <div>
                <div className="email-log-content-header">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748b' }}>description</span>
                  Nội dung Email
                </div>
                <div className="email-log-content-box">
                  {selectedLog.content}
                </div>
              </div>
            </div>

            <div className="email-log-modal-footer">
              <button 
                className="btn" 
                style={{ padding: '10px 24px', width: 'auto', borderRadius: '8px' }} 
                onClick={() => setSelectedLog(null)}
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

export default AdminEmailLogPage;
