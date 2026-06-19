import { API_BASE_URL } from '../utils/constants';

export const placeOrderApi = async (orderData, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/place`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi đặt hàng');
  }

  return data.data;
};

export const getMyOrdersApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi lấy danh sách đơn hàng');
  }

  return data.data;
};
