import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminCategory } from '../../hooks/useAdminCategory';
import AdminLayout from '../../layouts/AdminLayout';
import './AdminPage.css';

function AdminCategoryPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const {
    categories, loading, error, success,
    showAddForm, setShowAddForm,
    isSubmitting, editMode, expandedCats,
    formData, handleInputChange, handleImageChange, imagePreview, handleSubmit,
    handleEditClick, handleToggleStatus, handleCancelForm, toggleExpand,
    attrModalOpen, setAttrModalOpen, selectedCategory, attributes,
    newAttr, setNewAttr, attrLoading, openAttrModal, handleAddAttr, handleDeleteAttr,
    editingAttrId, editAttrData, setEditAttrData, handleEditAttrClick, handleCancelEditAttr, handleUpdateAttr,
    fetchCategories
  } = useAdminCategory(token);

  const [searchTerm, setSearchTerm] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const parentDropdownRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (parentDropdownRef.current && !parentDropdownRef.current.contains(event.target)) {
        setShowParentDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeAccents = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  const getFilteredCategoryOptions = () => {
    let result = [];

    const searchTerms = removeAccents(parentSearch).split(' ').filter(Boolean);

    const isMatch = (text) => {
      if (searchTerms.length === 0) return true;
      const normalizedText = removeAccents(text);
      return searchTerms.every(term => normalizedText.includes(term));
    };

    const buildTree = (parentId, level, forceIncludeAll) => {
      const children = categories.filter(c => c.parentId === parentId);
      children.forEach(child => {
        const match = isMatch(child.categoryName);

        const hasMatchingDescendant = checkDescendantMatch(child.categoryId);

        if (match || hasMatchingDescendant || forceIncludeAll) {
          result.push({
            ...child,
            level: level,
            isChild: level > 0
          });

          // If this child matches directly, force all its descendants to show
          buildTree(child.categoryId, level + 1, forceIncludeAll || match);
        }
      });
    };

    const checkDescendantMatch = (parentId) => {
      const children = categories.filter(c => c.parentId === parentId);
      for (let child of children) {
        if (isMatch(child.categoryName) || checkDescendantMatch(child.categoryId)) {
          return true;
        }
      }
      return false;
    };

    buildTree(null, 0, false);
    return result;
  };

  const selectedParentName = formData.parentId
    ? categories.find(c => c.categoryId === Number(formData.parentId))?.categoryName
    : '-- Không có (Danh mục gốc) --';

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isAdmin()) navigate('/customer');
      else fetchCategories();
    }
  }, [user, authLoading, isAdmin, navigate, fetchCategories]);

  const renderCategoryRows = (cat, level = 0, isSearchMode = false) => {
    const children = categories.filter(c => c.parentId === cat.categoryId);
    const hasChildren = children.length > 0 && !isSearchMode;
    const isExpanded = expandedCats[cat.categoryId];

    const rows = [
      <tr key={cat.categoryId}>
        <td className="admin-category-tree-cell" style={{ paddingLeft: `${24 + level * 20}px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasChildren ? (
              <span
                className="material-symbols-outlined admin-category-tree-icon"
                onClick={() => toggleExpand(cat.categoryId)}
              >
                {isExpanded ? 'expand_more' : 'chevron_right'}
              </span>
            ) : (
              <span className="admin-category-tree-spacer"></span>
            )}
            {cat.categoryName} {isSearchMode && cat.parentId ? <span style={{ fontSize: '12px', color: '#94a3b8' }}>(Danh mục con)</span> : ''}
          </div>
        </td>
        <td style={{ textAlign: 'center' }}>
          {cat.hasImage ? (
            <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', margin: '0 auto', border: '1px solid #e2e8f0' }}>
              <img
                src={`http://localhost:8080/api/categories/public/${cat.categoryId}/image`}
                alt={cat.categoryName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>-</span>
          )}
        </td>
        <td>
          {cat.status === 'ACTIVE'
            ? <span className="admin-status-badge">Hoạt động</span>
            : <span className="admin-status-badge inactive">Đã ẩn</span>}
        </td>
        <td>{cat.description || '-'}</td>
        <td>
          <div className="admin-actions center">
            <button className="admin-action-btn attr-btn" onClick={() => openAttrModal(cat)} title="Quản lý thuộc tính">
              <span className="material-symbols-outlined">list_alt</span> Thuộc tính
            </button>
            <button className="admin-action-btn approve" onClick={() => handleEditClick(cat)}>
              <span className="material-symbols-outlined">edit</span> Sửa
            </button>
            <button className="admin-action-btn reject" onClick={() => handleToggleStatus(cat)}>
              {cat.status === 'ACTIVE' ? (
                <><span className="material-symbols-outlined">visibility_off</span> Ẩn</>
              ) : (
                <><span className="material-symbols-outlined">visibility</span> Hiện</>
              )}
            </button>
          </div>
        </td>
      </tr>
    ];

    if (hasChildren && isExpanded && !isSearchMode) {
      children.forEach(child => {
        rows.push(...renderCategoryRows(child, level + 1, isSearchMode));
      });
    }

    return rows;
  };

  if (authLoading || !user || !isAdmin()) {
    return <div className="admin-loading-container">Đang tải...</div>;
  }

  return (
    <AdminLayout>
      {error && <div className="admin-alert error">{error}</div>}
      {success && <div className="admin-alert success">{success}</div>}

      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Quản lý Thể loại (Danh mục)</h2>
          <p className="admin-page-desc">Tạo và quản lý các danh mục sản phẩm trên sàn.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>search</span>
            <input
              type="text"
              className="admin-category-form-input"
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '280px', paddingLeft: '40px', margin: 0, height: '42px' }}
            />
          </div>
          <button className="admin-category-header-btn" onClick={showAddForm ? handleCancelForm : () => setShowAddForm(true)}>
            {showAddForm ? 'Quay lại danh sách' : '+ Thêm danh mục'}
          </button>
        </div>
      </div>

      {showAddForm ? (
        <div className="admin-table-card admin-category-form-container">
          <h3 className="admin-category-form-title">{editMode ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h3>
          <form onSubmit={handleSubmit} className="admin-category-form">
            <div className="admin-category-form-group">
              <label className="admin-category-form-label">Tên danh mục (*)</label>
              <input type="text" name="categoryName" value={formData.categoryName} onChange={handleInputChange} required className="admin-category-form-input" />
            </div>
            <div className="admin-category-form-group">
              <label className="admin-category-form-label">Danh mục cha (Tùy chọn)</label>
              <div className="custom-combobox" ref={parentDropdownRef}>
                <div
                  className="custom-combobox-input-wrapper"
                  onClick={() => setShowParentDropdown(true)}
                >
                  <input
                    type="text"
                    className="admin-category-form-input custom-combobox-input"
                    placeholder="Tìm hoặc chọn danh mục cha..."
                    value={showParentDropdown ? parentSearch : (selectedParentName || '')}
                    onChange={(e) => {
                      setParentSearch(e.target.value);
                      setShowParentDropdown(true);
                    }}
                  />
                  <span className="material-symbols-outlined combobox-icon">arrow_drop_down</span>
                </div>

                {showParentDropdown && (
                  <div className="custom-combobox-list">
                    <div
                      className="custom-combobox-item"
                      onClick={() => {
                        handleInputChange({ target: { name: 'parentId', value: '' } });
                        setShowParentDropdown(false);
                        setParentSearch('');
                      }}
                    >
                      -- Không có (Danh mục gốc) --
                    </div>
                    {getFilteredCategoryOptions().map(cat => (
                      <div
                        key={cat.categoryId}
                        className={`custom-combobox-item ${cat.isChild ? 'is-child' : 'is-parent'}`}
                        style={{ paddingLeft: `${cat.level * 20 + 14}px` }}
                        onClick={() => {
                          handleInputChange({ target: { name: 'parentId', value: cat.categoryId } });
                          setShowParentDropdown(false);
                          setParentSearch('');
                        }}
                      >
                        {cat.isChild ? <>{'-- '.repeat(cat.level)}{cat.categoryName}</> : cat.categoryName}
                      </div>
                    ))}
                    {getFilteredCategoryOptions().length === 0 && (
                      <div className="custom-combobox-empty">Không tìm thấy danh mục phù hợp</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="admin-category-form-group">
              <label className="admin-category-form-label">Trạng thái</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="admin-category-form-select">
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Ẩn (INACTIVE)</option>
              </select>
            </div>
            <div className="admin-category-form-group full-width" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="admin-category-form-label">Hình ảnh danh mục (Tùy chọn)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="admin-category-form-input"
                />
              </div>
              {imagePreview && (
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
            <div className="admin-category-form-group full-width">
              <label className="admin-category-form-label">Mô tả</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="admin-category-form-textarea"></textarea>
            </div>
            <div className="admin-category-form-group full-width">
              <button type="submit" disabled={isSubmitting} className="admin-category-form-submit">
                {isSubmitting ? 'ĐANG LƯU...' : 'LƯU DANH MỤC'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="admin-table-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên Danh Mục</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Hình ảnh</th>
                  <th>Trạng thái</th>
                  <th>Mô tả</th>
                  <th className="admin-table-col-action-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="admin-empty-state">Đang tải danh mục...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-empty-state">Chưa có danh mục nào.</td>
                  </tr>
                ) : searchTerm ? (
                  categories
                    .filter(c => c.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(matchCat => renderCategoryRows(matchCat, 0, true))
                ) : (
                  categories
                    .filter(c => !c.parentId)
                    .map(rootCat => renderCategoryRows(rootCat, 0, false))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attribute Management Modal */}
      {attrModalOpen && selectedCategory && (
        <div className="admin-category-modal-overlay">
          <div className="admin-category-modal">
            <div className="admin-category-modal-header">
              <h3 className="admin-category-modal-title">Thuộc tính: <span>{selectedCategory.categoryName}</span></h3>
              <button onClick={() => setAttrModalOpen(false)} className="admin-category-modal-close">&times;</button>
            </div>

            <form onSubmit={handleAddAttr} className="admin-category-attr-form">
              <div className="admin-category-attr-input-group">
                <label className="admin-category-attr-label">Tên thuộc tính (*)</label>
                <input
                  type="text"
                  value={newAttr.attrName}
                  onChange={e => setNewAttr({ ...newAttr, attrName: e.target.value })}
                  placeholder="Ví dụ: RAM, Màn hình, CPU..."
                  className="admin-category-attr-input"
                  required
                />
              </div>
              <div className="admin-category-attr-checkbox-group">
                <label className="admin-category-attr-checkbox-label">
                  <input
                    type="checkbox"
                    checked={newAttr.isRequired}
                    onChange={e => setNewAttr({ ...newAttr, isRequired: e.target.checked })}
                    className="admin-category-attr-checkbox"
                  /> Bắt buộc nhập
                </label>
              </div>
              <button type="submit" disabled={attrLoading} className="admin-category-attr-btn">
                <span className="material-symbols-outlined icon-18">add</span> Thêm
              </button>
            </form>

            <div className="admin-category-attr-list-title">Danh sách Thuộc tính</div>

            {attrLoading && attributes.length === 0 ? (
              <div className="admin-category-attr-loading">Đang tải dữ liệu...</div>
            ) : attributes.length === 0 ? (
              <div className="admin-category-attr-empty">
                <span className="material-symbols-outlined admin-category-attr-empty-icon">inventory_2</span>
                <p>Danh mục này chưa có thuộc tính kỹ thuật nào.</p>
              </div>
            ) : (
              <div className="admin-category-attr-table-container">
                <table className="admin-category-attr-table">
                  <thead>
                    <tr>
                      <th>TÊN THUỘC TÍNH</th>
                      <th>LOẠI</th>
                      <th className="admin-table-col-action">XÓA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attributes.map((attr) => (
                      <tr key={attr.attrId}>
                        {editingAttrId === attr.attrId ? (
                          <>
                            <td>
                              <input
                                type="text"
                                value={editAttrData.attrName}
                                onChange={e => setEditAttrData({ ...editAttrData, attrName: e.target.value })}
                                className="admin-category-attr-input admin-category-attr-input-small"
                                autoFocus
                              />
                            </td>
                            <td>
                              <label className="admin-category-attr-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={editAttrData.isRequired}
                                  onChange={e => setEditAttrData({ ...editAttrData, isRequired: e.target.checked })}
                                  className="admin-category-attr-checkbox"
                                /> Bắt buộc
                              </label>
                            </td>
                            <td className="admin-category-attr-action-cell">
                              <button
                                onClick={handleUpdateAttr}
                                disabled={attrLoading}
                                className="admin-category-attr-icon-btn save"
                                title="Lưu"
                              >
                                <span className="material-symbols-outlined icon-18">save</span>
                              </button>
                              <button
                                onClick={handleCancelEditAttr}
                                className="admin-category-attr-icon-btn delete"
                                title="Hủy"
                              >
                                <span className="material-symbols-outlined icon-18">close</span>
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="admin-category-attr-name">{attr.attrName}</td>
                            <td>
                              {attr.isRequired ? (
                                <span className="admin-category-attr-badge-required">Bắt buộc</span>
                              ) : (
                                <span className="admin-category-attr-badge-optional">Tùy chọn</span>
                              )}
                            </td>
                            <td className="admin-category-attr-action-cell">
                              <button
                                onClick={() => handleEditAttrClick(attr)}
                                disabled={attrLoading}
                                className="admin-category-attr-icon-btn edit"
                                title="Sửa thuộc tính"
                              >
                                <span className="material-symbols-outlined icon-18">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAttr(attr.attrId)}
                                disabled={attrLoading}
                                className="admin-category-attr-icon-btn delete"
                                title="Xóa thuộc tính này"
                              >
                                <span className="material-symbols-outlined icon-18">delete</span>
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

export default AdminCategoryPage;
