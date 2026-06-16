import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { 
  getCartApi, 
  updateCartItemQuantityApi, 
  removeCartItemApi,
  addToCartApi
} from '../services/cart.service';
import { useAuth } from './AuthContext';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { token } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchCart = useCallback(async () => {
    if (!token) {
      setCart(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await getCartApi(token);
      setCart(response);
    } catch (err) {
      setError(err.message || 'Lỗi tải giỏ hàng');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateQuantity = async (cartItemId, quantity) => {
    if (!token) return { success: false, message: 'Bạn chưa đăng nhập' };
    
    try {
      setError('');
      await updateCartItemQuantityApi(cartItemId, quantity, token);
      await fetchCart();
      return { success: true };
    } catch (err) {
      setError(err.message || 'Lỗi cập nhật số lượng');
      return { success: false, message: err.message };
    }
  };

  const removeCartItem = async (cartItemId) => {
    if (!token) return { success: false, message: 'Bạn chưa đăng nhập' };

    try {
      setError('');
      await removeCartItemApi(cartItemId, token);
      setSuccess('Đã xóa sản phẩm khỏi giỏ hàng');
      await fetchCart();
      return { success: true };
    } catch (err) {
      setError(err.message || 'Lỗi xóa sản phẩm');
      return { success: false, message: err.message };
    }
  };

  const addToCart = async (cartData) => {
    if (!token) return { success: false, message: 'Bạn chưa đăng nhập' };

    try {
      setError('');
      await addToCartApi(cartData, token);
      setSuccess('Đã thêm vào giỏ hàng');
      await fetchCart();
      return { success: true };
    } catch (err) {
      setError(err.message || 'Lỗi thêm vào giỏ hàng');
      return { success: false, message: err.message };
    }
  };

  const value = {
    cart,
    loading,
    error,
    success,
    updateQuantity,
    removeCartItem,
    addToCart,
    refreshCart: fetchCart,
    setError,
    setSuccess
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  return useContext(CartContext);
};
