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

export const createVNPayPaymentUrlApi = async (amount, orderId, token) => {
  const response = await fetch(`${API_BASE_URL}/payment/vnpay/create_payment?amount=${amount}&orderId=${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi tạo link thanh toán VNPay');
  }
  return data.data;
};

export const verifyVNPayPaymentApi = async (queryString, token) => {
  const response = await fetch(`${API_BASE_URL}/payment/vnpay/verify${queryString}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi xác thực thanh toán VNPay');
  }

  return data;
};

export const completeShopOrderApi = async (shopOrderId, token) => {
  const response = await fetch(`${API_BASE_URL}/orders/shop-orders/${shopOrderId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi xác nhận đã nhận hàng');
  }

  return data.data;
};

export const getAdminOrdersApi = async (token, keyword = '', status = '', page = 0, size = 10) => {
  let url = `${API_BASE_URL}/admin/orders?page=${page}&size=${size}`;
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
  if (status) url += `&status=${status}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi tải danh sách đơn hàng');
  }
  return data.data;
};

export const adminCancelOrderApi = async (shopOrderId, cancelReason, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/orders/${shopOrderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ cancelReason })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi huỷ đơn hàng');
  }
  return data;
};
