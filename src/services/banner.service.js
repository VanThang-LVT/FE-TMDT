import { API_BASE_URL } from '../utils/constants';

export const getPublicBannersApi = async () => {
  const response = await fetch(`${API_BASE_URL}/banners`);
  if (!response.ok) throw new Error('Không thể tải banner');
  return response.json();
};

export const getAdminBannersApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/banners`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Lỗi lấy danh sách banner');
  return response.json();
};

export const createBannerApi = async (formData, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/banners`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi thêm banner');
  }
  return response.json();
};

export const updateBannerApi = async (id, formData, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/banners/${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi cập nhật banner');
  }
  return response.json();
};

export const toggleBannerStatusApi = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/banners/${id}/toggle`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Lỗi thay đổi trạng thái banner');
  return response.json();
};

export const deleteBannerApi = async (id, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/banners/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Lỗi xóa banner');
  return response.json();
};
