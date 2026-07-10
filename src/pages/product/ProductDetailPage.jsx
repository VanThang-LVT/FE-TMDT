import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPublicProductDetailApi, trackProductViewApi } from '../../services/product.service';
import { getProductReviewsApi, getProductReviewStatsApi } from '../../services/review.service';
import { API_BASE_URL } from '../../utils/constants';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Alert from '../../components/Alert';
import { toast } from 'react-hot-toast';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);

  const { token } = useAuth();
  const { addToCart } = useCart();
  const [alertConfig, setAlertConfig] = useState({ message: '', type: 'success' });
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);

  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0, starCounts: {} });
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(0);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  


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

  useEffect(() => {
    if (productId && token) {
      trackProductViewApi(productId, token).catch(err => console.error('Lỗi khi ghi nhận lượt xem:', err));
    }
  }, [productId, token]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const stats = await getProductReviewStatsApi(productId);
        setReviewStats(stats);
        const reviewsData = await getProductReviewsApi(productId, reviewPage, 5);
        setReviews(reviewsData.content || []);
        setTotalReviewPages(reviewsData.totalPages || 1);
      } catch (err) {
        console.error('Lỗi khi tải đánh giá:', err);
      }
    };
    if (productId) {
      fetchReviews();
    }
  }, [productId, reviewPage]);

  const location = useLocation();
  useEffect(() => {
    if (reviews.length > 0 && location.hash) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.transition = 'all 1s';
          element.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.5)';
          setTimeout(() => {
            element.style.boxShadow = 'none';
          }, 3000);
        }
      }, 500);
    }
  }, [reviews, location.hash]);

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
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(variant => {
      if (variant.attributes) {
        Object.entries(variant.attributes).forEach(([key, val]) => {
          if (!availableAttributes[key])
            availableAttributes[key] = new Set();
          availableAttributes[key].add(val);
        });
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
  let isInvalidVariant = false;

  if (selectedVariant) {
    displayPrice = selectedVariant.price.toLocaleString('vi-VN');
    displayStock = selectedVariant.stockQuantity;
  } else if (product.variants && product.variants.length > 0) {
    const isFullMatch = Object.keys(availableAttributes).every(key => selectedAttributes[key]);
    if (isFullMatch) {
      isInvalidVariant = true;
      displayPrice = "---";
      displayStock = 0;
    } else {
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
      displayStock = product.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    }
  }

  const handleAttributeSelect = (key, value) => {
    const newAttrs = { ...selectedAttributes, [key]: value };
    setSelectedAttributes(newAttrs);

    const potentialVariant = product.variants.find(v => {
      return Object.entries(newAttrs).every(([k, v_val]) => v.attributes && v.attributes[k] === v_val);
    });

    if (potentialVariant && potentialVariant.imageUrl) {
      setMainImage(potentialVariant.imageUrl.startsWith('http') ? potentialVariant.imageUrl : `${API_BASE_URL}${potentialVariant.imageUrl.replace('/api', '')}`);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlertConfig({ message, type });
    setTimeout(() => {
      setAlertConfig({ message: '', type: 'success' });
    }, 3000);
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= displayStock) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      showAlert("Vui lòng đăng nhập để mua hàng!", "danger");
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (Object.keys(availableAttributes).length > 0 && !selectedVariant) {
      showAlert("Vui lòng chọn đầy đủ phân loại hàng (Kích cỡ, Màu sắc...)!", "danger");
      return;
    }

    const cartData = {
      productId: parseInt(productId),
      variantId: selectedVariant ? selectedVariant.variantId : null,
      quantity: quantity
    };

    const res = await addToCart(cartData);
    if (res.success) {
      showAlert("Thêm vào giỏ hàng thành công!", "success");
    } else {
      showAlert(res.message || "Lỗi thêm vào giỏ hàng", "danger");
    }
  };

  const handleBuyNow = async () => {
    if (!token) {
      showAlert("Vui lòng đăng nhập để mua hàng!", "danger");
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (Object.keys(availableAttributes).length > 0 && !selectedVariant) {
      showAlert("Vui lòng chọn đầy đủ phân loại hàng (Kích cỡ, Màu sắc...)!", "danger");
      return;
    }

    const cartData = {
      productId: parseInt(productId),
      variantId: selectedVariant ? selectedVariant.variantId : null,
      quantity: quantity
    };

    const res = await addToCart(cartData, false);
    if (res.success && res.cartItemId) {
      navigate('/checkout', { state: { selectedItemIds: [res.cartItemId] } });
    } else {
      showAlert(res.message || "Lỗi thêm vào giỏ hàng", "danger");
    }
  };


  return (
    <DashboardLayout>
      <div className="product-detail-container">
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <span className="separator">&gt;</span>
          <span onClick={() => navigate(`/category/${product.categoryId}`)}>{product.categoryName}</span>
          <span className="separator">&gt;</span>
          <span className="current">{product.productName}</span>
        </div>

        <div className="product-top-section">
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
                  <span className="material-symbols-outlined star" style={{ color: '#fbbf24', fontVariationSettings: '"FILL" 1' }}>star</span>
                  {reviewStats.averageRating > 0 ? `${reviewStats.averageRating} (${reviewStats.totalReviews} đánh giá)` : 'Chưa có đánh giá'}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">Đã bán:</span>
                <span className="value sales">{product.salesCount || 0}</span>
              </div>
            </div>

            <div className="product-price-box">
              <span className="currency">₫</span>
              <span className="price font-number">{displayPrice}</span>
            </div>

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

            <div className="product-quantity-group">
              <span className="quantity-label">Số lượng</span>
              <div className="quantity-selector">
                <button className="qty-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1 || isInvalidVariant}>-</button>
                <input type="number" className="qty-input" value={quantity} readOnly />
                <button className="qty-btn" onClick={() => handleQuantityChange(1)} disabled={quantity >= displayStock || isInvalidVariant}>+</button>
              </div>
              <span className="stock-info">
                {isInvalidVariant ? <span style={{color: 'red'}}>Phân loại này không tồn tại hoặc đã hết</span> : `${displayStock} sản phẩm có sẵn`}
              </span>
            </div>

            <div className="product-actions" style={{ position: 'relative' }}>
              {alertConfig.message && (
                <div style={{ position: 'absolute', top: '-50px', left: 0, right: 0, zIndex: 10 }}>
                  <Alert type={alertConfig.type} message={alertConfig.message} />
                </div>
              )}
              <button className="btn-add-cart" onClick={handleAddToCart} disabled={isInvalidVariant}>
                <span className="material-symbols-outlined">add_shopping_cart</span>
                Thêm vào giỏ hàng
              </button>
              <button className="btn-buy-now" onClick={handleBuyNow} disabled={isInvalidVariant}>
                Mua ngay
              </button>
            </div>

            <div className="shop-info-card">
              <div className="shop-avatar">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <div className="shop-details">
                <div className="shop-name">{product.shopName || `Shop #${product.shopId}`}</div>
                <div className="shop-status">Online 5 phút trước</div>
              </div>
              <button className="btn-view-shop" onClick={() => navigate(`/shop/${product.shopId}`)}>Xem Shop</button>
            </div>
          </div>
        </div>

        <div className="product-bottom-section">
          <div className="section-panel panel-description">
            <h2 className="panel-title">Mô Tả Sản Phẩm</h2>
            <div className="panel-content description">
              {product.description || 'Chưa có mô tả cho sản phẩm này.'}
            </div>
          </div>

          <div className="section-panel panel-specs">
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
                    <td className="spec-value">
                      {product.variants && product.variants.length > 0
                        ? product.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
                        : product.stockQuantity}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="section-panel panel-reviews" style={{ marginTop: '24px' }}>
          <h2 className="panel-title">Đánh Giá Sản Phẩm</h2>
            <div className="panel-content">
              {reviewStats.totalReviews > 0 ? (
                <div>
                  <div className="review-stats-summary">
                    <div className="stats-left">
                      <div className="average-score">
                        {reviewStats.averageRating} <span className="average-score-max">trên 5</span>
                      </div>
                      <div className="stars-row">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="material-symbols-outlined"
                            style={{
                              color: star <= Math.round(reviewStats.averageRating) ? 'var(--primary-color)' : '#cbd5e1',
                              fontVariationSettings: star <= Math.round(reviewStats.averageRating) ? '"FILL" 1' : '"FILL" 0'
                            }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <div className="total-reviews-text">({reviewStats.totalReviews} đánh giá)</div>
                    </div>

                    <div className="stats-right">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewStats.starCounts && reviewStats.starCounts[star] ? reviewStats.starCounts[star] : 0;
                        const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                        return (
                          <div key={star} className="star-rating-row">
                            <span className="star-rating-label">{star} sao</span>
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="star-rating-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="reviews-list">
                    {reviews.map((rev) => (
                      <div key={rev.reviewId} id={`review-${rev.reviewId}`} className="review-card">
                        <div className="review-header">
                          <div className="reviewer-avatar">
                            {rev.userAvatarUrl ? (
                              <img src={rev.userAvatarUrl} alt={rev.userFullName} />
                            ) : (
                              <span className="material-symbols-outlined">person</span>
                            )}
                          </div>
                          <div>
                            <div className="reviewer-name">{rev.userFullName}</div>
                            <div className="reviewer-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className="material-symbols-outlined reviewer-star-icon"
                                  style={{
                                    color: star <= rev.rating ? 'var(--primary-color)' : '#cbd5e1',
                                    fontVariationSettings: star <= rev.rating ? '"FILL" 1' : '"FILL" 0'
                                  }}
                                >
                                  star
                                </span>
                              ))}
                            </div>
                            <div className="review-meta">
                              {new Date(rev.createdAt).toLocaleString('vi-VN')}
                              {rev.variantAttributes && ` | Phân loại: ${rev.variantAttributes}`}
                            </div>
                          </div>
                          

                        </div>

                        <p className="review-content">{rev.content || 'Người mua không để lại nhận xét bằng lời.'}</p>

                        {(rev.imageUrl1 || rev.imageUrl2) && (
                          <div className="review-images">
                            {rev.imageUrl1 && (
                              <img
                                src={rev.imageUrl1.startsWith('http') ? rev.imageUrl1 : `http://localhost:8080${rev.imageUrl1}`}
                                alt="Review thumbnail"
                                className="review-thumbnail"
                                onClick={() => window.open(rev.imageUrl1.startsWith('http') ? rev.imageUrl1 : `http://localhost:8080${rev.imageUrl1}`, '_blank')}
                              />
                            )}
                            {rev.imageUrl2 && (
                              <img
                                src={rev.imageUrl2.startsWith('http') ? rev.imageUrl2 : `http://localhost:8080${rev.imageUrl2}`}
                                alt="Review thumbnail"
                                className="review-thumbnail"
                                onClick={() => window.open(rev.imageUrl2.startsWith('http') ? rev.imageUrl2 : `http://localhost:8080${rev.imageUrl2}`, '_blank')}
                              />
                            )}
                          </div>
                        )}

                        {rev.sellerReply && (
                          <div className="seller-reply-box" style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                            <div className="reply-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <strong style={{ color: '#1e293b', fontSize: '14px' }}>Phản hồi của người bán</strong>
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {new Date(rev.repliedAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {rev.sellerReply}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {totalReviewPages > 1 && (
                    <div className="review-pagination">
                      <button
                        className="qty-btn review-page-btn"
                        disabled={reviewPage === 0}
                        onClick={() => setReviewPage(prev => prev - 1)}
                      >
                        Trước
                      </button>
                      <span className="review-page-text">
                        Trang {reviewPage + 1} / {totalReviewPages}
                      </span>
                      <button
                        className="qty-btn review-page-btn"
                        disabled={reviewPage === totalReviewPages - 1}
                        onClick={() => setReviewPage(prev => prev + 1)}
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="review-empty">
                  <span className="material-symbols-outlined">rate_review</span>
                  <p>Sản phẩm này chưa có đánh giá nào.</p>
                </div>
              )}
            </div>
          </div>
      </div>


    </DashboardLayout>
  );
}

export default ProductDetailPage;
