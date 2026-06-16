import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Alert from '../../components/Alert';
import ConfirmModal from '../../components/modals/ConfirmModal';
import './CartPage.css';

const CartPage = () => {
  const { cart, loading, error, success, updateQuantity, removeCartItem} = useCart();
  const navigate = useNavigate();

  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: null });
  const [warningMsg, setWarningMsg] = useState('');

  useEffect(() => {
    if (warningMsg) {
      const timer = setTimeout(() => {
        setWarningMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMsg]);


  const handleSelectItem = (cartItemId) => {
    setSelectedItemIds(prev => 
      prev.includes(cartItemId) ? prev.filter(id => id !== cartItemId) : [...prev, cartItemId]
    );
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedItemIds(cart.items.map(i => i.cartItemId));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleQuantityChange = async (cartItemId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1)
      return;

    const item = cart.items.find(i => i.cartItemId === cartItemId);
    if (item && newQty > item.stockQuantity) {
      setWarningMsg(`Rất tiếc, sản phẩm "${item.productName}" chỉ còn ${item.stockQuantity} chiếc trong kho!`);
      return;
    }
    setUpdatingItemId(cartItemId);
    await updateQuantity(cartItemId, newQty);
    setUpdatingItemId(null);
  };

  const handleRemoveClick = (cartItemId) => {
    setDeleteModal({ isOpen: true, itemId: cartItemId });
  };

  const confirmRemove = async () => {
    if (deleteModal.itemId) {
      await removeCartItem(deleteModal.itemId);
      setSelectedItemIds(prev => prev.filter(id => id !== deleteModal.itemId));
    }
    setDeleteModal({ isOpen: false, itemId: null });
  };

  const cancelRemove = () => {
    setDeleteModal({ isOpen: false, itemId: null });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading && !cart) {
    return (
      <div className="cart-page-wrapper">
        <div className="loading-overlay">
          <div className="spinner"></div> Đang tải giỏ hàng...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page-wrapper">
        <div className="cart-empty">
          <h2>Đã có lỗi xảy ra</h2>
          <p style={{ color: 'red' }}>{error}</p>
          <Link to="/" className="shop-now-btn">Quay lại trang chủ</Link>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="cart-empty">
          <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty Cart" />
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Hãy khám phá thêm các sản phẩm tuyệt vời của chúng tôi nhé!</p>
          <Link to="/" className="shop-now-btn">Mua sắm ngay</Link>
        </div>
      </div>
    );
  }

  const selectedItems = cart.items.filter(i => selectedItemIds.includes(i.cartItemId));
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.subTotal, 0);
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const isAllSelected = cart.items.length > 0 && selectedItemIds.length === cart.items.length;

  return (
    <div className="cart-page-wrapper">
      <Link to="/" className="back-home-link">
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
        Quay lại trang chủ
      </Link>
      <h1 className="cart-header">Giỏ hàng của bạn</h1>

      {success && <Alert message={success} type="success" />}
      {warningMsg && <Alert message={warningMsg} type="error" />}

      <div className="cart-shopee-layout">
        <div className="cart-main-content">
          <div className="cart-table-header">
            <div className="col-checkbox">
              <input 
                type="checkbox" 
                className="custom-checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </div>
            <div className="col-product">Sản Phẩm</div>
            <div className="col-price">Đơn Giá</div>
            <div className="col-quantity">Số Lượng</div>
            <div className="col-total">Số Tiền</div>
            <div className="col-action">Thao Tác</div>
          </div>

          <div className="cart-items-list">
            {cart.items.map(item => (
              <div key={item.cartItemId} className="cart-item-row">
                <div className="col-checkbox">
                  <input 
                    type="checkbox" 
                    className="custom-checkbox"
                    checked={selectedItemIds.includes(item.cartItemId)}
                    onChange={() => handleSelectItem(item.cartItemId)}
                  />
                </div>
                <div className="col-product">
                  <img 
                    src={item.imageUrl ? `http://localhost:8080${item.imageUrl}` : 'https://via.placeholder.com/80'} 
                    alt={item.productName} 
                  />
                  <div className="product-info">
                    <Link to={`/product/${item.productId}`} className="product-name">
                      {item.productName}
                    </Link>
                    {item.variantAttributes && (
                      <div className="product-variant">
                        Phân loại hàng: {item.variantAttributes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-price">{formatPrice(item.price)}</div>
                <div className="col-quantity">
                  <div className="quantity-control">
                    <button 
                      onClick={() => handleQuantityChange(item.cartItemId, item.quantity, -1)}
                      disabled={item.quantity <= 1 || updatingItemId === item.cartItemId}
                    >-</button>
                    <input type="text" value={item.quantity} readOnly />
                    <button 
                      onClick={() => handleQuantityChange(item.cartItemId, item.quantity, 1)}
                      disabled={updatingItemId === item.cartItemId}
                    >+</button>
                  </div>
                </div>
                <div className="col-total highlight">{formatPrice(item.subTotal)}</div>
                <div className="col-action">
                  <button className="btn-remove" onClick={() => handleRemoveClick(item.cartItemId)}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-bottom-bar">
          <div className="bottom-left">
            <input 
              type="checkbox" 
              className="custom-checkbox"
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span>Chọn Tất Cả ({cart.items.length})</span>
            <button className="btn-delete-selected">Xóa</button>
          </div>
          <div className="bottom-right">
            <div className="total-summary">
              <span>Tổng thanh toán ({totalQuantity} Sản phẩm):</span>
              <span className="total-price">{formatPrice(totalAmount)}</span>
            </div>
            <button 
              className={`btn-checkout ${totalQuantity === 0 ? 'disabled' : ''}`}
              disabled={totalQuantity === 0}
              onClick={() => navigate('/checkout', { state: { selectedItemIds } })}
            >
              Mua Hàng
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Xóa Sản Phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
        confirmText="Xóa"
        type="danger"
      />
    </div>
  );
};

export default CartPage;
