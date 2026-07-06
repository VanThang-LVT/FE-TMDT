import { API_BASE_URL } from '../utils/constants';

export const createReviewApi = async (reviewData, token) => {
  const formData = new FormData();
  formData.append('orderItemId', reviewData.orderItemId);
  formData.append('rating', reviewData.rating);
  if (reviewData.content) formData.append('content', reviewData.content);
  if (reviewData.image1) formData.append('image1', reviewData.image1);
  if (reviewData.image2) formData.append('image2', reviewData.image2);

  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi gửi đánh giá');
  }
  return data.data;
};

export const getProductReviewsApi = async (productId, page = 0, size = 10) => {
  const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}?page=${page}&size=${size}`, {
    method: 'GET'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi lấy danh sách đánh giá');
  }
  return data.data;
};

export const getProductReviewStatsApi = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}/stats`, {
    method: 'GET'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi lấy thống kê đánh giá');
  }
  return data.data;
};

export const checkHasReviewedApi = async (orderItemId, token) => {
  const response = await fetch(`${API_BASE_URL}/reviews/order-item/${orderItemId}/check`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi kiểm tra đánh giá');
  }
  return data.data;
};

export const getReviewByOrderItemApi = async (orderItemId, token) => {
  const response = await fetch(`${API_BASE_URL}/reviews/order-item/${orderItemId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi lấy thông tin đánh giá');
  }
  return data.data;
};

export const getShopReviewsApi = async (token, page = 0, size = 10) => {
  const response = await fetch(`${API_BASE_URL}/reviews/shop?page=${page}&size=${size}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi lấy danh sách đánh giá');
  }
  return data.data;
};

export const replyReviewApi = async (reviewId, replyContent, token) => {
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ replyContent })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi phản hồi đánh giá');
  }
  return data.data;
};
