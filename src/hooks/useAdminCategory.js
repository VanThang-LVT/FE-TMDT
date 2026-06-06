import { useState, useCallback } from 'react';
import { 
  getAllCategoriesForAdminApi, 
  createCategoryApi, 
  updateCategoryApi, 
  getCategoryAttributesApi, 
  addCategoryAttributeApi, 
  updateCategoryAttributeApi,
  deleteCategoryAttributeApi 
} from '../services/category.service';

export const useAdminCategory = (token) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandedCats, setExpandedCats] = useState({});

  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [newAttr, setNewAttr] = useState({ attrName: '', isRequired: false });
  const [editingAttrId, setEditingAttrId] = useState(null);
  const [editAttrData, setEditAttrData] = useState({ attrName: '', isRequired: false });
  const [attrLoading, setAttrLoading] = useState(false);

  const [formData, setFormData] = useState({
    parentId: '',
    categoryName: '',
    description: '',
    status: 'ACTIVE'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const toggleExpand = useCallback((categoryId) => {
    setExpandedCats(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  }, []);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getAllCategoriesForAdminApi(token);
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        parentId: formData.parentId ? parseInt(formData.parentId) : null
      };
      
      if (editMode) {
        await updateCategoryApi(editId, payload, imageFile, token);
        await fetchCategories();
        setSuccess('Cập nhật danh mục thành công!');
      } else {
        const newCategory = await createCategoryApi(payload, imageFile, token);
        setCategories(prev => [...prev, newCategory]);
        setSuccess('Thêm danh mục thành công!');
      }
      
      setShowAddForm(false);
      setEditMode(false);
      setEditId(null);
      setFormData({ parentId: '', categoryName: '', description: '', status: 'ACTIVE' });
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [editMode, editId, formData, imageFile, fetchCategories, token]);

  const handleEditClick = useCallback((cat) => {
    setEditMode(true);
    setEditId(cat.categoryId);
    setFormData({
      parentId: cat.parentId || '',
      categoryName: cat.categoryName || '',
      description: cat.description || '',
      status: cat.status || 'ACTIVE'
    });
    setImageFile(null);
    setImagePreview(cat.hasImage ? `http://localhost:8080/api/categories/public/${cat.categoryId}/image` : null);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleStatus = useCallback(async (cat) => {
    try {
      const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const payload = {
        parentId: cat.parentId,
        categoryName: cat.categoryName,
        description: cat.description,
        status: newStatus
      };
      await updateCategoryApi(cat.categoryId, payload, token);
      await fetchCategories(); // Refresh whole list to get cascaded child changes
      setSuccess(`Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} danh mục thành công!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }, [token, fetchCategories]);

  const handleCancelForm = useCallback(() => {
    setShowAddForm(false);
    setEditMode(false);
    setEditId(null);
    setFormData({ parentId: '', categoryName: '', description: '', status: 'ACTIVE' });
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const fetchAttributes = useCallback(async (categoryId) => {
    try {
      setAttrLoading(true);
      const data = await getCategoryAttributesApi(categoryId);
      setAttributes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAttrLoading(false);
    }
  }, []);

  const openAttrModal = useCallback((cat) => {
    setSelectedCategory(cat);
    setAttrModalOpen(true);
    fetchAttributes(cat.categoryId);
  }, [fetchAttributes]);

  const handleAddAttr = useCallback(async (e) => {
    e.preventDefault();
    if (!newAttr.attrName.trim()) return;
    try {
      setAttrLoading(true);
      await addCategoryAttributeApi(selectedCategory.categoryId, newAttr, token);
      setNewAttr({ attrName: '', isRequired: false });
      fetchAttributes(selectedCategory.categoryId);
    } catch (err) {
      setError(err.message);
    } finally {
      setAttrLoading(false);
    }
  }, [newAttr, selectedCategory, token, fetchAttributes]);

  const handleEditAttrClick = useCallback((attr) => {
    setEditingAttrId(attr.attrId);
    setEditAttrData({ attrName: attr.attrName, isRequired: attr.isRequired });
  }, []);

  const handleCancelEditAttr = useCallback(() => {
    setEditingAttrId(null);
    setEditAttrData({ attrName: '', isRequired: false });
  }, []);

  const handleUpdateAttr = useCallback(async (e) => {
    e.preventDefault();
    if (!editAttrData.attrName.trim()) return;
    try {
      setAttrLoading(true);
      await updateCategoryAttributeApi(editingAttrId, editAttrData, token);
      setEditingAttrId(null);
      fetchAttributes(selectedCategory.categoryId);
    } catch (err) {
      setError(err.message);
    } finally {
      setAttrLoading(false);
    }
  }, [editingAttrId, editAttrData, selectedCategory, token, fetchAttributes]);
  
  const handleDeleteAttr = useCallback(async (attrId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thuộc tính này?')) return;
    try {
      setAttrLoading(true);
      await deleteCategoryAttributeApi(attrId, token);
      fetchAttributes(selectedCategory.categoryId);
    } catch (err) {
      setError(err.message);
    } finally {
      setAttrLoading(false);
    }
  }, [selectedCategory, token, fetchAttributes]);

  return {
    categories, loading, error, success,
    showAddForm, setShowAddForm,
    isSubmitting, editMode, editId, expandedCats,
    formData, handleInputChange, handleImageChange, imagePreview, handleSubmit,
    handleEditClick, handleToggleStatus, handleCancelForm, toggleExpand,
    attrModalOpen, setAttrModalOpen, selectedCategory, attributes,
    newAttr, setNewAttr, attrLoading, openAttrModal, handleAddAttr, handleDeleteAttr,
    editingAttrId, editAttrData, setEditAttrData, handleEditAttrClick, handleCancelEditAttr, handleUpdateAttr,
    fetchCategories
  };
};
