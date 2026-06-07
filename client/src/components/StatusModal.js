import React, { useState } from 'react';

function StatusModal({ title, constants, defaultStatus, onConfirm, onCancel }) {
  const [newStatus, setNewStatus] = useState(defaultStatus || '');
  const [remark, setRemark] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ newStatus, remark });
  };

  if (!constants || !constants.statusLabels) return null;

  const { statusLabels: STATUS_LABELS = {} } = constants;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>目标状态</label>
            <select 
              value={newStatus} 
              onChange={e => setNewStatus(e.target.value)}
              required
            >
              <option value="">请选择状态</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>处理说明</label>
            <textarea 
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="请输入处理说明（可选）"
            />
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-default" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              确认
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StatusModal;
