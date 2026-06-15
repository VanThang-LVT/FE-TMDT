import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProductDetailApi } from '../../services/product.service';
import { API_BASE_URL } from '../../utils/constants';
import DashboardLayout from '../../layouts/DashboardLayout';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);

  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getPublicProductDetailApi(productId);
        setProduct(data);
        if (data.mainImageId) {
          setMainImage(`${API_BASE_URL}/public/images/${data.mainImageId}`);
        } else if (data.imageIds && data.imageIds.length > 0) {
          setMainImage(`${API_BASE_URL}/public/images/${data.imageIds[0]}`);
        }
      } catch (err) {
        setError(err.message || 'Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="product-detail-loading">
          <div className="spinner"></div>
          <p>Đang tải chi tiết sản phẩm...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="product-detail-error">
          <span className="material-symbols-outlined error-icon">error</span>
          <h2>Không tìm thấy sản phẩm</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={() => navigate('/')}>Về trang chủ</button>
        </div>
      </DashboardLayout>
    );
  }

  const availableAttributes = {};
  let hasRealAttributes = false;

  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(variant => {
      if (variant.attributes && Object.keys(variant.attributes).length > 0) {
        hasRealAttributes = true;
      }
    });

    product.variants.forEach((variant, index) => {
      if (hasRealAttributes) {
        if (variant.attributes) {
          Object.entries(variant.attributes).forEach(([key, val]) => {
            if (!availableAttributes[key]) availableAttributes[key] = new Set();
            availableAttributes[key].add(val);
          });
        }
      } else {
        if (!availableAttributes['Phân loại'])
          availableAttributes['Phân loại'] = new Set();
        const fallbackName = variant.sku || `Mẫu ${index + 1}`;
        availableAttributes['Phân loại'].add(fallbackName);
        variant.attributes = { 'Phân loại': fallbackName };
      }
    });
  }

  let selectedVariant = null;
  if (product.variants && product.variants.length > 0) {
    const isFullMatch = Object.keys(availableAttributes).every(key => selectedAttributes[key]);
    if (isFullMatch) {
      selectedVariant = product.variants.find(v => {
        return Object.entries(selectedAttributes).every(([key, val]) => v.attributes && v.attributes[key] === val);
      });
    }
  }

  let displayPrice = product.price.toLocaleString('vi-VN');
  let displayStock = product.stockQuantity;

  if (selectedVariant) {
    displayPrice = selectedVariant.price.toLocaleString('vi-VN');
    displayStock = selectedVariant.stockQuantity;
  } else if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map(v => v.price).filter(p => p != null);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      if (minPrice !== maxPrice) {
        displayPrice = `${minPrice.toLocaleString('vi-VN')} - ${maxPrice.toLocaleString('vi-VN')}`;
      } else {
        displayPrice = minPrice.toLocaleString('vi-VN');
      }
    }
    // Total stock of all variants
    displayStock = product.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  }

  const handleAttributeSelect = (key, value) => {
    const newAttrs = { ...selectedAttributes, [key]: value };
    setSelectedAttributes(newAttrs);
    
    // Auto-update main image if variant has image
    const potentialVariant = product.variants.find(v => {
      return Object.entries(newAttrs).every(([k, v_val]) => v.attributes && v.attributes[k] === v_val);
    });
    
    if (potentialVariant && potentialVariant.imageUrl) {
      setMainImage(potentialVariant.imageUrl.startsWith('http') ? potentialVariant.imageUrl : `${API_BASE_URL}${potentialVariant.imageUrl.replace('/api', '')}`);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= displayStock) {
      setQuantity(newQty);
    }
  };

  return (
    <DashboardLayout>
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <span className="separator">&gt;</span>
          <span onClick={() => navigate(`/category/${product.categoryId}`)}>{product.categoryName}</span>
          <span className="separator">&gt;</span>
          <span className="current">{product.productName}</span>
        </div>

        {/* Top Section: Images & Info */}
        <div className="product-top-section">
          {/* Images */}
          <div className="product-gallery">
            <div className="main-image-container">
              {mainImage ? (
                <img src={mainImage} alt={product.productName} className="main-image" />
              ) : (
                <div className="no-image">
                  <span className="material-symbols-outlined">image</span>
                </div>
              )}
            </div>
            {product.imageIds && product.imageIds.length > 0 && (
              <div className="thumbnail-list">
                {product.imageIds.map(id => {
                  const url = `${API_BASE_URL}/public/images/${id}`;
                  return (
                    <div 
                      key={id} 
                      className={`thumbnail-item ${mainImage === url ? 'active' : ''}`}
                      onClick={() => setMainImage(url)}
                    >
                      <img src={url} alt="thumbnail" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info-panel">
            <h1 className="product-title">{product.productName}</h1>
            
            <div className="product-meta">
              <div className="meta-item">
                <span className="label">Thương hiệu:</span>
                <span className="value brand">{product.brand || 'No Brand'}</span>
              </div>
              <div className="meta-item">
                <span className="label">Đánh giá:</span>
                <span className="value rating">
                  <span className="material-symbols-outlined star">star</span>
                  4.9 (1.2k đánh giá)
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Đã bán:</span>
                <span className="value sales">8.5k</span>
              </div>
            </div>

            <div className="product-price-box">
              <span className="currency">₫</span>
              <span className="price font-number">{displayPrice}</span>
            </div>

            {/* Variants */}
            {Object.keys(availableAttributes).length > 0 && (
              <div className="product-variants">
                {Object.entries(availableAttributes).map(([key, valuesSet]) => (
                  <div key={key} className="variant-group">
                    <span className="variant-label">{key}</span>
                    <div className="variant-options">
                      {Array.from(valuesSet).map(val => (
                        <button
                          key={val}
                          className={`variant-btn ${selectedAttributes[key] === val ? 'selected' : ''}`}
                          onClick={() => handleAttributeSelect(key, val)}
                        >
                          {val}
                          {selectedAttributes[key] === val && (
                            <span className="material-symbols-outlined check-icon">check_circle</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="product-quantity-group">
              <span className="quantity-label">Số lượng</span>
              <div className="quantity-selector">
                <button className="qty-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>-</button>
                <input type="number" className="qty-input" value={quantity} readOnly />
                <button className="qty-btn" onClick={() => handleQuantityChange(1)} disabled={quantity >= displayStock}>+</button>
              </div>
              <span className="stock-info">{displayStock} sản phẩm có sẵn</span>
            </div>

            {/* Action Buttons */}
            <div className="product-actions">
              <button className="btn-add-cart">
                <span className="material-symbols-outlined">add_shopping_cart</span>
                Thêm vào giỏ hàng
              </button>
              <button className="btn-buy-now">
                Mua ngay
              </button>
            </div>

            {/* Shop Info Placeholder */}
            <div className="shop-info-card">
              <div className="shop-avatar">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <div className="shop-details">
                <div className="shop-name">{product.shopName || `Shop #${product.shopId}`}</div>
                <div className="shop-status">Online 5 phút trước</div>
              </div>
              <button className="btn-view-shop">Xem Shop</button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Description & Specs */}
        <div className="product-bottom-section">
          <div className="section-panel">
            <h2 className="panel-title">Mô Tả Sản Phẩm</h2>
            <div className="panel-content description">
              {product.description || 'Chưa có mô tả cho sản phẩm này.'}
            </div>
          </div>

          <div className="section-panel">
            <h2 className="panel-title">Chi Tiết Sản Phẩm</h2>
            <div className="panel-content">
              <table className="specs-table">
                <tbody>
                  <tr>
                    <td className="spec-label">Danh mục</td>
                    <td className="spec-value breadcrumb-style" onClick={() => navigate(`/category/${product.categoryId}`)}>{product.categoryName}</td>
                  </tr>
                  <tr>
                    <td className="spec-label">Thương hiệu</td>
                    <td className="spec-value">{product.brand || '---'}</td>
                  </tr>
                  {product.attributes && Object.entries(product.attributes).map(([key, val]) => (
                    <tr key={key}>
                      <td className="spec-label">{key}</td>
                      <td className="spec-value">{val}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="spec-label">Kho hàng</td>
                    <td className="spec-value">{product.stockQuantity}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProductDetailPage;
