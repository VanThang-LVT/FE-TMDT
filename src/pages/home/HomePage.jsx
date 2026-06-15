import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getPublicProductsApi } from '../../services/product.service';
import { getPublicBannersApi } from '../../services/banner.service';
import { getAllCategoriesApi } from '../../services/category.service';
import { API_BASE_URL } from '../../utils/constants';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (banners.length > 0) setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    if (banners.length > 0) setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, bannersData, categoriesData] = await Promise.all([
          getPublicProductsApi(),
          getPublicBannersApi(),
          getAllCategoriesApi()
        ]);
        setProducts(productsData);
        setBanners(bannersData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout brandName="EoViTi">
      <div className="home-container">
        {banners.length > 0 && (
          <div className="home-banner-wrapper">
            <div
              className="home-banner-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {banners.map((banner, index) => (
                <div
                  key={banner.bannerId}
                  className="home-banner"
                  onClick={() => {
                    if (banner.buttonLink) navigate(banner.buttonLink);
                    else window.scrollTo({ top: 500, behavior: 'smooth' });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="home-banner-image">
                    <img src={`${API_BASE_URL}/banners/images/${banner.bannerId}`} alt={banner.title} />
                  </div>
                </div>
              ))}
            </div>

            <div className="banner-dots">
              {banners.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>

            {banners.length > 1 && (
              <>
                <button className="banner-nav-btn prev" onClick={prevSlide}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="banner-nav-btn next" onClick={nextSlide}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* Categories Section */}
        {!loading && categories.length > 0 && (
          <div className="home-categories-section">
            <h2 className="section-title" style={{textAlign: 'center'}}>Danh Mục Thể Loại</h2>
            
            <div className="categories-hierarchy">
              <div className="home-categories-list" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                {categories.filter(c => !c.parentId).map(parent => (
                  <div 
                    key={parent.categoryId}
                    className="home-category-item"
                    onClick={() => {
                      navigate(`/category/${parent.categoryId}`);
                    }}
                  >
                    <div className="category-icon" style={{ padding: parent.hasImage ? '0' : undefined, overflow: 'hidden' }}>
                      {parent.hasImage ? (
                        <img 
                          src={`http://localhost:8080/api/categories/public/${parent.categoryId}/image`} 
                          alt={parent.categoryName} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="material-symbols-outlined">
                          {parent.categoryName.toLowerCase().includes('áo') || parent.categoryName.toLowerCase().includes('quần') || parent.categoryName.toLowerCase().includes('thời trang') ? 'checkroom' :
                            parent.categoryName.toLowerCase().includes('điện') || parent.categoryName.toLowerCase().includes('máy') || parent.categoryName.toLowerCase().includes('laptop') ? 'devices' :
                              parent.categoryName.toLowerCase().includes('giày') ? 'snowshoeing' : 'category'}
                        </span>
                      )}
                    </div>
                    <span className="category-name">{parent.categoryName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <h2 className="section-title" style={{ marginTop: '40px' }}>Gợi Ý Cho Bạn</h2>

        {loading ? (
          <div className="home-loading">Đang tải sản phẩm...</div>
        ) : error ? (
          <div className="home-error">{error}</div>
        ) : (
          <div className="product-grid">
            {products.length === 0 ? (
              <div className="home-empty">Chưa có sản phẩm nào được đăng bán.</div>
            ) : (
              products.map(product => (
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
                    <h3 className="product-title">{product.productName}</h3>
                    <div className="product-price font-number">{product.price.toLocaleString('vi-VN')} đ</div>
                    <div className="product-footer">
                      <span className="product-shop">
                        <span className="material-symbols-outlined icon-small">storefront</span>
                        {product.shopName || `Shop #${product.shopId}`}
                      </span>
                      <span className="product-sales font-number">Đã bán 0</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default HomePage;
