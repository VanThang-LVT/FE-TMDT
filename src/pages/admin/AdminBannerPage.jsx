import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminBannersApi, createBannerApi, updateBannerApi, deleteBannerApi, toggleBannerStatusApi } from '../../services/banner.service';
import { API_BASE_URL } from '../../utils/constants';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

function AdminBannerPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '', buttonLink: '', displayOrder: 0, isActive: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      const data = await getAdminBannersApi(token);
      setBanners(data);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách banner');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (!isAdmin()) {
        navigate('/');
      } else {
        fetchBanners();
      }
    }
  }, [user, authLoading, isAdmin, navigate, fetchBanners]);

  const handleOpenModal = (banner = null) => {
    setEditingBanner(banner);
    if (banner) {
      setFormData({
        title: banner.title,
        buttonLink: banner.buttonLink || '',
        displayOrder: banner.displayOrder,
        isActive: banner.isActive
      });
      setImagePreview(`${API_BASE_URL}/banners/images/${banner.bannerId}`);
    } else {
      setFormData({ title: '', buttonLink: '', displayOrder: 0, isActive: true });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingBanner && !imageFile) {
      return toast.error("Vui lòng chọn ảnh cho banner mới");
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('buttonLink', formData.buttonLink);
      data.append('displayOrder', formData.displayOrder);
      data.append('isActive', formData.isActive);
      if (imageFile)
        data.append('image', imageFile);

      if (editingBanner) {
        await updateBannerApi(editingBanner.bannerId, data, token);
        toast.success("Cập nhật thành công!");
      } else {
        await createBannerApi(data, token);
        toast.success("Thêm mới thành công!");
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleBannerStatusApi(id, token);
      fetchBanners();
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa banner này?")) return;
    try {
      await deleteBannerApi(id, token);
      fetchBanners();
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa banner');
    }
  };

  if (authLoading || !user || !isAdmin()) {
    return <div style={{ padding: '50px', textAlign: 'center', color: '#181c20' }}>Đang xác thực quyền Admin...</div>;
  }

  if (loading) return <div>Đang tải danh sách banner...</div>;

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2 className="admin-page-title">Quản lý Banner (Slider)</h2>
            <p className="admin-page-desc">Tùy chỉnh các banner hiển thị trên trang chủ của khách hàng.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="admin-category-header-btn" onClick={() => handleOpenModal()}>
              + Thêm Banner Mới
            </button>
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Hình ảnh</th>
                  <th>Tiêu đề</th>
                  <th>Thứ tự</th>
                  <th>Trạng thái</th>
                  <th style={{textAlign: 'center'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-empty-state">
                      <div className="empty-content">
                        <span className="material-symbols-outlined empty-icon">view_carousel</span>
                        <p>Chưa có banner nào.</p>
                      </div>
                    </td>
                  </tr>
                ) : banners.map(banner => (
                  <tr key={banner.bannerId}>
                    <td>#{banner.bannerId}</td>
                    <td>
                      <img 
                        src={`${API_BASE_URL}/banners/images/${banner.bannerId}`} 
                        alt={banner.title} 
                        style={{ width: '120px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </td>
                    <td>
                      <strong>{banner.title}</strong>
                    </td>
                    <td>{banner.displayOrder}</td>
                    <td>
                      <span className={`admin-status-badge ${banner.isActive ? '' : 'rejected'}`} style={banner.isActive ? {background: '#e0f2fe', color: '#0369a1'} : {}}>
                        {banner.isActive ? 'Đang hiện' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td style={{textAlign: 'right'}}>
                      <div className="admin-actions">
                        <button className="admin-action-btn approve" style={banner.isActive ? {background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1'} : {}} onClick={() => handleToggle(banner.bannerId)} title={banner.isActive ? 'Ẩn Banner' : 'Hiện Banner'}>
                          <span className="material-symbols-outlined">{banner.isActive ? 'visibility_off' : 'visibility'}</span>
                          {banner.isActive ? 'Ẩn' : 'Hiện'}
                        </button>
                        <button className="admin-action-btn edit" onClick={() => handleOpenModal(banner)} title="Sửa">
                          <span className="material-symbols-outlined">edit</span>
                          Sửa
                        </button>
                        <button className="admin-action-btn reject" onClick={() => handleDelete(banner.bannerId)} title="Xóa">
                          <span className="material-symbols-outlined">delete</span>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="admin-category-modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
            <div className="admin-category-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'}}>
              <div className="admin-category-modal-header">
                <h3 className="admin-category-modal-title">{editingBanner ? 'Cập nhật Banner' : 'Thêm Banner Mới'}</h3>
                <button className="admin-category-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                <div className="admin-category-form-group" style={{ margin: 0 }}>
                  <label className="admin-category-form-label">Ảnh Banner (*)</label>
                  {imagePreview && (
                    <div style={{marginBottom: '10px'}}>
                      <img src={imagePreview} alt="Preview" style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="admin-category-form-input" style={{padding: '8px'}} />
                </div>

                <div className="admin-category-form-group" style={{ margin: 0 }}>
                  <label className="admin-category-form-label">Tiêu đề (*)</label>
                  <input type="text" className="admin-category-form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Ví dụ: Siêu Sale Mùa Hè" />
                </div>

                <div style={{display: 'flex', gap: '16px'}}>
                  <div className="admin-category-form-group" style={{flex: 1, margin: 0}}>
                    <label className="admin-category-form-label">Đường dẫn khi click (Tùy chọn)</label>
                    <input type="text" className="admin-category-form-input" value={formData.buttonLink} onChange={e => setFormData({...formData, buttonLink: e.target.value})} placeholder="VD: /products/123" />
                  </div>
                  <div className="admin-category-form-group" style={{flex: 1, margin: 0}}>
                    <label className="admin-category-form-label">Thứ tự hiển thị</label>
                    <input type="number" className="admin-category-form-input" value={formData.displayOrder} onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{width: '18px', height: '18px', cursor: 'pointer'}} />
                  <label htmlFor="isActive" className="admin-category-form-label" style={{marginBottom: 0, cursor: 'pointer', userSelect: 'none'}}>Kích hoạt hiển thị Banner ngay lập tức</label>
                </div>

                <div className="admin-category-form-actions" style={{marginTop: '24px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px'}}>
                  <button type="button" className="admin-category-form-cancel" onClick={() => setIsModalOpen(false)} disabled={submitting}>HỦY BỎ</button>
                  <button type="submit" className="admin-category-form-submit" disabled={submitting}>
                    {submitting ? 'ĐANG LƯU...' : 'LƯU BANNER'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminBannerPage;
