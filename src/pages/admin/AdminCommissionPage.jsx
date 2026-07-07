import React from 'react';
import { useAdminCommission } from '../../hooks/useAdminCommission';
import AdminLayout from '../../layouts/AdminLayout';
import Alert from '../../components/Alert';

const AdminCommissionPage = () => {
  const {
    commissions,
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
  } = useAdminCommission();

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.categoryId === categoryId);
    return cat ? cat.categoryName : 'Không xác định';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading && commissions.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-loading">Đang tải dữ liệu...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="admin-page-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="admin-page-title">Cấu hình Hoa Hồng theo Thể Loại</h2>
            <p className="admin-page-desc">Cấu hình tỉ lệ hoa hồng cho từng nhóm sản phẩm</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
              <input
                type="text"
                className="admin-category-form-input"
                placeholder="Tìm kiếm thể loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '280px', paddingLeft: '40px', margin: 0, height: '42px' }}
              />
            </div>
            <button className="admin-category-header-btn" onClick={() => {
              setEditId(null);
              setFormData({ categoryId: '', commissionRate: '', status: 'ACTIVE' });
              setShowAddForm(true);
            }}>
              + Thêm Cấu Hình
            </button>
          </div>
        </div>

        {error && <Alert message={error} type="error" />}
        {success && <Alert message={success} type="success" />}

        {showAddForm && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-content">
              <div className="admin-modal-header">
                <h3>{editId ? 'Cập Nhật Cấu Hình Hoa Hồng' : 'Thêm Cấu Hình Hoa Hồng Mới'}</h3>
                <button className="admin-modal-close" onClick={() => setShowAddForm(false)}>&times;</button>
              </div>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }} onSubmit={handleCreateCommission}>
                <div className="admin-category-form-group">
                  <label className="admin-category-form-label">Thể Loại Sản Phẩm</label>
                  <select className="admin-category-form-select" name="categoryId" value={formData.categoryId} onChange={handleInputChange} required>
                    <option value="">-- Chọn thể loại --</option>
                    {categories.filter(c => !c.parentId).map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-category-form-group">
                  <label className="admin-category-form-label">Tỉ lệ hoa hồng (%) (Ví dụ: Nhập 5 để thu 5%)</label>
                  <input
                    className="admin-category-form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                    placeholder="Nhập tỉ lệ phần trăm từ 0 đến 100"
                    required
                  />
                </div>

                <div className="admin-category-form-group">
                  <label className="admin-category-form-label">Trạng Thái</label>
                  <select className="admin-category-form-select" name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="ACTIVE">Kích hoạt (ACTIVE)</option>
                    <option value="INACTIVE">Vô hiệu (INACTIVE)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="admin-category-form-submit">Lưu Cấu Hình</button>
                  <button type="button" className="btn-close" onClick={() => setShowAddForm(false)}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="admin-table-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Thể Loại</th>
                  <th>Tỉ lệ Hoa Hồng</th>
                  <th>Trạng Thái</th>
                  <th>Ngày Tạo</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(item => (
                  <tr key={item.commissionId}>
                    <td>{item.commissionId}</td>
                    <td>{item.categoryName || getCategoryName(item.categoryId)}</td>
                    <td>
                      <span className="commission-rate-badge">
                        {(item.commissionRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      {item.status === 'ACTIVE'
                        ? <span className="admin-status-badge">Hoạt động</span>
                        : <span className="admin-status-badge inactive">Đã tắt</span>}
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="admin-actions center">
                        <button
                          className="admin-action-btn edit"
                          onClick={() => handleEditClick(item)}
                        >
                          <span className="material-symbols-outlined">edit</span> Sửa
                        </button>
                        {item.status === 'ACTIVE' ? (
                          <button
                            className="admin-action-btn reject"
                            onClick={() => handleUpdateStatus(item.commissionId, 'INACTIVE')}
                          >
                            <span className="material-symbols-outlined">visibility_off</span> Ẩn
                          </button>
                        ) : (
                          <button
                            className="admin-action-btn approve"
                            onClick={() => handleUpdateStatus(item.commissionId, 'ACTIVE')}
                          >
                            <span className="material-symbols-outlined">visibility</span> Hiện
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {commissions.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="admin-empty-state">
                        <div className="empty-content">
                          <span className="material-symbols-outlined empty-icon">receipt_long</span>
                          <p>Chưa có dữ liệu hoa hồng nào</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCommissionPage;
