import { API_BASE_URL } from '../utils/constants';

export const getAllCommissions = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/commissions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi tải danh sách cấu hình hoa hồng');
  }
  return data.data;
};

export const createCommission = async (commissionData, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/commissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(commissionData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi tạo cấu hình hoa hồng');
  }
  return data.data;
};

export const updateCommission = async (id, commissionData, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/commissions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(commissionData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi cập nhật cấu hình hoa hồng');
  }
  return data.data;
};

export const updateCommissionStatus = async (id, status, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/commissions/${id}/status?status=${status}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi cập nhật trạng thái');
  }
  return data.data;
};
