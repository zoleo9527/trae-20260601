import React, { useState } from 'react';

function CreateBillModal({ constants, onConfirm, onCancel }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    route: 'A路线',
    deliveryPerson: '李师傅',
    month: new Date().toISOString().slice(0, 7),
    milkTypes: [
      { name: '鲜牛奶', quantity: 30, price: 8.00, amount: 240.00 }
    ],
    bottleReturned: 0,
    bottlePending: 0,
    assignee: '王文员',
    assigneeRole: 'clerk'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMilkTypeChange = (index, field, value) => {
    const newMilkTypes = [...formData.milkTypes];
    newMilkTypes[index][field] = field === 'name' ? value : Number(value);
    if (field === 'quantity' || field === 'price') {
      newMilkTypes[index].amount = newMilkTypes[index].quantity * newMilkTypes[index].price;
    }
    setFormData({ ...formData, milkTypes: newMilkTypes });
  };

  const addMilkType = () => {
    setFormData({
      ...formData,
      milkTypes: [...formData.milkTypes, { name: '', quantity: 0, price: 0, amount: 0 }]
    });
  };

  const removeMilkType = (index) => {
    const newMilkTypes = formData.milkTypes.filter((_, i) => i !== index);
    setFormData({ ...formData, milkTypes: newMilkTypes });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  if (!constants || !constants.roleLabels) return null;

  const { roleLabels: ROLE_LABELS = {} } = constants;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>新建月结账单</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
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
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>配送路线</label>
              <select name="route" value={formData.route} onChange={handleChange}>
                <option value="A路线">A路线</option>
                <option value="B路线">B路线</option>
                <option value="C路线">C路线</option>
              </select>
            </div>
            <div className="form-group">
              <label>配送员</label>
              <select name="deliveryPerson" value={formData.deliveryPerson} onChange={handleChange}>
                <option value="李师傅">李师傅</option>
                <option value="赵师傅">赵师傅</option>
                <option value="孙师傅">孙师傅</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>月份 *</label>
            <input 
              type="month" 
              name="month"
              value={formData.month}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>奶品明细</label>
            {formData.milkTypes.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  placeholder="名称"
                  value={item.name}
                  onChange={e => handleMilkTypeChange(index, 'name', e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="数量"
                  value={item.quantity}
                  onChange={e => handleMilkTypeChange(index, 'quantity', e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="单价"
                  value={item.price}
                  step="0.01"
                  onChange={e => handleMilkTypeChange(index, 'price', e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="金额"
                  value={item.amount}
                  readOnly
                  style={{ background: '#f5f5f5' }}
                />
                <button 
                  type="button" 
                  className="btn btn-sm btn-danger"
                  onClick={() => removeMilkType(index)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  删除
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="btn btn-sm btn-default"
              onClick={addMilkType}
              style={{ marginTop: '8px' }}
            >
              + 添加奶品
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>已退回瓶子数</label>
              <input 
                type="number" 
                name="bottleReturned"
                value={formData.bottleReturned}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>待退回瓶子数</label>
              <input 
                type="number" 
                name="bottlePending"
                value={formData.bottlePending}
                onChange={handleChange}
                min="0"
              />
            </div>
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
              创建账单
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBillModal;
