import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllCommissions, createCommission, updateCommission, updateCommissionStatus } from '../services/commission.service';
import { getAllCategoriesForAdminApi } from "../services/category.service";

export const useAdminCommission = () => {
  const [commissions, setCommissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    commissionRate: '',
    status: 'ACTIVE'
  });

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [commData, catData] = await Promise.all([
        getAllCommissions(token),
        getAllCategoriesForAdminApi(token)
      ]);
      setCommissions(commData);
      setCategories(Array.isArray(catData) ? catData : (catData.data || []));
      setError('');
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'commissionRate') {
      if (Number(value) < 0 || Number(value) > 100) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCommission = async (e) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.commissionRate) {
      setError('Vui lòng chọn danh mục và nhập tỉ lệ hoa hồng');
      return;
    }
    
    const rate = parseFloat(formData.commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Tỉ lệ hoa hồng phải từ 0 đến 100%');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        categoryId: parseInt(formData.categoryId),
        commissionRate: parseFloat(formData.commissionRate) / 100,
        status: formData.status
      };

      if (editId) {
        await updateCommission(editId, payload, token);
        setSuccess('Cập nhật cấu hình hoa hồng thành công');
      } else {
        await createCommission(payload, token);
        setSuccess('Thêm cấu hình hoa hồng thành công');
      }
      
      setShowAddForm(false);
      setEditId(null);
      setFormData({ categoryId: '', commissionRate: '', status: 'ACTIVE' });
      fetchInitialData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu hoa hồng');
    }
  };

  const handleEditClick = (commission) => {
    setEditId(commission.commissionId);
    setFormData({
      categoryId: commission.categoryId,
      commissionRate: (commission.commissionRate * 100).toFixed(1), // Convert decimal back to percentage
      status: commission.status
    });
    setShowAddForm(true);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await updateCommissionStatus(id, newStatus, token);
      setSuccess('Cập nhật trạng thái thành công');
      fetchInitialData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const filteredCommissions = useMemo(() => {
    if (!searchQuery.trim()) return commissions;
    const lowerQuery = searchQuery.toLowerCase();
    return commissions.filter(c => {
      // Find category name
      const cat = categories.find(catItem => catItem.categoryId === c.categoryId);
      const catName = cat ? cat.categoryName.toLowerCase() : '';
      return (c.categoryName && c.categoryName.toLowerCase().includes(lowerQuery)) || catName.includes(lowerQuery);
    });
  }, [commissions, searchQuery, categories]);

  return {
    commissions: filteredCommissions,
    categories,
    loading,
    error,
    success,
    showAddForm,
    setShowAddForm,
    formData,
    setFormData,
    editId,
    setEditId,
    searchQuery,
    setSearchQuery,
    handleInputChange,
    handleCreateCommission,
    handleEditClick,
    handleUpdateStatus
  };
};
