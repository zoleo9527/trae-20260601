import React, { useState, useEffect } from 'react';

const COMPLAINT_TYPES = {
  billing_quantity: '计费数量异议',
  bottle_damage: '奶瓶损坏',
  bottle_return: '回瓶数量争议',
  delivery_quality: '配送质量问题',
  pricing_issue: '价格问题',
  other: '其他'
};

function CreateComplaintModal({ constants, prefillBill, onConfirm, onCancel }) {
  const [formData, setFormData] = useState({
    billId: null,
    billNo: null,
    customerName: '',
    customerPhone: '',
    address: '',
    type: 'billing_quantity',
    typeLabel: '计费数量异议',
    description: '',
    assignee: '张客服',
    assigneeRole: 'customer_service'
  });

  useEffect(() => {
    if (prefillBill) {
      setFormData({
        ...formData,
        billId: prefillBill.id,
        billNo: prefillBill.billNo,
        customerName: prefillBill.customerName,
        customerPhone: prefillBill.customerPhone,
        address: prefillBill.address
      });
    }
  }, [prefillBill]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };
    if (name === 'type') {
      updates.typeLabel = COMPLAINT_TYPES[value];
    }
    setFormData({ ...formData, ...updates });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  if (!constants || !constants.ROLE_LABELS) return null;

  const { ROLE_LABELS = {} } = constants;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>新建客户申诉</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {prefillBill && (
            <div className="form-group">
              <label>关联账单</label>
              <input 
                type="text" 
                value={prefillBill.billNo}
                readOnly
                style={{ background: '#f5f5f5' }}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>客户姓名 *</label>
            <input 
              type="text" 
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>联系电话</label>
            <input 
              type="text" 
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>地址</label>
            <input 
              type="text" 
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>申诉类型 *</label>
            <select name="type" value={formData.type} onChange={handleChange} required>
              {Object.entries(COMPLAINT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>问题描述 *</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="请详细描述问题..."
              required
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>负责人</label>
              <select name="assignee" value={formData.assignee} onChange={handleChange}>
                <option value="王文员">王文员</option>
                <option value="李配送">李配送</option>
                <option value="张客服">张客服</option>
              </select>
            </div>
            <div className="form-group">
              <label>角色</label>
              <select name="assigneeRole" value={formData.assigneeRole} onChange={handleChange}>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn btn-default" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建申诉
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateComplaintModal;
