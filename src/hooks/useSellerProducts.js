import { useState, useCallback } from 'react';
import { getSellerProductsApi, createProductApi, deleteProductApi, updateProductApi } from '../services/product.service';
import { getAllCategoriesApi, getCategoryAttributesApi } from '../services/category.service';
import { API_BASE_URL } from '../utils/constants';

const buildCategoryOptions = (cats, parentId = null, level = 0) => {
  let options = [];
  const children = cats.filter(c => c.parentId === parentId);
  children.forEach(child => {
    const prefix = level > 0 ? '\u00A0\u00A0\u00A0\u00A0'.repeat(level) + '└─ ' : '';
    options.push({
      categoryId: child.categoryId,
      categoryName: prefix + child.categoryName
    });
    options = options.concat(buildCategoryOptions(cats, child.categoryId, level + 1));
  });
  return options;
};

export const useSellerProducts = (token) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [formData, setFormData] = useState({
    categoryId: '',
    productName: '',
    description: '',
    price: '',
    stockQuantity: '',
    brand: '',
    keywords: ''
  });
  const [images, setImages] = useState([]); // Array of { file, previewUrl }
  const [mainImageIndex, setMainImageIndex] = useState(0);
  
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        getSellerProductsApi(token),
        getAllCategoriesApi()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Fetch attributes if category changes
    if (name === 'categoryId') {
      if (value) {
        getCategoryAttributesApi(value)
          .then(data => {
            setCategoryAttributes(data);
            setAttributeValues({}); // Reset values when category changes
          })
          .catch(err => console.error(err));
      } else {
        setCategoryAttributes([]);
        setAttributeValues({});
      }
    }
  }, []);

  const handleAttributeChange = useCallback((attrId, value) => {
    setAttributeValues(prev => ({ ...prev, [attrId]: value }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const handleRemoveImage = useCallback((index) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
    setMainImageIndex(prev => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        attributes: attributeValues
      };
      
      const formDataToSend = new FormData();
      formDataToSend.append('product', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      
      let filesToUpload = [...images.map(img => img.file).filter(f => f !== null)];
      if (filesToUpload.length > 0 && mainImageIndex !== 0 && mainImageIndex < filesToUpload.length) {
        // Swap main image to index 0 so backend picks it as main
        const mainFile = filesToUpload[mainImageIndex];
        filesToUpload.splice(mainImageIndex, 1);
        filesToUpload.unshift(mainFile);
      }
      
      filesToUpload.forEach((file) => {
        formDataToSend.append('images', file);
      });
      
      if (editingProductId) {
        const updatedProduct = await updateProductApi(editingProductId, formDataToSend, token);
        setProducts(prev => prev.map(p => p.productId === editingProductId ? updatedProduct : p));
        setSuccess('Cập nhật sản phẩm thành công!');
      } else {
        const newProduct = await createProductApi(formDataToSend, token);
        setProducts(prev => [newProduct, ...prev]);
        setSuccess('Thêm sản phẩm thành công! Đang chờ Admin duyệt.');
      }
      
      setShowAddForm(false);
      setEditingProductId(null);
      
      // Reset form
      setFormData({
        categoryId: '', productName: '', description: '', price: '', stockQuantity: '', brand: '', keywords: ''
      });
      setAttributeValues({});
      setCategoryAttributes([]);
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      setMainImageIndex(0);
      setEditingProductId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, attributeValues, images, mainImageIndex, token, editingProductId]);

  const handleDeleteProduct = useCallback(async (productId) => {
    try {
      await deleteProductApi(productId, token);
      setProducts(prev => prev.filter(p => p.productId !== productId));
      setSuccess('Xóa sản phẩm thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }, [token]);



  const handleEditClick = useCallback((product) => {
    setEditingProductId(product.productId);
    setFormData({
      categoryId: product.categoryId || '',
      productName: product.productName || '',
      description: product.description || '',
      price: product.price || '',
      stockQuantity: product.stockQuantity || '',
      brand: product.brand || '',
      keywords: product.keywords || ''
    });

    if (product.categoryId) {
      getCategoryAttributesApi(product.categoryId)
        .then(data => {
          setCategoryAttributes(data);

          const attrValuesMap = {};
          if (product.attributes) {
            data.forEach(attr => {
              if (product.attributes[attr.attrName]) {
                attrValuesMap[attr.attrId] = product.attributes[attr.attrName];
              }
            });
          }
          setAttributeValues(attrValuesMap);
        })
        .catch(err => console.error(err));
    }

    images.forEach(img => {
      if (img.file) URL.revokeObjectURL(img.previewUrl);
    });

    if (product.imageIds && product.imageIds.length > 0) {
      const existingImages = product.imageIds.map(id => ({
        file: null,
        previewUrl: `${API_BASE_URL}/public/images/${id}`,
        imageId: id
      }));
      setImages(existingImages);
      // Find main image index
      const mainIdx = product.imageIds.findIndex(id => id === product.mainImageId);
      setMainImageIndex(mainIdx >= 0 ? mainIdx : 0);
    } else {
      setImages([]);
      setMainImageIndex(0);
    }
    
    setShowAddForm(true);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [images]);

  const handleCancelForm = useCallback(() => {
    setShowAddForm(false);
    setEditingProductId(null);
    setFormData({
      categoryId: '', productName: '', description: '', price: '', stockQuantity: '', brand: '', keywords: ''
    });
    setAttributeValues({});
    setCategoryAttributes([]);
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setMainImageIndex(0);
  }, [images]);

  return {
    products, categories, loading, error, success,
    showAddForm, setShowAddForm, isSubmitting, editingProductId,
    formData, images, mainImageIndex, setMainImageIndex,
    categoryAttributes, attributeValues,
    fetchData, handleInputChange, handleAttributeChange,
    handleImageChange, handleRemoveImage, handleSubmit,
    handleDeleteProduct, handleEditClick, handleCancelForm, buildCategoryOptions
  };
};
