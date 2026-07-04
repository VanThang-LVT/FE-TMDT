import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicProductsApi } from '../../services/product.service';
import { getAllCategoriesApi } from '../../services/category.service';
import DashboardLayout from '../../layouts/DashboardLayout';
import { API_BASE_URL } from '../../utils/constants';
import './CategoryPage.css';

function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCats, setExpandedCats] = useState(new Set());

  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getPublicProductsApi('', '', categoryId),
          getAllCategoriesApi()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err.message || 'Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]);

  const pathNodes = [];
  let current = categories.find(c => c.categoryId === parseInt(categoryId));
  while (current) {
    pathNodes.unshift(current);
    current = categories.find(c => c.categoryId === current.parentId);
  }
  const rootCategory = pathNodes.length > 0 ? pathNodes[0] : null;

  const [lastProcessedCatId, setLastProcessedCatId] = useState(null);

  if (categories.length > 0 && categoryId !== lastProcessedCatId) {
    setExpandedCats(prev => {
      const next = new Set(prev);
      pathNodes.forEach(n => next.add(n.categoryId));
      return next;
    });
    setLastProcessedCatId(categoryId);
  }

  const toggleExpand = (e, catId) => {
    e.stopPropagation(); 
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const handleApplyFilter = () => {
    setMinPrice(minPriceInput ? parseInt(minPriceInput) : null);
    setMaxPrice(maxPriceInput ? parseInt(maxPriceInput) : null);
  };

  let displayedProducts = [...products];

  if (minPrice !== null) {
    displayedProducts = displayedProducts.filter(p => p.price >= minPrice);
  }
  if (maxPrice !== null) {
    displayedProducts = displayedProducts.filter(p => p.price <= maxPrice);
  }

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

  const renderCategoryTree = (parentId, depth) => {
    const children = categories.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <ul className="sidebar-tree-list">
        {children.map(cat => {
          const isCurrent = cat.categoryId === parseInt(categoryId);
          const isExpanded = expandedCats.has(cat.categoryId);
          const hasChildren = categories.some(c => c.parentId === cat.categoryId);

          return (
            <li key={cat.categoryId} className="sidebar-tree-item">
              <div
                className={`sidebar-tree-label ${isCurrent ? 'active' : ''}`}
                onClick={() => navigate(`/category/${cat.categoryId}`)}
                style={{ paddingLeft: `${depth * 12}px` }}
              >
                {hasChildren ? (
                  <span
                    className="material-symbols-outlined expand-icon"
                    onClick={(e) => toggleExpand(e, cat.categoryId)}
                    style={{ cursor: 'pointer' }}
                  >
                    {isExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                  </span>
                ) : (
                  <span className="material-symbols-outlined expand-icon" style={{ opacity: 0 }}>keyboard_arrow_right</span>
                )}
                <span style={{ flex: 1 }}>{cat.categoryName}</span>
              </div>
              {isExpanded && renderCategoryTree(cat.categoryId, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <DashboardLayout>
      <div className="category-page-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          {pathNodes.map((node, index) => (
            <span key={node.categoryId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="separator">&gt;</span>
              <span
                className={index === pathNodes.length - 1 ? 'current' : ''}
                onClick={() => navigate(`/category/${node.categoryId}`)}
              >
                {node.categoryName}
              </span>
            </span>
          ))}
        </div>

        <div className="category-layout">
          {/* Sidebar */}
          <div className="category-sidebar">
            <h3 className="sidebar-title">
              <span className="material-symbols-outlined" style={{ marginRight: '8px', fontSize: '20px' }}>format_list_bulleted</span>
              Danh mục
            </h3>
            <div className="sidebar-tree">
              {rootCategory ? (
                <>
                  <div
                    className={`sidebar-tree-root ${rootCategory.categoryId === parseInt(categoryId) ? 'active' : ''}`}
                    onClick={() => navigate(`/category/${rootCategory.categoryId}`)}
                  >
                    {rootCategory.categoryName}
                  </div>
                  {renderCategoryTree(rootCategory.categoryId, 1)}
                </>
              ) : (
                <div className="sidebar-empty">Đang tải danh mục...</div>
              )}
            </div>

            <h3 className="sidebar-title" style={{ marginTop: '32px' }}>Bộ lọc tìm kiếm</h3>
            <div className="filter-group">
              <label>Khoảng giá (₫)</label>
              <div className="price-filter">
                <input 
                  type="text" 
                  placeholder="TỪ" 
                  value={minPriceInput ? Number(minPriceInput).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setMinPriceInput(e.target.value.replace(/\D/g, ''))}
                />
                <span>-</span>
                <input 
                  type="text" 
                  placeholder="ĐẾN" 
                  value={maxPriceInput ? Number(maxPriceInput).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setMaxPriceInput(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button className="btn-apply-filter" onClick={handleApplyFilter}>Áp dụng</button>
            </div>
          </div>

          {/* Main Content */}
          <div className="category-main">
            <div className="category-header">
              <h1 className="category-title">
                {pathNodes.length > 0 ? pathNodes[pathNodes.length - 1].categoryName : 'Sản phẩm'}
              </h1>
              <div className="category-sort">
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

            {loading ? (
              <div className="category-loading">
                <div className="spinner"></div>
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : error ? (
              <div className="category-error">{error}</div>
            ) : products.length === 0 ? (
              <div className="category-empty">
                <span className="material-symbols-outlined">inventory_2</span>
                <p>Không có sản phẩm nào trong danh mục này.</p>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="category-empty">
                <span className="material-symbols-outlined">search_off</span>
                <p>Không tìm thấy sản phẩm phù hợp với bộ lọc.</p>
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
                          {product.shopName || `Shop #${product.shopId}`}
                        </span>
                        <span className="product-sales font-number">Đã bán {product.salesCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CategoryPage;
