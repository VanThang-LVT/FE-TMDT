import { API_BASE_URL } from '../utils/constants';

export const getAdminReconciliationApi = async (token, period = 'month') => {
  const response = await fetch(`${API_BASE_URL}/admin/payments/reconciliation?period=${period}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi khi tải dữ liệu đối soát');
  return data.data;
};

export const getSellerReconciliationApi = async (token, period = 'month') => {
  const response = await fetch(`${API_BASE_URL}/shops/reconciliation?period=${period}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi khi tải dữ liệu đối soát');
  return data.data;
};
