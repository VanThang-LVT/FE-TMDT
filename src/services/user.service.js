import { API_BASE_URL } from '../utils/constants';

export const getUsersApi = async (token, params) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/admin/users?${query}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi tải danh sách người dùng');
  }
  return data;
};

export const updateUserStatusApi = async (token, userId, status) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status?status=${status}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi cập nhật trạng thái người dùng');
  }
  return data;
};
