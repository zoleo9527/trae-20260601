import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { delegationService } from '../../services/delegationService.js';
import './DelegationCreate.css';

function DelegationCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantOrganization: '',
    applicantContact: '',
    applicantIdCard: '',
    caseType: '',
    caseDescription: '',
    incidentDate: '',
    incidentLocation: '',
    appraisalItems: [],
    expectedCompletionDate: '',
    materials: []
  });

  const [materialInput, setMaterialInput] = useState({
    name: '',
    type: '',
    required: true
  });

  const [appraisalItemInput, setAppraisalItemInput] = useState('');

  const caseTypes = [
    '交通事故',
    '民事纠纷',
    '刑事案件',
    '医疗纠纷',
    '合同纠纷',
    '遗产纠纷',
    '其他'
  ];

  const materialTypes = [
    '官方文书',
    '证件',
    '鉴定材料',
    '影像资料',
    '医疗记录',
    '证明材料',
    '其他'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addMaterial = () => {
    if (!materialInput.name.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { ...materialInput }]
    }));
    setMaterialInput({ name: '', type: '', required: true });
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const addAppraisalItem = () => {
    if (!appraisalItemInput.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      appraisalItems: [...prev.appraisalItems, appraisalItemInput]
    }));
    setAppraisalItemInput('');
  };

  const removeAppraisalItem = (index) => {
    setFormData(prev => ({
      ...prev,
      appraisalItems: prev.appraisalItems.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.applicantName || !formData.caseType) {
      alert('请填写必填项');
      return;
    }

    try {
      setLoading(true);
      await delegationService.create(formData);
      navigate('/delegations');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delegation-create">
      <div className="page-header">
        <h1 className="page-title">新建委托单</h1>
        <p className="page-subtitle">填写委托单基本信息</p>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>委托方信息</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>委托方名称 <span className="required">*</span></label>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                placeholder="请输入委托方名称"
                required
              />
            </div>
            <div className="form-group">
              <label>委托方单位</label>
              <input
                type="text"
                name="applicantOrganization"
                value={formData.applicantOrganization}
                onChange={handleChange}
                placeholder="请输入委托方单位"
              />
            </div>
            <div className="form-group">
              <label>联系方式</label>
              <input
                type="text"
                name="applicantContact"
                value={formData.applicantContact}
                onChange={handleChange}
                placeholder="请输入联系电话"
              />
            </div>
            <div className="form-group">
              <label>证件号码</label>
              <input
                type="text"
                name="applicantIdCard"
                value={formData.applicantIdCard}
                onChange={handleChange}
                placeholder="请输入证件号码"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>案件信息</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>案件类型 <span className="required">*</span></label>
              <select
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                required
              >
                <option value="">请选择案件类型</option>
                {caseTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>事发时间</label>
              <input
                type="date"
                name="incidentDate"
                value={formData.incidentDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>事发地点</label>
              <input
                type="text"
                name="incidentLocation"
                value={formData.incidentLocation}
                onChange={handleChange}
                placeholder="请输入事发地点"
              />
            </div>
            <div className="form-group">
              <label>预计完成日期</label>
              <input
                type="date"
                name="expectedCompletionDate"
                value={formData.expectedCompletionDate}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label>案件描述</label>
            <textarea
              name="caseDescription"
              value={formData.caseDescription}
              onChange={handleChange}
              placeholder="请详细描述案件情况"
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>鉴定项目</h2>
          <div className="input-group">
            <input
              type="text"
              value={appraisalItemInput}
              onChange={(e) => setAppraisalItemInput(e.target.value)}
              placeholder="输入鉴定项目名称"
            />
            <button type="button" onClick={addAppraisalItem} className="add-btn">
              添加
            </button>
          </div>
          <div className="tags-list">
            {formData.appraisalItems.map((item, index) => (
              <span key={index} className="tag">
                {item}
                <button type="button" onClick={() => removeAppraisalItem(index)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>材料清单</h2>
          <div className="input-group">
            <input
              type="text"
              value={materialInput.name}
              onChange={(e) => setMaterialInput(prev => ({ ...prev, name: e.target.value }))}
              placeholder="材料名称"
            />
            <select
              value={materialInput.type}
              onChange={(e) => setMaterialInput(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">选择类型</option>
              {materialTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={materialInput.required}
                onChange={(e) => setMaterialInput(prev => ({ ...prev, required: e.target.checked }))}
              />
              必填
            </label>
            <button type="button" onClick={addMaterial} className="add-btn">
              添加
            </button>
          </div>
          <div className="materials-preview">
            {formData.materials.length === 0 ? (
              <div className="empty-hint">暂无材料，请添加</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>材料名称</th>
                    <th>类型</th>
                    <th>是否必填</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.materials.map((material, index) => (
                    <tr key={index}>
                      <td>{material.name}</td>
                      <td>{material.type || '其他'}</td>
                      <td>{material.required ? '是' : '否'}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="remove-btn"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/delegations')} className="cancel-btn">
            取消
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '创建中...' : '创建委托单'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DelegationCreate;
