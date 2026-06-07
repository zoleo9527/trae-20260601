import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDate, getRoleLabel } from '../utils';
import HistoryList from '../components/HistoryList';
import StatusModal from '../components/StatusModal';

const DEFAULT_STATUS_LABELS = {
  pending: '待处理',
  processing: '处理中',
  returned: '已退回',
  supplement_needed: '待补材料',
  closed: '已关闭',
  urged: '有人催'
};

const DEFAULT_ROLE_LABELS = {
  clerk: '站点文员',
  delivery: '配送员',
  customer_service: '客服',
  customer: '客户',
  system: '系统'
};

function ComplaintDetail({ constants, loading: constantsLoading }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceName, setEvidenceName] = useState('');
  const [showBillHistory, setShowBillHistory] = useState(false);

  const { statusLabels: STATUS_LABELS = DEFAULT_STATUS_LABELS, roleLabels: ROLE_LABELS = DEFAULT_ROLE_LABELS } = constants || {};

  const safeGetRoleLabel = (role) => {
    if (!role) return '-';
    return ROLE_LABELS[role] || DEFAULT_ROLE_LABELS[role] || role;
  };

  const safeGetStatusLabel = (status) => {
    if (!status) return '-';
    return STATUS_LABELS[status] || DEFAULT_STATUS_LABELS[status] || status;
  };

  const fetchComplaint = () => {
    setLoading(true);
    setLoadError(null);
    fetch(`/api/complaints/${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setComplaint(data || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('加载申诉详情失败:', err);
        setLoadError(err.message);
        setComplaint(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleStatusUpdate = (action) => {
    setStatusAction(action);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async ({ newStatus, remark }) => {
    const actionMap = {
      process: '开始处理',
      return: '退回',
      supplement: '要求补材料',
      urge: '催促',
      close: '关闭'
    };

    const res = await fetch(`/api/complaints/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: actionMap[statusAction] || '状态更新',
        newStatus,
        remark,
        operator: '张客服',
        operatorRole: 'customer_service'
      })
    });
    
    if (res.ok) {
      setShowStatusModal(false);
      fetchComplaint();
    }
  };

  const handleAddEvidence = async () => {
    if (!evidenceName.trim()) return;
    
    const res = await fetch(`/api/complaints/${id}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: evidenceName })
    });
    
    if (res.ok) {
      setShowEvidenceModal(false);
      setEvidenceName('');
      fetchComplaint();
    }
  };

  if (loading && !loadError) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontSize: '16px', color: '#666' }}>正在加载申诉详情...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="card">
        <div style={{ 
          padding: '24px', 
          background: '#ffebee', 
          border: '1px solid #ef9a9a', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>❌</div>
          <div style={{ fontSize: '16px', color: '#c62828', fontWeight: 500, marginBottom: '8px' }}>
            申诉加载失败
          </div>
          <div style={{ color: '#e57373', marginBottom: '16px' }}>({loadError})</div>
          <button className="btn btn-primary" onClick={fetchComplaint}>
            🔄 重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
        <div style={{ fontSize: '16px', color: '#666' }}>申诉不存在</div>
        <button className="btn btn-default" style={{ marginTop: '16px' }} onClick={() => navigate('/complaints')}>
          返回申诉列表
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/complaints">客户申诉</Link>
        <span className="separator">/</span>
        <span className="current">{complaint.complaintNo}</span>
      </div>

      <div className="page-header">
        <div>
          <h2>
            {complaint.complaintNo} - {complaint.typeLabel}
            <span 
              className={`status-badge status-${complaint.status}`} 
              style={{ marginLeft: '12px' }}
            >
              {STATUS_LABELS[complaint.status]}
            </span>
          </h2>
          <p style={{ color: '#888', marginTop: '4px' }}>
            客户：{complaint.customerName} | 创建时间：{formatDate(complaint.createdAt)}
          </p>
        </div>
        <div className="action-bar">
          {complaint.status !== 'closed' && (
            <>
              <button className="btn btn-success" onClick={() => handleStatusUpdate('process')}>
                开始处理
              </button>
              <button className="btn btn-warning" onClick={() => handleStatusUpdate('return')}>
                退回
              </button>
              <button className="btn btn-warning" onClick={() => handleStatusUpdate('supplement')}>
                要求补材料
              </button>
              <button className="btn btn-danger" onClick={() => handleStatusUpdate('urge')}>
                标记催促
              </button>
              <button className="btn btn-primary" onClick={() => setShowEvidenceModal(true)}>
                补充材料
              </button>
              <button className="btn btn-default" onClick={() => handleStatusUpdate('close')}>
                关闭
              </button>
            </>
          )}
          <button className="btn btn-default" onClick={() => navigate('/complaints')}>
            返回列表
          </button>
        </div>
      </div>

      {complaint.relatedBill && (
        <div className="card" style={{ background: '#e3f2fd', border: '1px solid #90caf9' }}>
          <h3 className="section-title" style={{ borderBottomColor: '#90caf9' }}>
            🔗 关联的月结账单
          </h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">账单编号</span>
              <span className="detail-value">
                <button 
                  className="link-btn"
                  onClick={() => navigate(`/bills/${complaint.relatedBill.id}`)}
                >
                  {complaint.relatedBill.billNo}
                </button>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账单月份</span>
              <span className="detail-value">{complaint.relatedBill.month || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账单金额</span>
              <span className="detail-value" style={{ color: '#e53935', fontWeight: 600 }}>
                ¥{Number(complaint.relatedBill.totalAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账单状态</span>
              <span className="detail-value">
                <span className={`status-badge status-${complaint.relatedBill.status || 'pending'}`}>
                  {safeGetStatusLabel(complaint.relatedBill.status)}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账单负责人</span>
              <span className="detail-value">
                {complaint.relatedBill.assignee ? (
                  <div className="assignee-info">
                    <span className="assignee-avatar">{(complaint.relatedBill.assignee || '-').charAt(0)}</span>
                    <div>
                      <div>{complaint.relatedBill.assignee}</div>
                      <span className="assignee-role">
                        {safeGetRoleLabel(complaint.relatedBill.assigneeRole)}
                      </span>
                    </div>
                  </div>
                ) : '-'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">账单当前处理人</span>
              <span className="detail-value">
                {complaint.relatedBill.currentHandler ? (
                  <div className="assignee-info">
                    <span className="assignee-avatar">{(complaint.relatedBill.currentHandler || '-').charAt(0)}</span>
                    <div>
                      <div>{complaint.relatedBill.currentHandler}</div>
                      <span className="assignee-role">
                        {safeGetRoleLabel(complaint.relatedBill.currentHandlerRole)}
                      </span>
                    </div>
                  </div>
                ) : '-'}
              </span>
            </div>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <button 
              className="btn btn-sm btn-default"
              onClick={() => setShowBillHistory(!showBillHistory)}
            >
              {showBillHistory ? '▼ 收起账单历史' : '▶ 查看账单历史记录'}
            </button>
          </div>
          
          {showBillHistory && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'white', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#1565c0' }}>
                📋 账单处理历史记录
              </h4>
              <HistoryList history={complaint.relatedBill.history} constants={constants} />
            </div>
          )}
          
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
            <strong>💡 提示：</strong>
            点击账单编号可跳转到账单详情页，页面跳转时会自动关联上下文信息，不会丢失责任人和历史说明。
          </div>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          基本信息
        </button>
        <button 
          className={`tab ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          证据材料 ({complaint.evidences?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          处理历史
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <h3 className="section-title">客户信息</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">客户姓名</span>
              <span className="detail-value">{complaint.customerName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">联系电话</span>
              <span className="detail-value">{complaint.customerPhone}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">地址</span>
              <span className="detail-value">{complaint.address}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">申诉类型</span>
              <span className="detail-value">{complaint.typeLabel}</span>
            </div>
          </div>

          <h3 className="section-title" style={{ marginTop: '24px' }}>问题描述</h3>
          <div className="card" style={{ background: '#fafafa', marginBottom: 0 }}>
            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
          </div>

          <h3 className="section-title" style={{ marginTop: '24px' }}>处理信息</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">负责人</span>
              <span className="detail-value">
                {complaint.assignee ? (
                  <div className="assignee-info">
                    <span className="assignee-avatar">{complaint.assignee.charAt(0)}</span>
                    <div>
                      <div>{complaint.assignee}</div>
                      <span className="assignee-role">
                        {getRoleLabel(complaint.assigneeRole, ROLE_LABELS)}
                      </span>
                    </div>
                  </div>
                ) : '-'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">当前处理人</span>
              <span className="detail-value">
                {complaint.currentHandler ? (
                  <div className="assignee-info">
                    <span className="assignee-avatar">{complaint.currentHandler.charAt(0)}</span>
                    <div>
                      <div>{complaint.currentHandler}</div>
                      <span className="assignee-role">
                        {getRoleLabel(complaint.currentHandlerRole, ROLE_LABELS)}
                      </span>
                    </div>
                  </div>
                ) : '-'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">当前状态</span>
              <span className="detail-value">
                <span className={`status-badge status-${complaint.status}`}>
                  {STATUS_LABELS[complaint.status]}
                </span>
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">最后更新时间</span>
              <span className="detail-value">{formatDate(complaint.updatedAt)}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              证据材料
            </h3>
            {complaint.status !== 'closed' && (
              <button 
                className="btn btn-sm btn-primary" 
                onClick={() => setShowEvidenceModal(true)}
              >
                + 上传材料
              </button>
            )}
          </div>
          
          {!complaint.evidences || complaint.evidences.length === 0 ? (
            <div className="empty-state">
              暂无证据材料
              {complaint.status !== 'closed' && (
                <div style={{ marginTop: '12px' }}>
                  <button className="btn btn-primary" onClick={() => setShowEvidenceModal(true)}>
                    + 上传材料
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              {complaint.evidences.map(evidence => (
                <div key={evidence.id} className="evidence-item">
                  <span>📄</span>
                  <span>{evidence.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
                    上传时间：{formatDate(evidence.uploadedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <h3 className="section-title">处理历史记录</h3>
          <HistoryList history={complaint.history} constants={constants} />
        </div>
      )}

      {showStatusModal && (
        <StatusModal
          title={`${statusAction === 'process' ? '开始处理' : 
                  statusAction === 'return' ? '退回' : 
                  statusAction === 'supplement' ? '要求补材料' : 
                  statusAction === 'urge' ? '标记催促' : '关闭'}`}
          constants={constants}
          defaultStatus={
            statusAction === 'process' ? 'processing' :
            statusAction === 'return' ? 'returned' :
            statusAction === 'supplement' ? 'supplement_needed' :
            statusAction === 'urge' ? 'urged' : 'closed'
          }
          onConfirm={confirmStatusUpdate}
          onCancel={() => setShowStatusModal(false)}
        />
      )}

      {showEvidenceModal && (
        <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>补充证据材料</h3>
              <button className="modal-close" onClick={() => setShowEvidenceModal(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label>材料名称</label>
              <input 
                type="text" 
                value={evidenceName}
                onChange={e => setEvidenceName(e.target.value)}
                placeholder="例如：客户签收单.jpg、通话记录.pdf"
                autoFocus
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-default" 
                onClick={() => setShowEvidenceModal(false)}
              >
                取消
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleAddEvidence}
                disabled={!evidenceName.trim()}
              >
                确认上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintDetail;
