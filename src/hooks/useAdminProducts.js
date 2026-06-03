import { useState, useCallback, useEffect } from 'react';
import { getAdminProductsApi, approveProductApi, rejectProductApi } from '../services/product.service';

export const useAdminProducts = (token) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminProductsApi(token);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token, fetchProducts]);

  const handleApprove = useCallback(async (productId) => {
    try {
      setIsProcessing(true);
      setError('');
      const updatedProduct = await approveProductApi(productId, token);
      setProducts(prev => prev.map(p => p.productId === productId ? updatedProduct : p));
      setSuccess('Đã duyệt sản phẩm thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [token]);

  const handleReject = useCallback(async (productId, reason = '') => {
    try {
      setIsProcessing(true);
      setError('');
      const updatedProduct = await rejectProductApi(productId, token, reason);
      setProducts(prev => prev.map(p => p.productId === productId ? updatedProduct : p));
      setSuccess('Đã từ chối sản phẩm!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [token]);

  return {
    products, loading, error, success, isProcessing,
    fetchProducts, handleApprove, handleReject
  };
};
