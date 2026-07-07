import { API_BASE_URL } from '../utils/constants';

export const getAdminVouchersApi = async (token, page = 0, size = 10, keyword = '') => {
  const url = new URL(`${API_BASE_URL}/admin/vouchers`);
  url.searchParams.append('page', page);
  url.searchParams.append('size', size);
  if (keyword) url.searchParams.append('keyword', keyword);

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Lỗi lấy danh sách voucher');
  const data = await response.json();
  return data.data;
};

export const createVoucherApi = async (body, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/vouchers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi tạo voucher');
  return data.data;
};

export const updateVoucherApi = async (id, body, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/vouchers/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi cập nhật voucher');
  return data.data;
};

export const deleteVoucherApi = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/vouchers/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Lỗi xóa voucher');
  return response.json();
};


export const previewBestVoucherApi = async (orderAmount) => {
  const response = await fetch(`${API_BASE_URL}/vouchers/preview?orderAmount=${orderAmount}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.data; 
};

export const getAvailableVouchersApi = async (orderAmount) => {
  const response = await fetch(`${API_BASE_URL}/vouchers/available?orderAmount=${orderAmount}`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.data; 
};

export const getVoucherUsagesApi = async (voucherId, page = 0, size = 10, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/vouchers/${voucherId}/usages?page=${page}&size=${size}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Lỗi khi lấy danh sách sử dụng');
  }
  const data = await response.json();
  return data.data;
};

export const getAllVoucherUsagesApi = async (page = 0, size = 10, keyword = '', token) => {
  const url = new URL(`${API_BASE_URL}/admin/vouchers/usages`);
  url.searchParams.append('page', page);
  url.searchParams.append('size', size);
  if (keyword) url.searchParams.append('keyword', keyword);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Lỗi khi lấy danh sách sử dụng');
  }
  const data = await response.json();
  return data.data; 
};
