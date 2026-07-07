import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminVouchersApi,
  createVoucherApi,
  updateVoucherApi,
  deleteVoucherApi,
} from '../../services/voucher.service';
import AdminLayout from '../../layouts/AdminLayout';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  voucherCode: '',
  voucherName: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  quantity: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
};

const toDatetimeLocal = (str) => {
  if (!str) return '';
  return str.slice(0, 16); 
};

const toISODateTime = (str) => {
  if (!str) return null;
  return str + ':00'; 
};

function AdminVoucherPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');


  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchVouchers = useCallback(async (page = 0, keyword = '') => {
    try {
      setLoading(true);
      const data = await getAdminVouchersApi(token, page, 10, keyword);
      setVouchers(data.content);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      toast.error(err.message || 'Lỗi tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isAdmin()) navigate('/');
      else fetchVouchers(0, debouncedKeyword);
    }
  }, [authLoading, user, isAdmin, navigate, fetchVouchers, debouncedKeyword]);

  const handleOpenModal = (voucher = null) => {
    setEditingVoucher(voucher);
    if (voucher) {
      setFormData({
        voucherCode: voucher.voucherCode,
        voucherName: voucher.voucherName,
        discountType: voucher.discountType,
        discountValue: String(voucher.discountValue),
        minOrderAmount: voucher.minOrderAmount != null ? String(voucher.minOrderAmount) : '',
        maxDiscountAmount: voucher.maxDiscountAmount != null ? String(voucher.maxDiscountAmount) : '',
        quantity: String(voucher.quantity),
        startDate: toDatetimeLocal(voucher.startDate),
        endDate: toDatetimeLocal(voucher.endDate),
        status: voucher.status,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'discountValue' && formData.discountType === 'PERCENTAGE') {
      if (Number(value) < 0 || Number(value) > 100) return;
    }
    if (name === 'quantity' && Number(value) < 0) return;

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMoneyChange = (e) => {
    const { name, value } = e.target;
    const digits = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, [name]: digits }));
  };

  const buildPayload = () => ({
    voucherCode: formData.voucherCode.trim().toUpperCase(),
    voucherName: formData.voucherName.trim(),
    discountType: formData.discountType,
    discountValue: parseFloat(formData.discountValue),
    minOrderAmount: formData.minOrderAmount !== '' ? parseFloat(formData.minOrderAmount) : null,
    maxDiscountAmount: formData.discountType === 'PERCENTAGE' && formData.maxDiscountAmount !== ''
      ? parseFloat(formData.maxDiscountAmount) : null,
    quantity: parseInt(formData.quantity),
    startDate: toISODateTime(formData.startDate),
    endDate: toISODateTime(formData.endDate),
    status: formData.status,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const discountVal = parseFloat(formData.discountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      return toast.error('Giá trị giảm phải lớn hơn 0');
    }
    if (formData.discountType === 'PERCENTAGE' && discountVal > 100) {
      return toast.error('Giá trị giảm không được vượt quá 100%');
    }
    if (parseInt(formData.quantity) <= 0) {
      return toast.error('Số lượng phải lớn hơn 0');
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      return toast.error('Ngày kết thúc phải sau ngày bắt đầu');
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingVoucher) {
        await updateVoucherApi(editingVoucher.voucherId, payload, token);
        toast.success('Cập nhật voucher thành công!');
      } else {
        await createVoucherApi(payload, token);
        toast.success('Tạo voucher thành công!');
      }
      setIsModalOpen(false);
      fetchVouchers(currentPage);
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa voucher này?')) return;
    try {
      await deleteVoucherApi(id, token);
      toast.success('Đã xóa voucher');
      fetchVouchers(currentPage);
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa voucher');
    }
  };

  const formatPrice = (v) =>
    v != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '—';

  const formatVNDInput = (val) => {
    if (!val) return '';
    const digits = String(val).replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('vi-VN').format(digits);
  };

  const formatDate = (str) => {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('vi-VN');
  };

  const statusLabel = (s) => {
    if (s === 'ACTIVE') return { text: 'Hoạt động', cls: 'active' };
    if (s === 'INACTIVE') return { text: 'Tắt', cls: 'pending' };
    return { text: 'Hết hạn', cls: 'rejected' };
  };

  if (authLoading || !user || !isAdmin()) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Đang xác thực...</div>;
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-page-title">Quản lý Voucher</h2>
            <p className="admin-page-desc">Tạo và quản lý mã giảm giá tự động áp dụng cho đơn hàng.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
              <input
                type="text"
                className="admin-category-form-input"
                placeholder="Tìm mã, tên voucher..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: '280px', paddingLeft: '40px', margin: 0, height: '42px' }}
              />
            </div>
            <button className="admin-category-header-btn" onClick={() => handleOpenModal()}>
              + Thêm Voucher Mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên Voucher</th>
                  <th>Loại giảm</th>
                  <th>Điều kiện</th>
                  <th>Số lượng</th>
                  <th>Thời hạn</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="admin-empty-state">
                      <div className="spinner" style={{ margin: '0 auto' }}></div>
                      <p style={{ marginTop: '8px', color: '#94a3b8' }}>Đang tải...</p>
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="admin-empty-state">
                      <div className="empty-content">
                        <span className="material-symbols-outlined empty-icon">local_activity</span>
                        <p>Chưa có voucher nào.</p>
                      </div>
                    </td>
                  </tr>
                ) : vouchers.map(v => {
                  const sl = statusLabel(v.status);
                  return (
                    <tr key={v.voucherId}>
                      <td>
                        <span className="voucher-code-badge">
                          {v.voucherCode}
                        </span>
                      </td>
                      <td>
                        <div className="text-strong">{v.voucherName}</div>
                      </td>
                      <td>
                        {v.discountType === 'PERCENTAGE' ? (
                          <div>
                            <span className="text-danger-bold">-{v.discountValue}%</span>
                            {v.maxDiscountAmount && (
                              <div className="text-muted-smaller">
                                Tối đa {formatPrice(v.maxDiscountAmount)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-danger-bold">-{formatPrice(v.discountValue)}</span>
                        )}
                      </td>
                      <td>
                        {v.minOrderAmount
                          ? <span className="text-normal-small">Đơn từ {formatPrice(v.minOrderAmount)}</span>
                          : <span className="text-muted-small">Không giới hạn</span>
                        }
                      </td>
                      <td>
                        <div className="text-normal-small">
                          <span className="font-semibold">{v.usedQuantity}</span>
                          <span className="text-muted-light"> / {v.quantity}</span>
                        </div>
                        <div className="voucher-progress-bar-bg">
                          <div className="voucher-progress-bar-fill" style={{ width: `${Math.min(100, (v.usedQuantity / v.quantity) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="text-normal-small-12">
                        <div>{formatDate(v.startDate)}</div>
                        <div className="text-muted-light">→ {formatDate(v.endDate)}</div>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${sl.cls}`}>{sl.text}</span>
                      </td>
                      <td>
                        <div className="admin-actions justify-center">
                          <button
                            className="admin-action-btn edit"
                            onClick={() => handleOpenModal(v)}
                            title="Sửa"
                          >
                            <span className="material-symbols-outlined">edit</span>
                            Sửa
                          </button>
                          <button
                            className="admin-action-btn reject"
                            onClick={() => handleDelete(v.voucherId)}
                            title="Xóa"
                          >
                            <span className="material-symbols-outlined">delete</span>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <button
              className="admin-pagination-arrow-btn"
              disabled={currentPage === 0}
              onClick={() => fetchVouchers(currentPage - 1, debouncedKeyword)}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span style={{ lineHeight: '36px', fontSize: '14px', color: '#475569' }}>
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              className="admin-pagination-arrow-btn"
              disabled={currentPage >= totalPages - 1}
              onClick={() => fetchVouchers(currentPage + 1, debouncedKeyword)}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="admin-category-modal-overlay" onClick={() => !submitting && setIsModalOpen(false)}>
            <div
              className="admin-category-modal admin-voucher-modal"
              onClick={e => e.stopPropagation()}
            >
              <div className="admin-category-modal-header">
                <h3 className="admin-category-modal-title">
                  {editingVoucher ? 'Cập nhật Voucher' : 'Thêm Voucher Mới'}
                </h3>
                <button className="admin-category-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
              </div>

              <form onSubmit={handleSubmit} className="admin-voucher-form">

                {/* Code + Name */}
                <div className="flex-row-gap-12">
                  <div className="admin-category-form-group form-group-flex-1">
                    <label className="admin-category-form-label">Mã Voucher (*)</label>
                    <input
                      type="text" name="voucherCode"
                      className="admin-category-form-input"
                      value={formData.voucherCode}
                      onChange={handleChange}
                      placeholder="VD: SUMMER30"
                      maxLength={30} required
                      disabled={!!editingVoucher}
                      className={`admin-category-form-input uppercase`}
                    />
                  </div>
                  <div className="admin-category-form-group form-group-flex-2">
                    <label className="admin-category-form-label">Tên Voucher (*)</label>
                    <input
                      type="text" name="voucherName"
                      className="admin-category-form-input"
                      value={formData.voucherName}
                      onChange={handleChange}
                      placeholder="VD: Giảm 30% mùa hè"
                      required
                    />
                  </div>
                </div>

                {/* Discount type + value */}
                <div className="flex-row-gap-12">
                  <div className="admin-category-form-group form-group-flex-1">
                    <label className="admin-category-form-label">Loại giảm giá (*)</label>
                    <select
                      name="discountType"
                      className="admin-category-form-input"
                      value={formData.discountType}
                      onChange={handleChange}
                      disabled={!!editingVoucher}
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
                    </select>
                  </div>
                  <div className="admin-category-form-group form-group-flex-1">
                    <label className="admin-category-form-label">
                      Giá trị giảm (*) {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₫)'}
                    </label>
                    <input
                      type={formData.discountType === 'PERCENTAGE' ? "number" : "text"}
                      name="discountValue"
                      className="admin-category-form-input"
                      value={formData.discountType === 'PERCENTAGE' ? formData.discountValue : formatVNDInput(formData.discountValue)}
                      onChange={formData.discountType === 'PERCENTAGE' ? handleChange : handleMoneyChange}
                      min={formData.discountType === 'PERCENTAGE' ? "0.01" : undefined}
                      step={formData.discountType === 'PERCENTAGE' ? "0.01" : undefined}
                      placeholder={formData.discountType === 'PERCENTAGE' ? 'VD: 30' : 'VD: 50.000'}
                      required
                      disabled={!!editingVoucher}
                    />
                  </div>
                </div>

                {/* Min order + Max discount */}
                <div className="flex-row-gap-12">
                  <div className="admin-category-form-group form-group-flex-1">
                    <label className="admin-category-form-label">Đơn tối thiểu (₫)</label>
                    <input
                      type="text" name="minOrderAmount"
                      className="admin-category-form-input"
                      value={formatVNDInput(formData.minOrderAmount)}
                      onChange={handleMoneyChange}
                      placeholder="Để trống = không giới hạn"
                    />
                  </div>
                  {formData.discountType === 'PERCENTAGE' && (
                    <div className="admin-category-form-group form-group-flex-1">
                      <label className="admin-category-form-label">Giảm tối đa (₫)</label>
                      <input
                        type="text" name="maxDiscountAmount"
                        className="admin-category-form-input"
                        value={formatVNDInput(formData.maxDiscountAmount)}
                        onChange={handleMoneyChange}
                        placeholder="Để trống = không giới hạn"
                      />
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="admin-category-form-group form-group-no-margin">
                  <label className="admin-category-form-label">Số lượng voucher (*)</label>
                  <input
                    type="number" name="quantity"
                    className="admin-category-form-input"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1" required
                    placeholder="VD: 100"
                  />
                </div>

                {/* Date range */}
                <div className="flex-row-gap-12">
                  <div className="admin-category-form-group form-group-flex-1">
                    <label className="admin-category-form-label">Ngày bắt đầu (*)</label>
                    <input
                      type="datetime-local" name="startDate"
                      className="admin-category-form-input"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="admin-category-form-group form-group-flex-1">
                    <label className="admin-category-form-label">Ngày kết thúc (*)</label>
                    <input
                      type="datetime-local" name="endDate"
                      className="admin-category-form-input"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="admin-category-form-group form-group-no-margin">
                  <label className="admin-category-form-label">Trạng thái (*)</label>
                  <select
                    name="status"
                    className="admin-category-form-input"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tắt</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="admin-voucher-form-actions">
                  <button 
                    type="button"
                    className="admin-modal-cancel-btn"
                    onClick={() => setIsModalOpen(false)} 
                    disabled={submitting}
                  >
                    HỦY BỎ
                  </button>
                  <button 
                    type="submit"
                    className="admin-modal-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? 'ĐANG LƯU...' : (editingVoucher ? 'CẬP NHẬT' : 'TẠO VOUCHER')}
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

export default AdminVoucherPage;
