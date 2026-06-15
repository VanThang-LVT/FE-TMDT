import React, { useState, useEffect } from 'react';
import './Modal.css';

const PromptModal = ({ isOpen, title, label, placeholder, onConfirm, onCancel, confirmText = "Xác nhận", cancelText = "Huỷ", type = "danger" }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(inputValue);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={handleCancel}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="modal-body">
          {label && <label className="modal-label">{label}</label>}
          <textarea 
            className="modal-textarea" 
            placeholder={placeholder} 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={4}
            autoFocus
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>{cancelText}</button>
          <button 
            className={`btn btn-${type}`} 
            onClick={handleConfirm} 
            disabled={!inputValue.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
