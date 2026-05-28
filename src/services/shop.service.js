import { API_BASE_URL } from '../utils/constants';

export const registerShopApi = async (shopName, phone, address, description, token) => {
  const response = await fetch(`${API_BASE_URL}/shops/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ shopName, phone, address, description }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Đăng ký gian hàng thất bại!');
  }
  return data;
};

export const getMyShopApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/shops/my-shop`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi lấy thông tin gian hàng!');
  }
  return data;
};

export const getAllShopsApi = async (status, token) => {
  const url = status ? `${API_BASE_URL}/shops/admin/list?status=${status}` : `${API_BASE_URL}/shops/admin/list`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi lấy danh sách gian hàng!');
  }
  return data;
};

export const approveOrRejectShopApi = async (id, status, token, reason = null) => {
  const response = await fetch(`${API_BASE_URL}/shops/admin/approve/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status, reason })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi xử lý yêu cầu!');
  }
  return data;
};
