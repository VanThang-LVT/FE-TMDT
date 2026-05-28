import { API_BASE_URL } from '../utils/constants';

export const getMyNotificationsApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const resData = await response.json();
  if (!response.ok || !resData.success) throw new Error(resData.message || 'Không thể tải thông báo');
  return resData.data;
};

export const getUnreadCountApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) return 0;
  const resData = await response.json();
  return resData.data || 0;
};

export const markAsReadApi = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const resData = await response.json();
  if (!response.ok || !resData.success) throw new Error(resData.message || 'Có lỗi xảy ra');
  return resData.data;
};

export const markAllAsReadApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const resData = await response.json();
  if (!response.ok || !resData.success) throw new Error(resData.message || 'Có lỗi xảy ra');
  return resData.data;
};
