import { useState, useCallback } from 'react';
import { getSellerProductsApi, createProductApi, deleteProductApi, updateProductApi, updateStockApi } from '../services/product.service';
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
  const [images, setImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});
  const [variants, setVariants] = useState([]);
  const [variantAttributeIds, setVariantAttributeIds] = useState([]);
  
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchProducts = useCallback(async (keyword = '', page = 0, size = 10) => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await getSellerProductsApi(token, keyword, page, size);
      setProducts(data.content || (Array.isArray(data) ? data : []));
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements !== undefined ? data.totalElements : (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const categoriesData = await getAllCategoriesApi();
      setCategories(categoriesData);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'price') {
      finalValue = value.replace(/\D/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));


    if (name === 'categoryId') {
      if (value) {
        getCategoryAttributesApi(value)
          .then(attributes => {
            setCategoryAttributes(attributes);
            setAttributeValues({});
            setVariants([]);
            setVariantAttributeIds([]);
          })
          .catch(err => console.error(err));
      } else {
        setCategoryAttributes([]);
        setAttributeValues({});
        setVariants([]);
        setVariantAttributeIds([]);
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

  const handleVariantImageChange = useCallback((index, file) => {
    if (!file)
      return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setVariants(prev => {
        const newV = [...prev];
        newV[index] = { ...newV[index], imageUrl: reader.result };
        return newV;
      });
    };
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const finalPrice = variants.length > 0 ? Math.min(...variants.map(v => parseFloat(v.price) || 0)) : parseFloat(formData.price);
      const finalStock = variants.length > 0 ? variants.reduce((sum, v) => sum + (parseInt(v.stockQuantity) || 0), 0) : parseInt(formData.stockQuantity);

      let filesToUpload = [];
      let existingImageIdsToKeep = [];
      let mainImageId = null;

      images.forEach((img, index) => {
        if (img.file) {
          filesToUpload.push(img.file);
        } else if (img.imageId) {
          existingImageIdsToKeep.push(img.imageId);
          if (index === mainImageIndex) {
            mainImageId = img.imageId;
          }
        }
      });
      if (mainImageId == null && filesToUpload.length > 0) {
        let newFileCounter = 0;
        images.forEach((img, index) => {
          if (img.file) {
            if (index === mainImageIndex) {
              const file = filesToUpload[newFileCounter];
              filesToUpload.splice(newFileCounter, 1);
              filesToUpload.unshift(file);
            }
            newFileCounter++;
          }
        });
      }

      const payload = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        price: finalPrice,
        stockQuantity: finalStock,
        attributes: attributeValues,
        existingImageIdsToKeep: existingImageIdsToKeep,
        mainImageId: mainImageId,
        variants: variants.map(v => {
          const filteredAttrs = {};
          if (v.attributes) {
            Object.keys(v.attributes).forEach(attrId => {
              if (v.attributes[attrId] !== undefined) {
                filteredAttrs[attrId] = v.attributes[attrId];
              }
            });
          }
          return {
            variantId: v.id && !v.id.toString().includes('.') ? parseInt(v.id) : null,
            sku: v.sku || '',
            price: parseFloat(v.price) || parseFloat(formData.price) || 0,
            stockQuantity: parseInt(v.stockQuantity) || 0,
            imageUrl: v.imageUrl || null,
            attributes: filteredAttrs
          };
        })
      };

      const formDataToSend = new FormData();
      formDataToSend.append('product', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

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
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset form
      setFormData({
        categoryId: '', productName: '', description: '', price: '', stockQuantity: '', brand: '', keywords: ''
      });
      setAttributeValues({});
      setCategoryAttributes([]);
      setVariants([]);
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
      setMainImageIndex(0);
      setEditingProductId(null);
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, attributeValues, images, mainImageIndex, token, editingProductId, variants]);

  const handleDeleteProduct = useCallback(async (productId) => {
    try {
      await deleteProductApi(productId, token);
      setProducts(prev => prev.filter(p => p.productId !== productId));
      setSuccess('Xóa sản phẩm thành công!');
      setTimeout(() =>
        setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }, [token]);


  const handleUpdateStock = useCallback(async (productId, variantId, newStockQuantity) => {
    try {
      await updateStockApi(productId, variantId, newStockQuantity, token);
      
      setProducts(prev => prev.map(p => {
        if (p.productId === productId) {
          const updatedProduct = { ...p };
          if (variantId) {
            if (updatedProduct.variants) {
              updatedProduct.variants = updatedProduct.variants.map(v => 
                v.variantId === variantId ? { ...v, stockQuantity: newStockQuantity } : v
              );
              updatedProduct.stockQuantity = updatedProduct.variants.reduce((sum, v) => sum + parseInt(v.stockQuantity), 0);
            }
          } else {
            updatedProduct.stockQuantity = newStockQuantity;
          }
          return updatedProduct;
        }
        return p;
      }));
      setSuccess('Cập nhật tồn kho thành công!');
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
      return false;
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
      //LẤY THÔNG SỐ KỸ THUẬT
      getCategoryAttributesApi(product.categoryId)
        .then(attributes => {
          setCategoryAttributes(attributes);

          // ĐỔ DỮ LIỆU CŨ
          const attrValuesMap = {};
          if (product.attributes) {
            attributes.forEach(attr => {
              if (product.attributes[attr.attrName] !== undefined) {
                attrValuesMap[attr.attrId] = product.attributes[attr.attrName];
              }
            });
          }
          setAttributeValues(attrValuesMap);

          // XỬ LÝ PHÂN LOẠI
          if (product.variants) {
            const mappedVariants = product.variants.map(v => {
              const vAttrs = {};
              if (v.attributes) {
                attributes.forEach(attr => {
                  if (v.attributes[attr.attrName] !== undefined) {
                    vAttrs[attr.attrId] = v.attributes[attr.attrName];
                  }
                });
              }
              return {
                id: v.variantId || Math.random().toString(), // local id for key
                sku: v.sku || '',
                price: v.price || '',
                stockQuantity: v.stockQuantity || '',
                imageUrl: v.imageUrl || '',
                attributes: vAttrs
              };
            });
            setVariants(mappedVariants);
            const usedInVariants = new Set();
            mappedVariants.forEach(v => {
              if (v.attributes) {
                Object.keys(v.attributes).forEach(attrId => usedInVariants.add(parseInt(attrId)));
              }
            });

            setVariantAttributeIds(Array.from(usedInVariants));
          } else {
            setVariants([]);
            setVariantAttributeIds([]);
          }
        })
        .catch(err => console.error(err));
    } else {
      setVariants([]);
    }

    // XỬ LÝ HÌNH ẢNH
    images.forEach(img => {
      if (img.file) URL.revokeObjectURL(img.previewUrl);
    });

    if (product.imageIds && product.imageIds.length > 0) {
      // Lấy ID ảnh cũ
      const existingImages = product.imageIds.map(id => ({
        file: null,
        previewUrl: `${API_BASE_URL}/public/images/${id}`,
        imageId: id
      }));
      setImages(existingImages);
      const mainIdx = product.imageIds.findIndex(id => id === product.mainImageId);
      setMainImageIndex(mainIdx >= 0 ? mainIdx : 0);
    } else {
      setImages([]);
      setMainImageIndex(0);
    }

    setShowAddForm(true);
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
    setVariants([]);
    setVariantAttributeIds([]);
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setMainImageIndex(0);
  }, [images]);

  return {
    products, categories, loading, error, success,
    showAddForm, setShowAddForm, isSubmitting, editingProductId,
    formData, images, mainImageIndex, setMainImageIndex,
    categoryAttributes, attributeValues, variants, setVariants,
    variantAttributeIds, setVariantAttributeIds,
    fetchCategories, handleInputChange, handleAttributeChange, handleVariantImageChange,
    handleDeleteProduct, handleEditClick, handleCancelForm, buildCategoryOptions,
    handleUpdateStock, fetchProducts, totalPages, totalElements,
    handleSubmit, handleImageChange, handleRemoveImage
  };
};
