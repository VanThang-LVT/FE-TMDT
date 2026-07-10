import { API_BASE_URL } from '../utils/constants';

export const getSellerProductsApi = async (token, keyword = '', page = 0, size = 10) => {
  let url = `${API_BASE_URL}/seller/products?page=${page}&size=${size}`;
  if (keyword) {
    url += `&keyword=${encodeURIComponent(keyword)}`;
  }
  const response = await fetch(url, {
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

export const updateStockApi = async (productId, variantId, stockQuantity, token) => {
  let url = `${API_BASE_URL}/seller/products/${productId}/stock?stockQuantity=${stockQuantity}`;
  if (variantId) {
    url += `&variantId=${variantId}`;
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi cập nhật số lượng tồn kho!');
  }
  return data;
};

export const getAdminProductsApi = async (keyword = '', status = '', page = 0, size = 10, token) => {
  let url = `${API_BASE_URL}/admin/products?page=${page}&size=${size}`;
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
  if (status) url += `&status=${status}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm');
  const data = await response.json();
  return data.data;
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

export const getPublicProductsApi = async (keyword = '', prompt = '', categoryId = '', shopId = '') => {
  let url = `${API_BASE_URL}/products`;
  const params = new URLSearchParams();
  if (keyword) params.append('keyword', keyword);
  if (prompt) params.append('prompt', prompt);
  if (categoryId) params.append('categoryId', categoryId);
  if (shopId) params.append('shopId', shopId);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Không thể tải danh sách sản phẩm');
  }
  return response.json();
};

export const getPublicProductDetailApi = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`);
  if (!response.ok) {
    throw new Error('Không thể tải thông tin sản phẩm');
  }
  return response.json();
};

export const trackProductViewApi = async (productId, token) => {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE_URL}/products/${productId}/view`, {
    method: 'POST',
    headers
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Lỗi ghi nhận lượt xem');
  }
};

export const getRecentlyViewedProductsApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/products/recently-viewed`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi tải sản phẩm vừa xem');
  }
  return data.data;
};

export const getTopSellingProductsApi = async (limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/products/top-selling?limit=${limit}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi tải sản phẩm bán chạy');
  }
  return data.data;
};
