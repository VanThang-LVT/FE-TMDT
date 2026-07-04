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
  const {
    products, loading, error, success, isProcessing,
    keyword, setKeyword,
    status, setStatus,
    page, setPage,
    totalPages, totalElements, pageSize,
    handleApprove, handleReject
  } = useAdminProducts(token);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectingProductId, setRejectingProductId] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user)
        navigate('/login');
      else if (!isAdmin())
        navigate('/customer');
    }
  }, [user, authLoading, isAdmin, navigate]);

  if (authLoading || !user || !isAdmin()) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#181c20' }}>
        Đang xác thực quyền Admin...
      </div>
    );
  }

  const renderStatusBadge = (statusStr) => {
    switch (statusStr) {
      case 'PENDING':
        return <span className="admin-status-badge pending">Chờ duyệt</span>;
      case 'ACTIVE':
        return <span className="admin-status-badge">Đã duyệt</span>;
      case 'REJECTED':
        return <span className="admin-status-badge inactive">Từ chối</span>;
      default:
        return <span className="admin-status-badge">{statusStr}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Kiểm duyệt Sản phẩm</h2>
          <p className="admin-page-desc">Phê duyệt hoặc từ chối các sản phẩm do người bán đăng lên.</p>
        </div>
        <div className="admin-header-actions">
          <div className="admin-search admin-search-wrapper" style={{ width: '320px' }}>
            <span className="material-symbols-outlined admin-search-icon">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm, gian hàng..." 
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            />
          </div>
        </div>
      </div>

      <Alert type="danger" message={error} />
      <Alert type="success" message={success} />

      <div className="admin-tabs admin-tabs-container">
        <button 
          className={`btn ${status === 'PENDING' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setStatus('PENDING'); setPage(0); }}
        >
          Chờ duyệt {status === 'PENDING' ? `(${totalElements})` : ''}
        </button>
        <button 
          className={`btn ${status === 'ACTIVE' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setStatus('ACTIVE'); setPage(0); }}
        >
          Đã duyệt {status === 'ACTIVE' ? `(${totalElements})` : ''}
        </button>
        <button 
          className={`btn ${status === 'REJECTED' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setStatus('REJECTED'); setPage(0); }}
        >
          Đã từ chối {status === 'REJECTED' ? `(${totalElements})` : ''}
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
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="admin-empty-state">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div className="spinner"></div> Đang tải dữ liệu sản phẩm...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="admin-empty-state">Không có sản phẩm nào trong mục này.</td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.productId}>
                    <td>
                      <div className="product-list-item">
                        <div className="product-list-img-box">
                          {p.mainImageId ? (
                            <img src={`${API_BASE_URL}/public/images/${p.mainImageId}`} alt={p.productName} className="product-list-img" />
                          ) : (
                            <span className="material-symbols-outlined product-list-img-placeholder">image</span>
                          )}
                        </div>
                        <div>
                          <div className="product-list-name">{p.productName}</div>
                          <div className="product-list-brand">Thương hiệu: {p.brand || '---'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-number product-list-price">{p.price.toLocaleString('vi-VN')} đ</div>
                      <div className="font-number product-list-stock">Kho: {p.stockQuantity}</div>
                    </td>
                    <td>
                      <div className="product-list-shop">{p.shopName || `Shop #${p.shopId}`}</div>
                    </td>
                    <td className="font-number">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td>{renderStatusBadge(p.status)}</td>
                    <td>
                      <div className="admin-actions center">
                        <button 
                          className="admin-action-btn" 
                          title="Xem chi tiết" 
                          onClick={() => setSelectedProduct(p)}
                          style={{ backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}
                        >
                          <span className="material-symbols-outlined icon-18">visibility</span> Chi tiết
                        </button>

                        {p.status === 'PENDING' && (
                          <>
                            <button 
                              className="admin-action-btn approve" 
                              title="Duyệt" 
                              disabled={isProcessing}
                              onClick={() => handleApprove(p.productId)}
                            >
                              <span className="material-symbols-outlined icon-18">check_circle</span> Duyệt
                            </button>
                            <button 
                              className="admin-action-btn reject" 
                              title="Từ chối" 
                              disabled={isProcessing}
                              onClick={() => setRejectingProductId(p.productId)}
                            >
                              <span className="material-symbols-outlined icon-18">cancel</span> Từ chối
                            </button>
                          </>
                        )}
                        {p.status === 'ACTIVE' && (
                          <button 
                            className="admin-action-btn reject" 
                            title="Khóa/Từ chối" 
                            disabled={isProcessing}
                            onClick={() => setRejectingProductId(p.productId)}
                          >
                            <span className="material-symbols-outlined icon-18">block</span> Khóa
                          </button>
                        )}
                        {p.status === 'REJECTED' && (
                          <button 
                            className="admin-action-btn approve" 
                            title="Duyệt lại" 
                            disabled={isProcessing}
                            onClick={() => handleApprove(p.productId)}
                          >
                            <span className="material-symbols-outlined icon-18">restore</span> Duyệt lại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="admin-pagination-container">
            <span className="admin-pagination-info">
              Hiển thị <strong>{page * pageSize + 1}</strong> - <strong>{Math.min((page + 1) * pageSize, totalElements)}</strong> trong số <strong>{totalElements}</strong> sản phẩm
            </span>
            <div className="admin-pagination-buttons">
              <button
                className="admin-pagination-btn"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </button>
              
              {[...Array(totalPages).keys()].map((pNum) => (
                <button
                  key={pNum}
                  className={`admin-pagination-btn ${pNum === page ? 'active' : ''}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum + 1}
                </button>
              ))}

              <button
                className="admin-pagination-btn"
                disabled={page === totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
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
            <div className="product-detail-body">
              <div className="product-detail-grid">
                <div>
                  <h4 className="product-detail-section-title first">Hình ảnh ({selectedProduct.imageIds?.length || 0})</h4>
                  <div className="product-image-grid">
                    {selectedProduct.imageIds && selectedProduct.imageIds.length > 0 ? (
                      selectedProduct.imageIds.map(id => (
                        <img 
                          key={id} 
                          src={`${API_BASE_URL}/public/images/${id}`} 
                          alt="Product" 
                          className={`product-image-item ${id === selectedProduct.mainImageId ? 'main' : ''}`}
                        />
                      ))
                    ) : (
                      <div className="product-empty-box">
                        Không có hình ảnh
                      </div>
                    )}
                  </div>
                  
                  <h4 className="product-detail-section-title">Mô tả sản phẩm</h4>
                  <div className="product-desc-box">
                    {selectedProduct.description || 'Không có mô tả'}
                  </div>

                  <h4 className="product-detail-section-title">Từ khóa (Keywords)</h4>
                  <div className="product-keyword-tags">
                    {selectedProduct.keywords ? selectedProduct.keywords.split(',').map((k, i) => (
                      <span key={i} className="product-keyword-tag">{k.trim()}</span>
                    )) : <span style={{ color: '#64748b', fontSize: '14px' }}>Không có từ khóa</span>}
                  </div>
                </div>

                <div>
                  <h4 className="product-detail-section-title first">Thông tin cơ bản</h4>
                  <table className="product-info-table">
                    <tbody>
                      <tr>
                        <td className="product-info-label" style={{ width: '35%' }}>Tên sản phẩm</td>
                        <td className="product-info-value">{selectedProduct.productName}</td>
                      </tr>
                      <tr>
                        <td className="product-info-label">Thương hiệu</td>
                        <td className="product-info-value">{selectedProduct.brand || '---'}</td>
                      </tr>
                      <tr>
                        <td className="product-info-label">Danh mục</td>
                        <td className="product-info-value">{selectedProduct.categoryName}</td>
                      </tr>
                      <tr>
                        <td className="product-info-label">Giá bán</td>
                        <td className="product-info-value blue font-number">{selectedProduct.price.toLocaleString('vi-VN')} đ</td>
                      </tr>
                      <tr>
                        <td className="product-info-label">Tồn kho</td>
                        <td className="product-info-value font-number">{selectedProduct.stockQuantity}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 className="product-detail-section-title">Thông số kỹ thuật</h4>
                  {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 ? (
                    <table className="product-attr-table">
                      <tbody>
                        {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                          <tr key={key}>
                            <td className="product-attr-label">{key}</td>
                            <td className="product-info-value">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="product-empty-box">
                      {selectedProduct.specifications || 'Không có thông số kỹ thuật'}
                    </div>
                  )}


                </div>
              </div>
              
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className="product-history-container" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <h4 className="product-detail-section-title">Phân loại hàng ({selectedProduct.variants.length})</h4>
                  {(() => {
                    const variantAttributeNames = new Set();
                    selectedProduct.variants.forEach(v => {
                      if (v.attributes) {
                        Object.keys(v.attributes).forEach(name => variantAttributeNames.add(name));
                      }
                    });
                    const attrNames = Array.from(variantAttributeNames);
                    return (
                      <div className="product-variant-container">
                        <table className="product-variant-table">
                          <thead>
                            <tr>
                              <th>Hình ảnh</th>
                              <th>SKU</th>
                              {attrNames.map((name, idx) => (
                                <th key={idx}>{name}</th>
                              ))}
                              <th style={{ textAlign: 'right' }}>Giá bán</th>
                              <th style={{ textAlign: 'right' }}>Kho</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProduct.variants.map((v, i) => (
                              <tr key={i}>
                                <td>
                                  <div className="product-variant-img-box">
                                    {v.imageUrl ? (
                                      <img src={v.imageUrl.startsWith('http') ? v.imageUrl : `${API_BASE_URL}${v.imageUrl.replace('/api', '')}`} alt="variant" className="product-variant-img" />
                                    ) : (
                                      <span className="material-symbols-outlined" style={{ color: '#cbd5e1', fontSize: '18px' }}>image</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="product-info-value">{v.sku || '---'}</div>
                                </td>
                                {attrNames.map((name, idx) => (
                                  <td key={idx} style={{ color: '#475569' }}>
                                    {v.attributes && v.attributes[name] ? v.attributes[name] : '---'}
                                  </td>
                                ))}
                                <td className="product-info-value blue font-number" style={{ textAlign: 'right' }}>
                                  {v.price ? v.price.toLocaleString('vi-VN') + ' đ' : '---'}
                                </td>
                                <td className="product-info-value font-number" style={{ textAlign: 'right' }}>
                                  {v.stockQuantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}
              
              {selectedProduct.approvalHistories && selectedProduct.approvalHistories.length > 0 && (
                <div className="product-history-container">
                  <h4 className="product-history-title">
                    <span className="material-symbols-outlined">history</span>
                    Lịch sử kiểm duyệt
                  </h4>
                  <div className="product-history-list">
                    {selectedProduct.approvalHistories.map((hist) => (
                      <div key={hist.approvalId} className={`product-history-item ${hist.status.toLowerCase()}`}>
                        <div className={`product-history-icon ${hist.status.toLowerCase()}`}>
                          <span className="material-symbols-outlined">
                            {hist.status === 'APPROVED' ? 'check' : 'close'}
                          </span>
                        </div>
                        <div className="product-history-content">
                          <div className="product-history-header">
                            <strong>{hist.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối/Khóa'}</strong>
                            <span>{new Date(hist.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          <div className="product-history-body">
                            <span>Bởi: {hist.adminName || 'Hệ thống'}</span>
                            {hist.note && <div className="product-history-note">{hist.note}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="product-detail-footer">
              <button className="btn-close" onClick={() => setSelectedProduct(null)}>
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
