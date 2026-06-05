import React, { useState, useEffect } from 'react';
import { riskAPI, logAPI } from '../api';
import RiskModal from '../components/RiskModal';

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

function Risks({ currentRole, currentUser }) {
  const [risks, setRisks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newRisk, setNewRisk] = useState({
    type: 'safety',
    severity: 'medium',
    title: '',
    description: ''
  });

  useEffect(() => {
    loadData();
    const handleRoleChange = () => loadData();
    window.addEventListener('roleChange', handleRoleChange);
    return () => window.removeEventListener('roleChange', handleRoleChange);
  }, [currentRole]);

  const loadData = async () => {
    try {
      const [riskData, logData] = await Promise.all([
        riskAPI.getAll(),
        logAPI.getAll()
      ]);
      setRisks(riskData);
      setLogs(logData.filter(l => l.entity_type === 'risk' || l.entity_type === 'schedule'));
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  const handleCreate = async () => {
    if (!newRisk.title.trim()) {
      alert('请填写风险标题');
      return;
    }
    try {
      await riskAPI.create({
        ...newRisk,
        reported_by: currentUser?.id
      });
      setShowCreate(false);
      setNewRisk({ type: 'safety', severity: 'medium', title: '', description: '' });
      loadData();
    } catch (e) {
      console.error('创建失败', e);
    }
  };

  const filteredRisks = filterStatus === 'all' 
    ? risks 
    : risks.filter(r => r.status === filterStatus);

  const activeCount = risks.filter(r => r.status === 'open' || r.status === 'processing').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          风险提示
          {activeCount > 0 && (
            <span className="badge badge-red" style={{ marginLeft: 12 }}>
              {activeCount} 项待处理
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowHistory(true)}>
            处理记录
          </button>
          <select 
            className="role-selector"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">全部状态</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 上报风险
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '3px solid #e74c3c' }}>
          <div className="label">高危</div>
          <div className="value" style={{ color: '#e74c3c' }}>
            {risks.filter(r => r.severity === 'high' && (r.status === 'open' || r.status === 'processing')).length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #f39c12' }}>
          <div className="label">中危</div>
          <div className="value" style={{ color: '#f39c12' }}>
            {risks.filter(r => r.severity === 'medium' && (r.status === 'open' || r.status === 'processing')).length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #3498db' }}>
          <div className="label">低危</div>
          <div className="value" style={{ color: '#3498db' }}>
            {risks.filter(r => r.severity === 'low' && (r.status === 'open' || r.status === 'processing')).length}
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>严重程度</th>
              <th>标题</th>
              <th>类型</th>
              <th>状态</th>
              <th>上报人</th>
              <th>上报时间</th>
              <th>处理人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRisks.map(r => (
              <tr key={r.id}>
                <td>
                  <span className={`badge badge-${r.severity === 'high' ? 'red' : r.severity === 'medium' ? 'yellow' : 'blue'}`}>
                    {severityLabels[r.severity]}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{r.title}</td>
                <td>{typeLabels[r.type] || r.type}</td>
                <td>
                  <span className={`task-status status-${r.status}`}>
                    {statusLabels[r.status]}
                  </span>
                </td>
                <td>{r.reporter_name || '系统'}</td>
                <td>{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                <td>{r.handler_name || '-'}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => setSelectedId(r.id)}>
                    查看
                  </button>
                </td>
              </tr>
            ))}
            {filteredRisks.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">暂无风险记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <RiskModal
          riskId={selectedId}
          currentRole={currentRole}
          currentUser={currentUser}
          onClose={() => setSelectedId(null)}
          onUpdated={loadData}
        />
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>上报风险</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>风险类型</label>
                <select 
                  value={newRisk.type}
                  onChange={e => setNewRisk({...newRisk, type: e.target.value})}
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>严重程度</label>
                <select 
                  value={newRisk.severity}
                  onChange={e => setNewRisk({...newRisk, severity: e.target.value})}
                >
                  {Object.entries(severityLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>标题</label>
                <input 
                  type="text"
                  value={newRisk.title}
                  onChange={e => setNewRisk({...newRisk, title: e.target.value})}
                  placeholder="简要描述风险"
                />
              </div>
              <div className="form-group">
                <label>详细描述</label>
                <textarea 
                  value={newRisk.description}
                  onChange={e => setNewRisk({...newRisk, description: e.target.value})}
                  placeholder="详细描述风险情况"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate}>提交</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>处理记录</h3>
              <button className="modal-close" onClick={() => setShowHistory(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="timeline">
                {logs.map(log => (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-date">
                      {new Date(log.created_at).toLocaleString('zh-CN')} · {log.user_name || '系统'}
                    </div>
                    <div className="timeline-content">{log.action}</div>
                    {log.details && (
                      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                        备注: {log.details}
                      </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="empty-state">暂无处理记录</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Risks;
