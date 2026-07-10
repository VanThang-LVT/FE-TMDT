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

export const getShopOrdersApi = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.keyword) queryParams.append('keyword', params.keyword);
  if (params.statuses && params.statuses.length > 0) {
    queryParams.append('statuses', params.statuses.join(','));
  }
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/shops/orders${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi lấy danh sách đơn hàng!');
  }
  return data.data; 
};

export const updateShopOrderStatusApi = async (shopOrderId, status, token, cancelReason = null) => {
  let url = `${API_BASE_URL}/shops/orders/${shopOrderId}/status?status=${status}`;
  if (cancelReason) {
    url += `&cancelReason=${encodeURIComponent(cancelReason)}`;
  }
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi cập nhật trạng thái đơn hàng!');
  }
  return data;
};

export const getOrderCountsApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/shops/orders/counts`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi lấy số lượng đơn hàng!');
  }
  return data.data;
};

export const searchShopsApi = async (token, params) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/shops/admin/page?${query}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi tải danh sách cửa hàng');
  }
  return data.data;
};

export const updateShopStatusByAdminApi = async (token, shopId, status) => {
  const response = await fetch(`${API_BASE_URL}/shops/admin/${shopId}/status?status=${status}`, {
    method: 'PUT',
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi cập nhật trạng thái cửa hàng');
  }
  return data;
};

export const getPublicShopApi = async (shopId) => {
  const response = await fetch(`${API_BASE_URL}/shops/public/${shopId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi lấy thông tin gian hàng!');
  }
  return data.data;
};
