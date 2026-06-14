import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { delegationService } from '../../services/delegationService.js';
import { STATUS_CONFIG, VERIFICATION_STATUS_CONFIG, ROLE_CONFIG } from '../../utils/constants.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './DelegationDetail.css';

function DelegationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [delegation, setDelegation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialVerificationStatus, setMaterialVerificationStatus] = useState('');
  const [materialIdToVerify, setMaterialIdToVerify] = useState(null);
  const [materialNotes, setMaterialNotes] = useState('');

  useEffect(() => {
    loadDelegation();
  }, [id]);

  const loadDelegation = async () => {
    try {
      setLoading(true);
      const response = await delegationService.getById(id);
      setDelegation(response.data);
    } catch (error) {
      console.error('Failed to load delegation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      await delegationService.updateStatus(id, newStatus, remarks);
      setShowActionModal(false);
      setRemarks('');
      await loadDelegation();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMaterialVerification = async (materialId, status) => {
    setMaterialIdToVerify(materialId);
    setMaterialVerificationStatus(status);
    setMaterialNotes('');
    setShowMaterialModal(true);
  };

  const submitMaterialVerification = async () => {
    try {
      setActionLoading(true);
      await delegationService.updateMaterialVerification(id, materialIdToVerify, materialVerificationStatus, materialNotes);
      setShowMaterialModal(false);
      setMaterialNotes('');
      await loadDelegation();
    } catch (error) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getAvailableActions = () => {
    if (!delegation || !user) return [];

    const statusActions = {
      'PENDING_ACCEPTANCE': user.role === 'acceptor' || user.role === 'admin' 
        ? [{ action: 'ACCEPTANCE_IN_PROGRESS', label: '开始受理' }] : [],
      'ACCEPTANCE_IN_PROGRESS': user.role === 'acceptor' || user.role === 'admin'
        ? [
            { action: 'MATERIAL_VERIFICATION', label: '提交材料核验' },
            { action: 'PENDING_ACCEPTANCE', label: '退回' }
          ] : [],
      'MATERIAL_VERIFICATION': user.role === 'appraiser' || user.role === 'admin'
        ? [
            { action: 'QC_REVIEW_PENDING', label: '提交质控审核' },
            { action: 'VERIFICATION_FAILED', label: '核验不通过' },
            { action: 'MATERIAL_INCOMPLETE', label: '标记缺材料' }
          ] : [],
      'VERIFICATION_FAILED': user.role === 'appraiser' || user.role === 'admin'
        ? [{ action: 'MATERIAL_VERIFICATION', label: '重新核验' }] : [],
      'MATERIAL_INCOMPLETE': user.role === 'appraiser' || user.role === 'admin'
        ? [{ action: 'MATERIAL_VERIFICATION', label: '材料已补充' }] : [],
      'QC_REVIEW_PENDING': user.role === 'qc_reviewer' || user.role === 'admin'
        ? [
            { action: 'QC_APPROVED', label: '审核通过' },
            { action: 'QC_REJECTED', label: '审核不通过' }
          ] : [],
      'QC_REJECTED': user.role === 'appraiser' || user.role === 'admin'
        ? [{ action: 'MATERIAL_VERIFICATION', label: '重新处理' }] : [],
      'QC_APPROVED': user.role === 'qc_reviewer' || user.role === 'admin'
        ? [{ action: 'COMPLETED', label: '完成鉴定' }] : [],
      'ON_HOLD': user.role === 'acceptor' || user.role === 'appraiser' || user.role === 'admin'
        ? [
            { action: 'PENDING_ACCEPTANCE', label: '重新受理' },
            { action: 'ACCEPTANCE_IN_PROGRESS', label: '继续受理' },
            { action: 'MATERIAL_VERIFICATION', label: '继续核验' }
          ] : []
    };

    return statusActions[delegation.status] || [];
  };

  const getStatusLabel = (status) => STATUS_CONFIG[status]?.label || status;
  const getStatusColor = (status) => STATUS_CONFIG[status]?.color || '#8c8c8c';
  const getRoleLabel = (role) => ROLE_CONFIG[role]?.label || role;

  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }

  if (!delegation) {
    return <div className="error-container">委托单不存在</div>;
  }

  const availableActions = getAvailableActions();

  return (
    <div className="delegation-detail">
      <div className="detail-header">
        <div>
          <h1 className="page-title">{delegation.delegation_number}</h1>
          <p className="page-subtitle">
            {delegation.applicant_name} - {delegation.case_type}
          </p>
        </div>
        <div className="header-actions">
          <span
            className="status-badge-large"
            style={{ backgroundColor: getStatusColor(delegation.status) }}
          >
            {getStatusLabel(delegation.status)}
          </span>
          {delegation.is_abnormal === 1 && (
            <span className="abnormal-badge">⚠️ {delegation.abnormal_type}</span>
          )}
        </div>
      </div>

      {delegation.is_abnormal === 1 && delegation.abnormal_reason && (
        <div className="abnormal-reason">
          <strong>异常原因：</strong>{delegation.abnormal_reason}
        </div>
      )}

      <div className="detail-content">
        <div className="info-section">
          <h2>基本信息</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>委托方名称：</label>
              <span>{delegation.applicant_name}</span>
            </div>
            <div className="info-item">
              <label>委托方单位：</label>
              <span>{delegation.applicant_organization}</span>
            </div>
            <div className="info-item">
              <label>联系方式：</label>
              <span>{delegation.applicant_contact}</span>
            </div>
            <div className="info-item">
              <label>证件号码：</label>
              <span>{delegation.applicant_id_card}</span>
            </div>
            <div className="info-item">
              <label>案件类型：</label>
              <span>{delegation.case_type}</span>
            </div>
            <div className="info-item">
              <label>事发地点：</label>
              <span>{delegation.incident_location}</span>
            </div>
            <div className="info-item">
              <label>事发时间：</label>
              <span>{delegation.incident_date}</span>
            </div>
            <div className="info-item">
              <label>预计完成：</label>
              <span>{delegation.expected_completion_date}</span>
            </div>
          </div>
          <div className="info-item full-width">
            <label>案件描述：</label>
            <span>{delegation.case_description}</span>
          </div>
          <div className="info-item full-width">
            <label>鉴定项目：</label>
            <div className="appraisal-items">
              {delegation.appraisal_items?.map((item, index) => (
                <span key={index} className="appraisal-tag">{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="info-section">
          <h2>材料清单</h2>
          <div className="materials-list">
            {delegation.materials?.length === 0 ? (
              <div className="empty-materials">暂无材料</div>
            ) : (
              delegation.materials?.map((material) => (
                <div key={material.id} className="material-item">
                  <div className="material-info">
                    <span className="material-name">
                      {material.is_required === 1 && <span className="required-mark">*</span>}
                      {material.material_name}
                    </span>
                    <span className="material-type">{material.material_type}</span>
                    {material.verification_status && material.verification_status !== 'pending' && (
                      <div className="material-verification-detail">
                        <span className="verification-result">
                          核验结果：
                          <span className={`verification-status ${material.verification_status}`}>
                            {material.verification_status === 'passed' ? '通过' : '不通过'}
                          </span>
                        </span>
                        {material.verified_by && (
                          <span className="verification-info">
                            核验人：{material.verified_by}
                          </span>
                        )}
                        {material.verified_at && (
                          <span className="verification-info">
                            核验时间：{new Date(material.verified_at).toLocaleString('zh-CN')}
                          </span>
                        )}
                        {material.verification_notes && (
                          <span className="verification-notes">
                            备注：{material.verification_notes}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="material-status">
                    <span className={`material-badge ${material.is_provided === 1 ? 'provided' : 'not-provided'}`}>
                      {material.is_provided === 1 ? '已提供' : '未提供'}
                    </span>
                    {delegation.status === 'MATERIAL_VERIFICATION' && 
                     (user.role === 'appraiser' || user.role === 'admin') && (
                      <div className="material-actions">
                        <button
                          onClick={() => handleMaterialVerification(material.id, 'passed')}
                          disabled={actionLoading}
                          className="verify-btn passed"
                        >
                          ✓ 通过
                        </button>
                        <button
                          onClick={() => handleMaterialVerification(material.id, 'failed')}
                          disabled={actionLoading}
                          className="verify-btn failed"
                        >
                          ✗ 不通过
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {availableActions.length > 0 && (
          <div className="info-section">
            <h2>操作</h2>
            <div className="actions">
              {availableActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => {
                    setActionType(action.action);
                    setShowActionModal(true);
                  }}
                  className="action-button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="info-section">
          <h2>处理时间线</h2>
          <div className="timeline">
            {delegation.audit_logs?.length === 0 ? (
              <div className="empty-timeline">暂无处理记录</div>
            ) : (
              delegation.audit_logs?.map((log, index) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-action">
                        {log.action_type === 'VERIFY' ? `材料核验 - ${log.details?.materialName || ''}` : log.action_type}
                        {log.action_type === 'VERIFY' && log.details?.status && (
                          <span className={`verification-badge ${log.details.status}`}>
                            {log.details.status === 'passed' ? '通过' : '不通过'}
                          </span>
                        )}
                      </span>
                      <span className="timeline-time">
                        {new Date(log.operate_time).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="timeline-details">
                      <span className="timeline-operator">
                        {log.operator_name} ({getRoleLabel(log.operator_role)})
                      </span>
                      {log.remarks && <span className="timeline-remarks">{log.remarks}</span>}
                      {log.action_type === 'VERIFY' && log.details?.status && (
                        <div className="timeline-verification-details">
                          <span className="verification-detail-item">
                            核验结果：<strong className={log.details.status === 'passed' ? 'text-success' : 'text-error'}>
                              {log.details.status === 'passed' ? '通过' : '不通过'}
                            </strong>
                          </span>
                          {log.details.notes && (
                            <span className="verification-detail-item">
                              核验备注：{log.details.notes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {log.previous_status && log.new_status && (
                      <div className="timeline-status-change">
                        {getStatusLabel(log.previous_status)} → {getStatusLabel(log.new_status)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showActionModal && (
        <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认操作</h3>
            </div>
            <div className="modal-body">
              <p>确定要将状态变更为 "<strong>{getStatusLabel(actionType)}</strong>" 吗？</p>
              <div className="form-group">
                <label>备注（可选）：</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="请输入备注信息"
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowActionModal(false)}
                className="cancel-button"
                disabled={actionLoading}
              >
                取消
              </button>
              <button
                onClick={() => handleStatusChange(actionType)}
                className="confirm-button"
                disabled={actionLoading}
              >
                {actionLoading ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>材料核验</h3>
            </div>
            <div className="modal-body">
              <p>
                核验结果：<strong style={{color: materialVerificationStatus === 'passed' ? '#52c41a' : '#ff4d4f'}}>
                  {materialVerificationStatus === 'passed' ? '通过' : '不通过'}
                </strong>
              </p>
              <div className="form-group">
                <label>核验备注（必填）：</label>
                <textarea
                  value={materialNotes}
                  onChange={(e) => setMaterialNotes(e.target.value)}
                  placeholder="请输入核验备注，如：材料完整、清晰可辨、符合要求等"
                  rows="4"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowMaterialModal(false)}
                className="cancel-button"
                disabled={actionLoading}
              >
                取消
              </button>
              <button
                onClick={submitMaterialVerification}
                className="confirm-button"
                disabled={actionLoading || !materialNotes.trim()}
              >
                {actionLoading ? '处理中...' : '确认核验'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DelegationDetail;
