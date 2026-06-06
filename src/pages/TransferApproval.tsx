import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransferApplications, getStatusText, getStatusColor, approveTransfer, rejectTransfer } from '../data/mockData';

export default function TransferApproval() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [auditComment, setAuditComment] = useState('');

  const pendingApplications = getTransferApplications().filter(
    t => t.status === 'pending_audit' || t.status === 'price_confirmed' || t.status === 'trial_class'
  );

  const selectedApp = getTransferApplications().find(t => t.id === selectedId);

  return (
    <div className="grid grid-2" style={{ gap: 24 }}>
      <div>
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <span>待审批列表</span>
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
              {pendingApplications.length} 条待处理
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {pendingApplications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div>暂无待审批的调班申请</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>学员</th>
                    <th>调班方向</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApplications.map(app => (
                    <tr
                      key={app.id}
                      style={{ background: selectedId === app.id ? '#eef2ff' : undefined, cursor: 'pointer' }}
                      onClick={() => setSelectedId(app.id)}
                    >
                      <td>
                        <div style={{ fontWeight: 500 }}>{app.studentName}</div>
                        <div className="text-sm text-gray">{app.reason}</div>
                      </td>
                      <td>
                        <div className="text-sm">{app.fromClassName}</div>
                        <div className="text-sm" style={{ color: '#6366f1' }}>→ {app.toClassName}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: getStatusColor(app.status) + '20', color: getStatusColor(app.status) }}>
                          {getStatusText(app.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={(e) => { e.stopPropagation(); navigate(`/transfer/${app.id}`); }}
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div>
        {selectedApp ? (
          <div className="card">
            <div className="card-header">申请详情</div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px 20px', marginBottom: 24 }}>
                <span className="text-gray">学员姓名</span>
                <span style={{ fontWeight: 500 }}>{selectedApp.studentName}</span>
                <span className="text-gray">调班原因</span>
                <span>{selectedApp.reason}</span>
                <span className="text-gray">原因说明</span>
                <span>{selectedApp.reasonDetail}</span>
                <span className="text-gray">原班级</span>
                <span>{selectedApp.fromClassName}</span>
                <span className="text-gray">目标班级</span>
                <span>{selectedApp.toClassName}</span>
                <span className="text-gray">申请人</span>
                <span>{selectedApp.initiatorName}（{selectedApp.initiatorRole}）</span>
                <span className="text-gray">申请时间</span>
                <span>{selectedApp.createdAt}</span>
              </div>

              <div className="card mb-4" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <div className="card-header" style={{ fontSize: 14 }}>流程进度</div>
                <div className="card-body">
                  <div className="unified-timeline">
                    <div className="timeline-item">
                      <div className="timeline-dot enroll">📝</div>
                      <div className="timeline-header">
                        <div className="timeline-type">申请提交</div>
                      </div>
                      <div className="timeline-content">由 {selectedApp.initiatorName} 提交调班申请</div>
                    </div>
                    {(selectedApp.trialResult || selectedApp.trialDate) && (
                      <div className="timeline-item">
                        <div className="timeline-dot trial">🎯</div>
                        <div className="timeline-header">
                          <div className="timeline-type">试听安排</div>
                        </div>
                        <div className="timeline-content">
                          {selectedApp.trialResult === 'pass' && '✅ 试听通过'}
                          {selectedApp.trialResult === 'fail' && '❌ 试听不通过'}
                          {selectedApp.trialResult === 'pending' && '⏳ 待安排试听'}
                          {selectedApp.trialFeedback && (
                            <div className="text-sm text-gray mt-2">老师反馈：{selectedApp.trialFeedback}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedApp.parentConfirmed && (
                      <div className="timeline-item">
                        <div className="timeline-dot parent">✅</div>
                        <div className="timeline-header">
                          <div className="timeline-type">家长确认</div>
                        </div>
                        <div className="timeline-content">家长已确认同意调班</div>
                      </div>
                    )}
                    <div className="timeline-item">
                      <div className="timeline-dot" style={{ background: '#f59e0b', boxShadow: '0 0 0 2px #f59e0b' }}>⏳</div>
                      <div className="timeline-header">
                        <div className="timeline-type">校区主管审核</div>
                      </div>
                      <div className="timeline-content" style={{ color: '#f59e0b' }}>等待审核</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-4" style={{
                boxShadow: 'none',
                border: `2px solid ${selectedApp.priceDifference >= 0 ? '#ef4444' : '#10b981'}`,
                background: selectedApp.priceDifference >= 0 ? '#fef2f2' : '#f0fdf4'
              }}>
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <div>
                      <div style={{ fontWeight: 600 }}>课时差价</div>
                      <div className="text-sm text-gray">剩余 {selectedApp.remainingHoursFrom} 课时 × 单价差额</div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>
                      {selectedApp.priceDifference >= 0 ? '+' : ''}¥{selectedApp.priceDifference}
                    </div>
                  </div>
                  <div className="text-sm mt-2" style={{ color: selectedApp.priceConfirmed ? '#10b981' : '#f59e0b' }}>
                    {selectedApp.priceConfirmed ? '✅ 差价已确认' : '⚠️ 差价待确认'}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">审核意见</label>
                <textarea
                  className="form-textarea"
                  placeholder="请填写审核意见（拒绝时必填）..."
                  value={auditComment}
                  onChange={(e) => setAuditComment(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  className="btn btn-success flex-1"
                  onClick={() => {
                    alert('已批准该调班申请！');
                    setSelectedId(null);
                    setAuditComment('');
                  }}
                >
                  ✅ 批准调班
                </button>
                <button
                  className="btn btn-danger flex-1"
                  onClick={() => {
                    if (!auditComment.trim()) { alert('请填写拒绝原因'); return; }
                    alert('已拒绝该调班申请！');
                    setSelectedId(null);
                    setAuditComment('');
                  }}
                >
                  ❌ 拒绝申请
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-icon">👈</div>
                <div>请从左侧选择一条申请查看详情</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
