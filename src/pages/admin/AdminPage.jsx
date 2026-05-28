import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllShopsApi, approveOrRejectShopApi } from '../../services/shop.service';
import AdminLayout from '../../components/layout/AdminLayout';
import ConfirmModal from '../../components/modals/ConfirmModal';
import PromptModal from '../../components/modals/PromptModal';
import './AdminPage.css';

function AdminPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [pendingShops, setPendingShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal States
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, shopId: null });
  const [promptModal, setPromptModal] = useState({ isOpen: false, shopId: null });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isAdmin()) {
        navigate('/customer'); // Protect route
      } else {
        fetchPendingShops();
      }
    }
  }, [user, authLoading, isAdmin, navigate, token]);

  const fetchPendingShops = async () => {
    setLoadingShops(true);
    try {
      const res = await getAllShopsApi('PENDING', token);
      setPendingShops(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingShops(false);
    }
  };

  const executeAction = async (id, status, reason = null) => {
    setError('');
    setSuccess('');
    try {
      await approveOrRejectShopApi(id, status, token, reason);
      setSuccess(`Đã ${status === 'ACTIVE' ? 'duyệt' : 'từ chối'} gian hàng thành công!`);
      setPendingShops(pendingShops.filter(shop => shop.shopId !== id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConfirmApprove = () => {
    if (confirmModal.shopId) {
      executeAction(confirmModal.shopId, 'ACTIVE');
    }
    setConfirmModal({ isOpen: false, shopId: null });
  };

  const handleConfirmReject = (reason) => {
    if (promptModal.shopId) {
      executeAction(promptModal.shopId, 'REJECTED', reason);
    }
    setPromptModal({ isOpen: false, shopId: null });
  };

  if (authLoading || !user || !isAdmin()) {
    return <div style={{ padding: '50px', textAlign: 'center', color: '#181c20' }}>Đang xác thực quyền Admin...</div>;
  }

  return (
    <AdminLayout>
      {/* Modals */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Xác nhận duyệt gian hàng"
        message="Bạn có chắc chắn muốn duyệt yêu cầu mở gian hàng này? Người dùng sẽ được cấp quyền Người Bán."
        onConfirm={handleConfirmApprove}
        onCancel={() => setConfirmModal({ isOpen: false, shopId: null })}
        confirmText="Duyệt ngay"
        type="primary"
      />
      
      <PromptModal 
        isOpen={promptModal.isOpen}
        title="Từ chối gian hàng"
        label="Lý do từ chối"
        placeholder="Vui lòng nhập lý do từ chối để thông báo cho người dùng..."
        onConfirm={handleConfirmReject}
        onCancel={() => setPromptModal({ isOpen: false, shopId: null })}
        confirmText="Xác nhận từ chối"
        type="danger"
      />

      {error && <div className="admin-alert error">{error}</div>}
      {success && <div className="admin-alert success">{success}</div>}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Yêu cầu duyệt gian hàng</h2>
          <p className="admin-page-desc">Quản lý và phê duyệt các yêu cầu mở gian hàng mới từ người dùng.</p>
        </div>
        <div className="admin-header-stats">
          <div className="stat-box">
            <span className="stat-value">{pendingShops.length < 10 ? `0${pendingShops.length}` : pendingShops.length}</span>
            <span className="stat-label">Chờ duyệt</span>
          </div>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Gian hàng</th>
                <th>Chủ sở hữu</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th style={{textAlign: 'right'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingShops ? (
                <tr>
                  <td colSpan="5" className="admin-empty-state">
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                      <div className="spinner"></div> Đang tải danh sách...
                    </div>
                  </td>
                </tr>
              ) : pendingShops.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-empty-state">
                    <div className="empty-content">
                      <span className="material-symbols-outlined empty-icon">inbox</span>
                      <p>Không có yêu cầu mở gian hàng nào đang chờ duyệt.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingShops.map((shop) => (
                  <tr key={shop.shopId}>
                    <td>
                      <div className="admin-shop-info">
                        <div className="admin-shop-avatar">{shop.shopName.substring(0, 2).toUpperCase()}</div>
                        <div>
                          <p className="admin-shop-name">{shop.shopName}</p>
                          <p className="admin-shop-time">ID: {shop.shopId}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-owner-info">
                        <span className="owner-name">{shop.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <p className="admin-shop-desc">{shop.description || 'Không có mô tả'}</p>
                    </td>
                    <td>
                      <span className="admin-status-badge">Chờ duyệt</span>
                    </td>
                    <td style={{textAlign: 'right'}}>
                      <div className="admin-actions">
                        <button className="admin-action-btn approve" onClick={() => setConfirmModal({ isOpen: true, shopId: shop.shopId })} title="Duyệt">
                          <span className="material-symbols-outlined">check</span>
                          Duyệt
                        </button>
                        <button className="admin-action-btn reject" onClick={() => setPromptModal({ isOpen: true, shopId: shop.shopId })} title="Từ chối">
                          <span className="material-symbols-outlined">close</span>
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminPage;
