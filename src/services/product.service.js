import { API_BASE_URL } from '../utils/constants';

export const getSellerProductsApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/seller/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi lấy danh sách sản phẩm!');
  }
  return data;
};

export const createProductApi = async (productData, token) => {
  const response = await fetch(`${API_BASE_URL}/seller/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: productData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi thêm sản phẩm!');
  }
  return data;
};

export const updateProductApi = async (productId, formData, token) => {
  const response = await fetch(`${API_BASE_URL}/seller/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi khi cập nhật sản phẩm');
  }

  return response.json();
};

export const getAdminProductsApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/products`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm');
  return response.json();
};

export const approveProductApi = async (productId, token) => {
  const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi khi duyệt sản phẩm');
  }
  return response.json();
};

export const rejectProductApi = async (productId, token, reason = '') => {
  const url = `${API_BASE_URL}/admin/products/${productId}/reject` + (reason ? `?reason=${encodeURIComponent(reason)}` : '');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi khi từ chối sản phẩm');
  }
  return response.json();
};

export const deleteProductApi = async (productId, token) => {
  const response = await fetch(`${API_BASE_URL}/seller/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi xóa sản phẩm!');
  }
  return data;
};
