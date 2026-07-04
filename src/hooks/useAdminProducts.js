import { useState, useCallback, useEffect } from 'react';
import { getAdminProductsApi, approveProductApi, rejectProductApi } from '../services/product.service';

export const useAdminProducts = (token) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('PENDING'); 
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const data = await getAdminProductsApi(keyword, status, page, pageSize, token);
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, keyword, status, page, pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleApprove = useCallback(async (productId) => {
    try {
      setIsProcessing(true);
      setError('');
      await approveProductApi(productId, token);
      setSuccess('Đã duyệt sản phẩm thành công!');
      setTimeout(() => setSuccess(''), 3000);
      fetchProducts(); // Refresh current page list
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [token, fetchProducts]);

  const handleReject = useCallback(async (productId, reason = '') => {
    try {
      setIsProcessing(true);
      setError('');
      await rejectProductApi(productId, token, reason);
      setSuccess('Đã từ chối sản phẩm!');
      setTimeout(() => setSuccess(''), 3000);
      fetchProducts();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, [token, fetchProducts]);

  return {
    products, loading, error, success, isProcessing,
    keyword, setKeyword,
    status, setStatus,
    page, setPage,
    totalPages, totalElements, pageSize,
    fetchProducts, handleApprove, handleReject
  };
};
