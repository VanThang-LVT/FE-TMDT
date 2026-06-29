import { API_BASE_URL } from '../utils/constants';

export const getEmailLogsApi = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.keyword) queryParams.append('keyword', params.keyword);
  if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/admin/email-logs${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi khi tải danh sách email log!');
  }
  return data;
};
