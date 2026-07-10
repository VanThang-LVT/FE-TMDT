import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSellerProducts } from '../../hooks/useSellerProducts';
import SellerLayout from '../../layouts/SellerLayout';
import Alert from '../../components/Alert';
import { API_BASE_URL } from '../../utils/constants';
import './SellerPage.css';

function SellerInventoryPage() {
  const { user, token, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const {
    products, loading, error, success,
    fetchProducts, totalPages, totalElements, handleUpdateStock
  } = useSellerProducts(token);

  const [searchTerm, setSearchTerm] = useState('');
  const [stockModalData, setStockModalData] = useState(null);
  const [newStock, setNewStock] = useState('');
  
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isSeller()) navigate('/');
    }
  }, [user, authLoading, isSeller, navigate]);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (user && isSeller()) {
      fetchProducts(debouncedSearchTerm, currentPage, itemsPerPage);
    }
  }, [debouncedSearchTerm, currentPage, fetchProducts, user, isSeller]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm]);

  const currentItems = products;

  if (authLoading) {
    return <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-primary)' }}>Đang xác thực...</div>;
  }

  return (
    <SellerLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Quản lý Tồn kho</h2>
          <p className="admin-page-desc">Theo dõi và cập nhật số lượng tồn kho của các sản phẩm.</p>
        </div>
        <div className="admin-header-actions">
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
            <input
              type="text"
              className="admin-category-form-input"
              placeholder="Tìm sản phẩm, thương hiệu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '280px', paddingLeft: '40px', margin: 0, height: '42px' }}
            />
          </div>
        </div>
      </div>

      <Alert type="danger" message={error} />
      <Alert type="success" message={success} />

      <div className="admin-table-card">
        <div className="admin-table-container">
          {!products || products.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Không tìm thấy sản phẩm nào.</p>
          ) : (
            <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá bán</th>
                <th>Trạng thái</th>
                <th className="text-center">Kho tổng</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentItems?.map(p => (
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
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.variants && p.variants.length > 0 ? `${p.variants.length} Phân loại` : 'Không phân loại'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-number" style={{ fontWeight: '500' }}>
                    {p.variants && p.variants.length > 0 
                      ? (() => {
                          const minPrice = Math.min(...p.variants.map(v => v.price));
                          const maxPrice = Math.max(...p.variants.map(v => v.price));
                          return minPrice === maxPrice 
                            ? `${minPrice.toLocaleString('vi-VN')} đ` 
                            : `${minPrice.toLocaleString('vi-VN')} đ - ${maxPrice.toLocaleString('vi-VN')} đ`;
                        })()
                      : `${p.price?.toLocaleString('vi-VN')} đ`}
                  </td>
                  <td>
                    {p.status === 'ACTIVE' ? (
                      <span className="badge badge-success" style={{ background: 'var(--success-glow)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', whiteSpace: 'nowrap' }}>Đang bán</span>
                    ) : p.status === 'PENDING' ? (
                      <span className="badge badge-admin" style={{ whiteSpace: 'nowrap' }}>Chờ duyệt</span>
                    ) : (
                      <span className="badge badge-danger" style={{ whiteSpace: 'nowrap' }}>Từ chối/Khóa</span>
                    )}
                  </td>
                  <td className="font-number text-center" style={{ color: (p.variants && p.variants.length > 0 ? p.variants.reduce((sum, v) => sum + (parseInt(v.stockQuantity) || 0), 0) : p.stockQuantity) <= 10 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {p.variants && p.variants.length > 0 ? p.variants.reduce((sum, v) => sum + (parseInt(v.stockQuantity) || 0), 0) : p.stockQuantity}
                  </td>
                  <td className="text-center">
                    <div className="admin-actions center">
                      <button 
                        className="admin-action-btn" 
                        style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}
                        onClick={() => {
                          setStockModalData(p);
                          setNewStock('');
                        }}
                        title="Cập nhật"
                      >
                        <span className="material-symbols-outlined icon-18">inventory_2</span> Cập nhật
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
          
          {totalPages > 1 && (
            <div className="admin-pagination-container" style={{ justifyContent: 'center', backgroundColor: '#f8fafc', padding: '16px' }}>
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="admin-pagination-arrow-btn"
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', opacity: currentPage === 0 ? 0.5 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
              </button>
              
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: '0 16px' }}>
                Trang {currentPage + 1} / {totalPages || 1}
              </span>

              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="admin-pagination-arrow-btn"
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CẬP NHẬT KHO */}
      {stockModalData && (
        <div className="admin-category-modal-overlay" onClick={() => setStockModalData(null)}>
          <div className="admin-category-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%' }}>
            <div className="admin-category-modal-header">
              <h3 className="admin-category-modal-title">
                Cập nhật Tồn Kho
              </h3>
              <button
                className="admin-category-modal-close"
                onClick={() => setStockModalData(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-category-modal-body" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', fontWeight: '500', color: '#1e293b' }}>
                Sản phẩm: {stockModalData.productName}
              </div>
              
              {(!stockModalData.variants || stockModalData.variants.length === 0) ? (
                <div className="form-group seller-products-form-group">
                  <label>Số lượng kho mới</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    min="0"
                    placeholder={`Kho hiện tại: ${stockModalData.stockQuantity}`}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                  <button 
                    className="btn" 
                    style={{ marginTop: '16px', width: '100%', padding: '10px' }}
                    onClick={async () => {
                      if (!newStock || newStock < 0) return alert('Vui lòng nhập số lượng hợp lệ!');
                      const success = await handleUpdateStock(stockModalData.productId, null, parseInt(newStock));
                      if (success) setStockModalData(null);
                    }}
                  >Lưu thay đổi</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Sản phẩm này có nhiều phân loại. Bạn có thể cập nhật số lượng cho từng phân loại dưới đây:</div>
                  
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="admin-table" style={{ margin: 0 }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '8px 12px' }}>Phân loại</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Kho hiện tại</th>
                          <th style={{ padding: '8px 12px' }}>Cập nhật mới</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockModalData.variants.map((v) => (
                          <tr key={v.variantId}>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                  {v.imageUrl ? (
                                    <img src={v.imageUrl.startsWith('http') ? v.imageUrl : `${API_BASE_URL}${v.imageUrl.replace('/api', '')}`} alt="variant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#94a3b8' }}>image</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#1e293b' }}>{v.sku || 'N/A'}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                                     {v.attributes ? Object.values(v.attributes).join(' - ') : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="font-number" style={{ padding: '8px 12px', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>
                              {v.stockQuantity}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <input 
                                  type="number" 
                                  min="0" 
                                  placeholder="Nhập số..."
                                  style={{ width: '100px', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                  id={`stock-input-${v.variantId}`}
                                />
                                <button 
                                  className="btn" 
                                  style={{ padding: '6px 12px', fontSize: '13px', background: '#0ea5e9' }}
                                  onClick={async () => {
                                    const val = document.getElementById(`stock-input-${v.variantId}`).value;
                                    if (!val || val < 0) return alert('Vui lòng nhập số lượng hợp lệ!');
                                    await handleUpdateStock(stockModalData.productId, v.variantId, parseInt(val));
                                    document.getElementById(`stock-input-${v.variantId}`).value = '';
                                    setStockModalData(prev => ({
                                      ...prev,
                                      variants: prev.variants.map(va => va.variantId === v.variantId ? {...va, stockQuantity: val} : va)
                                    }));
                                  }}
                                >Lưu</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}

export default SellerInventoryPage;
