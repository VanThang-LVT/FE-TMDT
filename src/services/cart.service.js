import { API_BASE_URL } from '../utils/constants';

export const getCartApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi lấy thông tin giỏ hàng!');
  }
  return data;
};

export const addToCartApi = async (cartData, token) => {
  const response = await fetch(`${API_BASE_URL}/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(cartData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi thêm vào giỏ hàng!');
  }
  return data;
};

export const updateCartItemQuantityApi = async (cartItemId, quantity, token) => {
  const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}?quantity=${quantity}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi cập nhật số lượng!');
  }
  return data;
};

export const removeCartItemApi = async (cartItemId, token) => {
  const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi xóa sản phẩm khỏi giỏ hàng!');
  }
  return data;
};

export const clearCartApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi làm sạch giỏ hàng!');
  }
  return data;
};
