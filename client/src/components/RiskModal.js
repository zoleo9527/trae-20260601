import React, { useState, useEffect } from 'react';
import { riskAPI, logAPI } from '../api';

const statusLabels = {
  open: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
};

const severityLabels = {
  high: '高危',
  medium: '中危',
  low: '低危'
};

const typeLabels = {
  member_mismatch: '会员级别不匹配',
  equipment: '装备问题',
  conversion: '转化问题',
  safety: '安全隐患',
  other: '其他'
};

function RiskModal({ riskId, currentRole, currentUser, onClose, onUpdated }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    loadRisk();
  }, [riskId]);

  const loadRisk = async () => {
    try {
      setLoading(true);
      const data = await riskAPI.getAll();
      const item = data.find(r => r.id === riskId);
      setRisk(item);
    } catch (e) {
      console.error('加载风险失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!risk) return;
    try {
      const updateData = { 
        status: newStatus,
        handled_by: currentUser?.id
      };
      if (resolution.trim()) {
        updateData.resolution = resolution;
      }
      await riskAPI.updateStatus(riskId, updateData);
      await logAPI.create({
        user_id: currentUser?.id,
        action: `风险状态变更: ${statusLabels[risk.status]} → ${statusLabels[newStatus]}`,
        entity_type: 'risk',
        entity_id: riskId,
        details: resolution
      });
      onUpdated?.();
      onClose();
    } catch (e) {
      console.error('更新失败', e);
    }
  };

  if (loading || !risk) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>风险详情</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>标题</span>
              <span>{risk.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>类型</span>
              <span>{typeLabels[risk.type] || risk.type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>严重程度</span>
              <span className={`badge badge-${risk.severity === 'high' ? 'red' : risk.severity === 'medium' ? 'yellow' : 'blue'}`}>
                {severityLabels[risk.severity]}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>状态</span>
              <span className={`task-status status-${risk.status}`}>
                {statusLabels[risk.status]}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>上报人</span>
              <span>{risk.reporter_name || '系统'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>上报时间</span>
              <span>{new Date(risk.created_at).toLocaleString('zh-CN')}</span>
            </div>
            {risk.handler_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>处理人</span>
                <span>{risk.handler_name}</span>
              </div>
            )}
            <div style={{ marginTop: 12, padding: 12, background: '#f8f9fa', borderRadius: 6 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>详细描述</div>
              <div style={{ fontSize: 14 }}>{risk.description || '无'}</div>
            </div>
            {risk.resolution && (
              <div style={{ marginTop: 12, padding: 12, background: '#d4edda', borderRadius: 6 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>处理结果</div>
                <div style={{ fontSize: 14 }}>{risk.resolution}</div>
              </div>
            )}
          </div>

          {(risk.status === 'open' || risk.status === 'processing') && (
            <div className="form-group">
              <label>处理备注</label>
              <textarea 
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="填写处理措施和结果"
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
          
          {risk.status === 'open' && (
            <button className="btn btn-primary" onClick={() => handleStatusChange('processing')}>
              开始处理
            </button>
          )}

          {risk.status === 'processing' && (
            <button 
              className="btn btn-success" 
              onClick={() => {
                if (!resolution.trim()) {
                  alert('请填写处理结果');
                  return;
                }
                handleStatusChange('resolved');
              }}
            >
              标记已解决
            </button>
          )}

          {risk.status === 'resolved' && (
            <button className="btn btn-secondary" onClick={() => handleStatusChange('closed')}>
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RiskModal;
