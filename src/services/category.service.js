import { API_BASE_URL } from '../utils/constants';

export const getAllCategoriesApi = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'GET'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi lấy danh sách danh mục!');
  }
  return data;
};

export const getAllCategoriesForAdminApi = async (token) => {
  const response = await fetch(`${API_BASE_URL}/categories/admin`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi tải danh mục!');
  return data;
};

export const createCategoryApi = async (categoryData, imageFile, token) => {
  const formData = new FormData();
  formData.append('category', JSON.stringify(categoryData));
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`${API_BASE_URL}/categories/admin`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi thêm danh mục!');
  return data;
};

export const updateCategoryApi = async (id, categoryData, imageFile, token) => {
  const formData = new FormData();
  formData.append('category', JSON.stringify(categoryData));
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(`${API_BASE_URL}/categories/admin/${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi cập nhật danh mục!');
  return data;
};

export const getCategoryAttributesApi = async (categoryId) => {
  const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/attributes`, {
    method: 'GET'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi lấy thuộc tính danh mục!');
  return data;
};

export const addCategoryAttributeApi = async (categoryId, attributeData, token) => {
  const response = await fetch(`${API_BASE_URL}/categories/admin/${categoryId}/attributes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(attributeData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi thêm thuộc tính!');
  return data;
};

export const deleteCategoryAttributeApi = async (attrId, token) => {
  const response = await fetch(`${API_BASE_URL}/categories/admin/attributes/${attrId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    if (response.status === 204) return;
    const data = await response.json();
    throw new Error(data.message || 'Lỗi xóa thuộc tính danh mục!');
  }
};

export const updateCategoryAttributeApi = async (attrId, attributeData, token) => {
  const response = await fetch(`${API_BASE_URL}/categories/admin/attributes/${attrId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(attributeData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi cập nhật thuộc tính!');
  return data;
};
