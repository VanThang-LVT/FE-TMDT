import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProductsApi } from '../../services/product.service';
import { getPublicShopApi } from '../../services/shop.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import { API_BASE_URL } from '../../utils/constants';
import './PublicShopPage.css';

function PublicShopPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [shopData, productsData] = await Promise.all([
          getPublicShopApi(shopId),
          getPublicProductsApi('', '', '', shopId)
        ]);
        setShop(shopData);
        setProducts(productsData);
      } catch (err) {
        setError(err.message || 'Lỗi khi tải dữ liệu gian hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId]);

  let displayedProducts = [...products];

  switch (sortBy) {
    case 'price-asc':
      displayedProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      displayedProducts.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      displayedProducts.sort((a, b) => b.productId - a.productId);
      break;
    case 'best-selling':
      displayedProducts.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      break;
    default:
      break;
  }

  return (
    <DashboardLayout>
      <div className="public-shop-container">
        {loading ? (
          <div className="shop-loading">
            <div className="spinner"></div>
            <p>Đang tải thông tin gian hàng...</p>
          </div>
        ) : error ? (
          <div className="shop-error">
            <span className="material-symbols-outlined icon-large">error</span>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="btn-back-home">Về trang chủ</button>
          </div>
        ) : shop && (
          <>
            <div className="shop-profile-banner">
              <div className="shop-profile-info">
                <div className="shop-avatar-container">
                  <span className="material-symbols-outlined shop-avatar-icon">store</span>
                </div>
                <div className="public-shop-details">
                  <div className="public-shop-name">{shop.shopName}</div>
                  <p className="shop-description">{shop.description || 'Không có mô tả'}</p>
                  <div className="shop-stats">
                    <div className="stat-item">
                      <span className="material-symbols-outlined">inventory_2</span>
                      <span className="stat-value font-number">{products.length}</span>
                      <span className="stat-label">Sản phẩm</span>
                    </div>
                    <div className="stat-item">
                      <span className="material-symbols-outlined">star</span>
                      <span className="stat-value font-number">
                        {shop.averageRating > 0 ? Number(shop.averageRating).toFixed(1) : 'Chưa có'}
                      </span>
                      <span className="stat-label">Đánh giá</span>
                    </div>
                    <div className="stat-item">
                      <span className="material-symbols-outlined">call</span>
                      <span className="stat-value font-number">{shop.phone || 'Đang cập nhật'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shop-products-section">
              <div className="shop-products-header">
                <h2>Tất cả sản phẩm</h2>
                <div className="shop-sort">
                  <span className="sort-label">Sắp xếp theo:</span>
                  <button className={`sort-btn ${sortBy === 'popular' ? 'active' : ''}`} onClick={() => setSortBy('popular')}>Phổ biến</button>
                  <button className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>Mới nhất</button>
                  <button className={`sort-btn ${sortBy === 'best-selling' ? 'active' : ''}`} onClick={() => setSortBy('best-selling')}>Bán chạy</button>
                  <select 
                    className="sort-select" 
                    value={sortBy.startsWith('price') ? sortBy : ''} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="" disabled>Giá</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                  </select>
                </div>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="shop-empty">
                  <span className="material-symbols-outlined">inventory_2</span>
                  <p>Gian hàng này hiện chưa có sản phẩm nào.</p>
                </div>
              ) : (
                <div className="product-grid">
                  {displayedProducts.map(product => (
                    <div key={product.productId} className="product-card" onClick={() => navigate(`/product/${product.productId}`)}>
                      <div className="product-image-container">
                        {product.mainImageId ? (
                          <img src={`${API_BASE_URL}/public/images/${product.mainImageId}`} alt={product.productName} className="product-image" />
                        ) : (
                          <div className="product-no-image">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <div className="product-info">
                        <h3 className="product-card-title">{product.productName}</h3>
                        <div className="product-price font-number">{product.price.toLocaleString('vi-VN')} đ</div>
                        <div className="product-footer">
                          <span className="product-shop">
                            <span className="material-symbols-outlined icon-small">storefront</span>
                            {product.shopName || shop.shopName}
                          </span>
                          <span className="product-sales font-number">Đã bán {product.salesCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default PublicShopPage;
