import { API_BASE_URL } from '../utils/constants';

export const getPaymentTransactionsApi = async (keyword, status, page, size, token) => {
  let url = `${API_BASE_URL}/admin/payments/transactions?page=${page}&size=${size}`;
  if (keyword) {
    url += `&keyword=${encodeURIComponent(keyword)}`;
  }
  if (status) {
    url += `&status=${encodeURIComponent(status)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi tải nhật ký thanh toán');
  }

  return data.data;
};
