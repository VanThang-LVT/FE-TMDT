import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SellerLayout from '../../layouts/SellerLayout';
import toast from 'react-hot-toast';
import { getShopReviewsApi, replyReviewApi } from '../../services/review.service';
import './SellerReviewsPage.css';

function SellerReviewsPage() {
  const { user, isSeller, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedReview, setSelectedReview] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isSeller()) {
        navigate('/');
      } else if (token) {
        fetchReviews(currentPage);
      }
    }
  }, [authLoading, user, isSeller, navigate, token, currentPage]);

  const fetchReviews = async (page) => {
    try {
      setLoading(true);
      const data = await getShopReviewsApi(token, page, 10);
      setReviews(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Lỗi khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyContent(review.sellerReply || '');
  };

  const closeReplyModal = () => {
    setSelectedReview(null);
    setReplyContent('');
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedReview = await replyReviewApi(selectedReview.reviewId, replyContent, token);
      
      // Update local state
      setReviews(reviews.map(r => r.reviewId === updatedReview.reviewId ? updatedReview : r));
      toast.success('Phản hồi đánh giá thành công');
      closeReplyModal();
    } catch (error) {
      toast.error(error.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`material-symbols-outlined ${i <= rating ? 'star-filled' : 'star-empty'}`}
        >
          star
        </span>
      );
    }
    return stars;
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'createdAt') {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredReviews = sortedReviews.filter(r => {
    if (filterStatus === 'replied') return !!r.sellerReply;
    if (filterStatus === 'pending') return !r.sellerReply;
    return true;
  });

  const countAll = reviews.length;
  const countPending = reviews.filter(r => !r.sellerReply).length;
  const countReplied = reviews.filter(r => !!r.sellerReply).length;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <SellerLayout>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '20px' }}>
        <div>
          <h2 className="admin-page-title">Quản lý Đánh giá</h2>
          <p className="admin-page-desc">Theo dõi và phản hồi đánh giá từ khách hàng.</p>
        </div>
        <div className="sr-sort-toolbar">
          <span className="sr-sort-label">Sắp xếp theo:</span>
          <button
            className={`admin-action-btn sr-sort-btn${sortField === 'createdAt' ? ' active' : ''}`}
            onClick={() => handleSort('createdAt')}
          >
            <span className="material-symbols-outlined icon-18">calendar_today</span>
            Ngày {sortField === 'createdAt' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
          </button>
          <button
            className={`admin-action-btn sr-sort-btn${sortField === 'rating' ? ' active' : ''}`}
            onClick={() => handleSort('rating')}
          >
            <span className="material-symbols-outlined icon-18">star</span>
            Sao {sortField === 'rating' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-tabs admin-tabs-container">
        <button
          className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterStatus('all')}
        >
          Tất cả {countAll > 0 ? `(${countAll})` : ''}
        </button>
        <button
          className={`btn ${filterStatus === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterStatus('pending')}
        >
          Chờ phản hồi {countPending > 0 ? `(${countPending})` : ''}
        </button>
        <button
          className={`btn ${filterStatus === 'replied' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterStatus('replied')}
        >
          Đã phản hồi {countReplied > 0 ? `(${countReplied})` : ''}
        </button>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Đánh giá</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="admin-empty-state">
                    <div className="spinner sr-loading-spinner"></div>
                    <p className="sr-loading-text">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-empty-state">Gian hàng của bạn chưa có đánh giá nào.</td>
                </tr>
              ) : (
                sortedReviews.filter(r => {
                    if (filterStatus === 'replied') return !!r.sellerReply;
                    if (filterStatus === 'pending') return !r.sellerReply;
                    return true;
                  }).map(review => (
                  <tr key={review.reviewId}>
                    <td>
                      <div className="sr-user-cell">
                        <img
                          src={review.userAvatarUrl ? (review.userAvatarUrl.startsWith('http') ? review.userAvatarUrl : `http://localhost:8080${review.userAvatarUrl}`) : 'https://via.placeholder.com/40'}
                          alt="Avatar"
                          className="sr-user-avatar"
                        />
                        <div>
                          <div className="sr-user-name">{review.userFullName}</div>
                          <div className="sr-user-date">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="sr-product-cell">
                      <div className="sr-product-name" title={review.productName}>
                        {review.productName || 'Sản phẩm không xác định'}
                      </div>
                      {review.variantAttributes && (
                        <div className="sr-product-variant">PL: {review.variantAttributes}</div>
                      )}
                    </td>
                    <td className="sr-review-cell">
                      <div className="sr-review-stars">
                        {renderStars(review.rating)}
                      </div>
                      <div className="sr-review-text" title={review.content}>
                        {review.content || <span className="sr-review-text-empty">Không có nội dung</span>}
                      </div>
                      {(review.imageUrl1 || review.imageUrl2) && (
                        <div className="sr-review-images">
                          {review.imageUrl1 && (
                            <img
                              src={`http://localhost:8080${review.imageUrl1}`}
                              alt="Ảnh đánh giá 1"
                              className="sr-review-img"
                              onClick={() => window.open(`http://localhost:8080${review.imageUrl1}`, '_blank')}
                            />
                          )}
                          {review.imageUrl2 && (
                            <img
                              src={`http://localhost:8080${review.imageUrl2}`}
                              alt="Ảnh đánh giá 2"
                              className="sr-review-img"
                              onClick={() => window.open(`http://localhost:8080${review.imageUrl2}`, '_blank')}
                            />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="sr-status-cell">
                      {review.sellerReply ? (
                        <span className="admin-status-badge active">Đã phản hồi</span>
                      ) : (
                        <span className="admin-status-badge pending">Chờ phản hồi</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-actions" style={{ justifyContent: 'center' }}>
                        <button
                          className="admin-action-btn"
                          title={review.sellerReply ? 'Sửa phản hồi' : 'Phản hồi'}
                          onClick={() => openReplyModal(review)}
                          style={{ backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}
                        >
                          <span className="material-symbols-outlined icon-18">{review.sellerReply ? 'edit' : 'reply'}</span>
                          {review.sellerReply ? 'Sửa phản hồi' : 'Phản hồi'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 0 && !loading && (
        <div className="sr-pagination">
          <button
            className="admin-pagination-btn"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentPage === 0 ? '#f1f5f9' : '#fff', color: currentPage === 0 ? '#94a3b8' : '#334155', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="sr-pagination-info">
            Trang {currentPage + 1} / {totalPages}
          </span>
          <button
            className="admin-pagination-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', background: currentPage >= totalPages - 1 ? '#f1f5f9' : '#fff', color: currentPage >= totalPages - 1 ? '#94a3b8' : '#334155', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {/* Reply Modal */}
      {selectedReview && (
        <div className="product-detail-modal-overlay" onClick={closeReplyModal}>
          <div className="product-detail-modal-content sr-modal-content" onClick={e => e.stopPropagation()}>
            <div className="product-detail-modal-header">
              <h3>{selectedReview.sellerReply ? 'Chỉnh sửa phản hồi' : 'Phản hồi đánh giá'}</h3>
              <button className="admin-category-modal-close" onClick={closeReplyModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleReplySubmit} className="sr-modal-body">
              <div className="sr-original-review">
                <div className="sr-original-review-header">
                  <strong>{selectedReview.userFullName} đánh giá:</strong>
                  <div className="sr-original-review-stars">
                    {renderStars(selectedReview.rating)}
                  </div>
                </div>
                <p className="sr-original-review-text">
                  {selectedReview.content || <span className="sr-review-text-empty">Không có nội dung</span>}
                </p>
              </div>

              <div className="sr-form-group">
                <label className="sr-form-label">Nội dung phản hồi của bạn</label>
                <textarea
                  className="sr-textarea"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Nhập nội dung phản hồi. Hãy phản hồi lịch sự và mang tính chất xây dựng..."
                  rows="5"
                  required
                />
              </div>

              <div className="sr-form-actions">
                <button type="button" className="btn btn-outline" onClick={closeReplyModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}

export default SellerReviewsPage;

