import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import AdminLayout from '../../layouts/AdminLayout';
import Alert from '../../components/Alert';
import PromptModal from '../../components/modals/PromptModal';
import { API_BASE_URL } from '../../utils/constants';
import './AdminPage.css';

function AdminProductsPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { products, loading, error, success, isProcessing, handleApprove, handleReject } = useAdminProducts(token);

  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, ACTIVE, REJECTED
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectingProductId, setRejectingProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isAdmin()) navigate('/customer');
    }
  }, [user, authLoading, isAdmin, navigate]);

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
      </AdminLayout>
    );
  }

  const filteredProducts = products.filter(p => {
    const matchStatus = p.status === activeTab;
    const matchSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (p.shopName && p.shopName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="admin-status-badge pending">Chờ duyệt</span>;
      case 'ACTIVE': return <span className="admin-status-badge">Đã duyệt</span>;
      case 'REJECTED': return <span className="admin-status-badge inactive">Từ chối</span>;
      default: return <span className="admin-status-badge">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Kiểm duyệt Sản phẩm</h2>
          <p className="admin-page-desc">Phê duyệt hoặc từ chối các sản phẩm do người bán đăng lên.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="admin-search" style={{ width: '280px', backgroundColor: 'white', margin: 0 }}>
            <span className="material-symbols-outlined" style={{color: '#94a3b8'}}>search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm, gian hàng..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Alert type="danger" message={error} />
      <Alert type="success" message={success} />

      <div className="admin-tabs" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('PENDING')}
        >
          Chờ duyệt ({products.filter(p => p.status === 'PENDING').length})
        </button>
        <button 
          className={`btn ${activeTab === 'ACTIVE' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Đã duyệt ({products.filter(p => p.status === 'ACTIVE').length})
        </button>
        <button 
          className={`btn ${activeTab === 'REJECTED' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('REJECTED')}
        >
          Đã từ chối ({products.filter(p => p.status === 'REJECTED').length})
        </button>
      </div>


      <div className="admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá & Kho</th>
                <th>Người bán</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th style={{textAlign: 'center'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-empty-state">Không có sản phẩm nào trong mục này.</td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.productId}>
                    <td>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {p.mainImageId ? (
                            <img src={`${API_BASE_URL}/public/images/${p.mainImageId}`} alt={p.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)' }}>image</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.productName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thương hiệu: {p.brand || '---'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-number" style={{ fontWeight: 600 }}>{p.price.toLocaleString('vi-VN')} đ</div>
                      <div className="font-number" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kho: {p.stockQuantity}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.shopName || `Shop #${p.shopId}`}</div>
                    </td>
                    <td className="font-number">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>{renderStatusBadge(p.status)}</td>
                    <td>
                      <div className="admin-actions">
                        {p.status === 'PENDING' && (
                          <>
                            <button 
                              className="admin-action-btn" 
                              title="Xem chi tiết" 
                              onClick={() => setSelectedProduct(p)}
                              style={{ color: 'var(--primary-color)' }}
                            >
                              <span className="material-symbols-outlined icon-18">visibility</span>
                            </button>
                            <button 
                              className="admin-action-btn approve" 
                              title="Duyệt" 
                              disabled={isProcessing}
                              onClick={() => handleApprove(p.productId)}
                            >
                              <span className="material-symbols-outlined icon-18">check_circle</span>
                            </button>
                            <button 
                              className="admin-action-btn reject" 
                              title="Từ chối" 
                              disabled={isProcessing}
                              onClick={() => setRejectingProductId(p.productId)}
                            >
                              <span className="material-symbols-outlined icon-18">cancel</span>
                            </button>
                          </>
                        )}
                        {p.status === 'ACTIVE' && (
                          <>
                            <button 
                              className="admin-action-btn" 
                              title="Xem chi tiết" 
                              onClick={() => setSelectedProduct(p)}
                              style={{ color: 'var(--primary-color)' }}
                            >
                              <span className="material-symbols-outlined icon-18">visibility</span>
                            </button>
                            <button 
                              className="admin-action-btn reject" 
                              title="Khóa/Từ chối" 
                              disabled={isProcessing}
                              onClick={() => setRejectingProductId(p.productId)}
                            >
                              <span className="material-symbols-outlined icon-18">block</span>
                            </button>
                          </>
                        )}
                        {p.status === 'REJECTED' && (
                          <>
                            <button 
                              className="admin-action-btn" 
                              title="Xem chi tiết" 
                              onClick={() => setSelectedProduct(p)}
                              style={{ color: 'var(--primary-color)' }}
                            >
                              <span className="material-symbols-outlined icon-18">visibility</span>
                            </button>
                            <button 
                              className="admin-action-btn approve" 
                              title="Duyệt lại" 
                              disabled={isProcessing}
                              onClick={() => handleApprove(p.productId)}
                            >
                              <span className="material-symbols-outlined icon-18">restore</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <div className="product-detail-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-detail-modal-content" onClick={e => e.stopPropagation()}>
            <div className="product-detail-modal-header">
              <h3>Chi tiết Sản phẩm</h3>
              <button className="admin-category-modal-close" onClick={() => setSelectedProduct(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                  <h4 style={{ marginBottom: '16px', color: '#1e293b', fontSize: '16px' }}>Hình ảnh ({selectedProduct.imageIds?.length || 0})</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                    {selectedProduct.imageIds && selectedProduct.imageIds.length > 0 ? (
                      selectedProduct.imageIds.map(id => (
                        <img 
                          key={id} 
                          src={`${API_BASE_URL}/public/images/${id}`} 
                          alt="Product" 
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: id === selectedProduct.mainImageId ? '3px solid #2563eb' : '1px solid #e2e8f0' }}
                        />
                      ))
                    ) : (
                      <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748b' }}>
                        Không có hình ảnh
                      </div>
                    )}
                  </div>
                  
                  <h4 style={{ marginTop: '28px', marginBottom: '16px', color: '#1e293b', fontSize: '16px' }}>Mô tả sản phẩm</h4>
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6', color: '#334155', border: '1px solid #e2e8f0' }}>
                    {selectedProduct.description || 'Không có mô tả'}
                  </div>

                  <h4 style={{ marginTop: '28px', marginBottom: '16px', color: '#1e293b', fontSize: '16px' }}>Từ khóa (Keywords)</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedProduct.keywords ? selectedProduct.keywords.split(',').map((k, i) => (
                      <span key={i} style={{ padding: '6px 16px', background: '#f1f5f9', borderRadius: '20px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>{k.trim()}</span>
                    )) : <span style={{ color: '#64748b', fontSize: '14px' }}>Không có từ khóa</span>}
                  </div>
                </div>

                <div>
                  <h4 style={{ marginBottom: '16px', color: '#1e293b', fontSize: '16px' }}>Thông tin cơ bản</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', background: '#ffffff' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#64748b', width: '35%' }}>Tên sản phẩm</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{selectedProduct.productName}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Thương hiệu</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: '500', color: '#334155' }}>{selectedProduct.brand || '---'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Danh mục</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: '500', color: '#334155' }}>{selectedProduct.categoryName}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Giá bán</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: '700', color: '#2563eb', fontSize: '16px' }} className="font-number">{selectedProduct.price.toLocaleString('vi-VN')} đ</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Tồn kho</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }} className="font-number">{selectedProduct.stockQuantity}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '28px', marginBottom: '16px', color: '#1e293b', fontSize: '16px' }}>Thông số kỹ thuật</h4>
                  {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden' }}>
                      <tbody>
                        {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                          <tr key={key}>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#475569', width: '40%', fontWeight: '500' }}>{key}</td>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#0f172a' }}>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '14px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                      {selectedProduct.specifications || 'Không có thông số kỹ thuật'}
                    </div>
                  )}
                </div>
              </div>
              
              {selectedProduct.approvalHistories && selectedProduct.approvalHistories.length > 0 && (
                <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                  <h4 style={{ marginBottom: '16px', color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#64748b' }}>history</span>
                    Lịch sử kiểm duyệt
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedProduct.approvalHistories.map((hist, index) => (
                      <div key={hist.approvalId} style={{ display: 'flex', gap: '16px', padding: '16px', background: hist.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${hist.status === 'APPROVED' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: hist.status === 'APPROVED' ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                            {hist.status === 'APPROVED' ? 'check' : 'close'}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '14px' }}>
                              {hist.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối/Khóa'}
                            </strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {new Date(hist.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                            Người duyệt: <span style={{ fontWeight: '500' }}>{hist.adminName || 'Hệ thống'}</span>
                          </div>
                          {hist.note && (
                            <div style={{ fontSize: '14px', color: '#334155', background: 'white', padding: '10px 12px', borderRadius: '8px', marginTop: '8px', border: '1px solid #e2e8f0' }}>
                              {hist.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', margin: '20px -32px -32px -32px', padding: '16px 32px', background: '#f8fafc', borderRadius: '0 0 16px 16px' }}>
              <button 
                style={{ padding: '8px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }} 
                onClick={() => setSelectedProduct(null)}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <PromptModal 
        isOpen={!!rejectingProductId}
        title="Xác nhận từ chối/khóa"
        label="Vui lòng cung cấp lý do để người bán khắc phục:"
        placeholder="Ví dụ: Hình ảnh quá mờ, sai danh mục..."
        confirmText="Từ chối"
        cancelText="Hủy"
        type="danger"
        onCancel={() => setRejectingProductId(null)}
        onConfirm={(reason) => {
          handleReject(rejectingProductId, reason);
          setRejectingProductId(null);
        }}
      />
    </AdminLayout>
  );
}

export default AdminProductsPage;
