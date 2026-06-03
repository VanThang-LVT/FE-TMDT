import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSellerProducts } from '../../hooks/useSellerProducts';
import SellerLayout from '../../layouts/SellerLayout';
import Alert from '../../components/Alert';
import ConfirmModal from '../../components/modals/ConfirmModal';
import './SellerPage.css';
import { API_BASE_URL } from '../../utils/constants';

function SellerProductsPage() {
  const { user, token, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const {
    products, categories, loading, error, success,
    showAddForm, setShowAddForm, isSubmitting, editingProductId,
    formData, images, mainImageIndex, setMainImageIndex,
    categoryAttributes, attributeValues,
    fetchData, handleInputChange, handleAttributeChange,
    handleImageChange, handleRemoveImage, handleSubmit,
    handleDeleteProduct, handleEditClick, handleCancelForm, buildCategoryOptions
  } = useSellerProducts(token);
  
  const [viewingAttributesProduct, setViewingAttributesProduct] = useState(null);
  const [viewingHistoryProduct, setViewingHistoryProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isSeller()) navigate('/');
      else {
        fetchData();
      }
    }
  }, [user, authLoading, isSeller, navigate, fetchData]);

  const renderStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return <span className="badge badge-admin">CHỜ DUYỆT</span>;
      case 'ACTIVE': return <span className="badge badge-success" style={{background: 'var(--success-glow)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)'}}>ĐANG BÁN</span>;
      case 'REJECTED': return <span className="badge badge-danger">BỊ TỪ CHỐI</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const categoryOptions = buildCategoryOptions(categories);

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || loading) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-primary)' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <SellerLayout>
      <div className="seller-products-header">
        <h2 className="seller-products-title">
          {showAddForm ? (editingProductId ? 'Sửa sản phẩm' : 'Thêm Sản phẩm mới') : 'Quản lý Sản phẩm'}
        </h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {!showAddForm && (
            <div className="admin-search" style={{ width: '280px', backgroundColor: 'white', margin: 0 }}>
              <span className="material-symbols-outlined" style={{color: '#94a3b8'}}>search</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm, thương hiệu..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <button className="btn seller-products-add-btn" onClick={showAddForm ? handleCancelForm : () => setShowAddForm(true)}>
            {showAddForm ? 'Quay lại danh sách' : '+ Thêm Sản phẩm mới'}
          </button>
        </div>
      </div>

      <Alert type="danger" message={error} />
      <Alert type="success" message={success} />

      {showAddForm ? (
        <div className="info-card seller-products-form-card">
          <form onSubmit={handleSubmit} className="seller-products-form">
            
            <div className="form-group seller-products-form-group">
              <label>Tên sản phẩm (*)</label>
              <input type="text" name="productName" value={formData.productName} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group seller-products-form-group">
              <label>Danh mục (*)</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleInputChange} required className="seller-products-select">
                <option value="">-- Chọn danh mục --</option>
                {categoryOptions.map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group seller-products-form-group">
              <label>Giá bán (VNĐ) (*)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" />
            </div>
            
            <div className="form-group seller-products-form-group">
              <label>Số lượng kho (*)</label>
              <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange} required min="1" />
            </div>

            <div className="form-group seller-products-form-group">
              <label>Thương hiệu</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} />
            </div>

            <div className="form-group seller-products-form-group">
              <label>Từ khóa (cách nhau dấu phẩy)</label>
              <input type="text" name="keywords" value={formData.keywords} onChange={handleInputChange} />
            </div>
            
            <div className="form-group seller-products-form-group seller-products-full-width">
              <label>Mô tả sản phẩm</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="seller-products-textarea"></textarea>
            </div>

            {categoryAttributes.length > 0 && (
              <div className="seller-products-eav-container">
                <h4 className="seller-products-eav-title">
                  Thông số kỹ thuật (Tự động tải theo danh mục)
                </h4>
                {categoryAttributes.map(attr => (
                  <div key={attr.attrId} className="form-group seller-products-form-group">
                    <label>{attr.attrName} {attr.isRequired ? '(*)' : ''}</label>
                    <input 
                      type="text" 
                      value={attributeValues[attr.attrId] || ''} 
                      onChange={(e) => handleAttributeChange(attr.attrId, e.target.value)} 
                      required={attr.isRequired} 
                      placeholder={`Nhập ${attr.attrName.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="form-group seller-products-form-group seller-products-full-width">
              <label>Hình ảnh sản phẩm (Click vào ảnh để chọn làm Ảnh Bìa)</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="seller-products-image-input" style={{width: '100%'}} />
              
              {images.length > 0 && (
                <div className="seller-products-image-preview-container">
                  {images.map((img, index) => (
                    <div 
                      key={index} 
                      className={`seller-products-image-preview-item ${index === mainImageIndex ? 'main-image' : ''}`}
                      onClick={() => setMainImageIndex(index)}
                      title="Click để chọn làm ảnh bìa"
                      style={{ width: '100px', height: '100px', boxShadow: mainImageIndex === index ? '0 0 8px rgba(99, 102, 241, 0.5)' : 'none' }}
                    >
                      <img src={img.previewUrl} alt="preview" className="seller-products-image-preview-img" />
                      
                      {mainImageIndex === index && (
                        <div className="seller-products-image-preview-badge">
                          ẢNH BÌA
                        </div>
                      )}
                      
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }} 
                        className="seller-products-image-preview-delete"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="seller-products-submit-container">
              <button type="submit" className="btn" disabled={isSubmitting}>
                {isSubmitting ? 'ĐANG LƯU...' : 'LƯU VÀ GỬI DUYỆT'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="table-container">
        {filteredProducts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Chưa có sản phẩm nào. Hãy đăng sản phẩm đầu tiên của bạn!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá (VNĐ)</th>
                <th>Kho</th>
                <th>Thông số kỹ thuật</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.productId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                        {p.mainImageId ? (
                          <img src={`${API_BASE_URL}/public/images/${p.mainImageId}`} alt={p.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: '24px' }}>image</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.productName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.brand || 'Không có thương hiệu'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-number">{p.price.toLocaleString('vi-VN')} đ</td>
                  <td className="font-number">{p.stockQuantity}</td>
                  <td>
                    {p.attributes && Object.keys(p.attributes).length > 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {Object.entries(p.attributes).slice(0, 3).map(([key, value]) => (
                          <span key={key}><strong>{key}:</strong> {value}</span>
                        ))}
                        {Object.keys(p.attributes).length > 3 && (
                          <span 
                            style={{ color: '#3b82f6', cursor: 'pointer', marginTop: '4px', fontWeight: '500' }}
                            onClick={() => setViewingAttributesProduct(p)}
                          >
                            Xem chi tiết ({Object.keys(p.attributes).length} thông số)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>Chưa có thông số</span>
                    )}
                  </td>
                  <td>{renderStatusBadge(p.status)}</td>
                  <td className="font-number">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className="admin-actions">
                      <button 
                        className="admin-action-btn edit" 
                        title="Sửa sản phẩm"
                        style={{ color: '#3b82f6' }}
                        onClick={() => handleEditClick(p)}
                      >
                        <span className="material-symbols-outlined icon-18">edit</span>
                      </button>
                      <button 
                        className="admin-action-btn" 
                        title="Lịch sử kiểm duyệt"
                        style={{ color: '#8b5cf6' }}
                        onClick={() => setViewingHistoryProduct(p)}
                      >
                        <span className="material-symbols-outlined icon-18">history</span>
                      </button>
                      <button 
                        className="admin-action-btn delete" 
                        title="Xóa sản phẩm"
                        style={{ color: '#ef4444' }}
                        disabled={p.status === 'ACTIVE'}
                        onClick={() => setProductToDelete(p.productId)}
                      >
                        <span className="material-symbols-outlined icon-18">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {viewingAttributesProduct && (
        <div className="admin-category-modal-overlay" onClick={() => setViewingAttributesProduct(null)}>
          <div className="admin-category-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-category-modal-header">
              <h3 className="admin-category-modal-title">
                Thông số kỹ thuật: <span>{viewingAttributesProduct.productName}</span>
              </h3>
              <button 
                className="admin-category-modal-close"
                onClick={() => setViewingAttributesProduct(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="admin-category-attr-table-container">
              <table className="admin-category-attr-table">
                <thead>
                  <tr>
                    <th>Tên thông số</th>
                    <th>Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(viewingAttributesProduct.attributes).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: '500', color: '#1e293b' }}>{key}</td>
                      <td style={{ color: '#475569' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewingHistoryProduct && (
        <div className="admin-category-modal-overlay" onClick={() => setViewingHistoryProduct(null)}>
          <div className="admin-category-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="admin-category-modal-header">
              <h3 className="admin-category-modal-title">
                Lịch sử kiểm duyệt: <span>{viewingHistoryProduct.productName}</span>
              </h3>
              <button 
                className="admin-category-modal-close"
                onClick={() => setViewingHistoryProduct(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="admin-category-modal-body" style={{ padding: '24px' }}>
              {viewingHistoryProduct.approvalHistories && viewingHistoryProduct.approvalHistories.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {viewingHistoryProduct.approvalHistories.map((hist) => (
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
                        {hist.note && (
                          <div style={{ fontSize: '14px', color: '#334155', background: 'white', padding: '10px 12px', borderRadius: '8px', marginTop: '8px', border: '1px solid #e2e8f0' }}>
                            <strong>Lý do: </strong>{hist.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '32px 0' }}>
                  Chưa có lịch sử kiểm duyệt nào cho sản phẩm này.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!productToDelete}
        title="Xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác."
        onConfirm={() => {
          handleDeleteProduct(productToDelete);
          setProductToDelete(null);
        }}
        onCancel={() => setProductToDelete(null)}
        type="danger"
        confirmText="Xóa"
      />
    </SellerLayout>
  );
}

export default SellerProductsPage;
