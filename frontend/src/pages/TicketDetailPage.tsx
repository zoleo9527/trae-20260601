import React, { useState, useEffect } from 'react';
import {
  getTicketDetail,
  startScheduling,
  submitSchedulingReview,
  startVerification,
  submitVerification,
  reviewVerification,
} from '../services/api';
import {
  GroupTicket,
  UserRole,
  StatusLog,
  STATUS_LABELS,
  STATUS_COLORS,
  ROLE_LABELS,
} from '../types';

interface TicketDetailPageProps {
  ticketId: string;
  role: UserRole;
  onBack: () => void;
}

const TicketDetailPage: React.FC<TicketDetailPageProps> = ({ ticketId, role, onBack }) => {
  const [ticket, setTicket] = useState<GroupTicket | null>(null);
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'action'>('info');

  const [schedulingApproved, setSchedulingApproved] = useState(true);
  const [schedulingReason, setSchedulingReason] = useState('');
  const [supplementaryRemark, setSupplementaryRemark] = useState('');

  const [actualAttendance, setActualAttendance] = useState(0);
  const [ticketUsed, setTicketUsed] = useState(0);
  const [ticketRefunded, setTicketRefunded] = useState(0);
  const [verificationRemark, setVerificationRemark] = useState('');

  const [reviewApproved, setReviewApproved] = useState(true);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewRemark, setReviewRemark] = useState('');

  useEffect(() => {
    loadDetail();
  }, [ticketId, role]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await getTicketDetail(role, ticketId);
      if (res.success) {
        setTicket(res.data.ticket);
        setLogs(res.data.logs);
        if (res.data.ticket.ticketCount) {
          setActualAttendance(res.data.ticket.ticketCount);
          setTicketUsed(res.data.ticket.ticketCount);
        }
      }
    } catch (e) {
      console.error('加载详情失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartScheduling = async () => {
    const res = await startScheduling(role, ticketId);
    if (res.success) {
      setTicket(res.data);
      loadDetail();
    }
  };

  const handleSubmitSchedulingReview = async () => {
    const res = await submitSchedulingReview(role, ticketId, {
      approved: schedulingApproved,
      reason: schedulingReason,
      supplementaryRemark: supplementaryRemark,
    });
    if (res.success) {
      setTicket(res.data);
      setSchedulingReason('');
      setSupplementaryRemark('');
      loadDetail();
    }
  };

  const handleStartVerification = async () => {
    const res = await startVerification(role, ticketId);
    if (res.success) {
      setTicket(res.data);
      loadDetail();
    }
  };

  const handleSubmitVerification = async () => {
    const res = await submitVerification(role, ticketId, {
      actualAttendance,
      ticketUsed,
      ticketRefunded,
      remark: verificationRemark,
    });
    if (res.success) {
      setTicket(res.data);
      setVerificationRemark('');
      loadDetail();
    }
  };

  const handleReviewVerification = async () => {
    const res = await reviewVerification(role, ticketId, {
      approved: reviewApproved,
      reason: reviewReason,
      reviewRemark: reviewRemark,
    });
    if (res.success) {
      setTicket(res.data);
      setReviewReason('');
      setReviewRemark('');
      loadDetail();
    }
  };

  if (loading || !ticket) {
    return <div className="loading">加载中...</div>;
  }

  const canDoSchedulingAction = role === 'scheduling_manager' &&
    (ticket.status === 'pending_scheduling' || ticket.status === 'scheduling_reviewing' || ticket.status === 'scheduling_rejected');

  const canDoVerificationAction = role === 'ticket_supervisor' &&
    (ticket.status === 'scheduling_approved' || ticket.status === 'pending_verification' || ticket.status === 'verifying' || ticket.status === 'verification_rejected');

  const canDoReviewAction = role === 'duty_manager' && ticket.status === 'verification_pending_review';

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-link back-btn" onClick={onBack}>
            ← 返回
          </button>
          <h2 style={{ display: 'inline-block', marginLeft: 12 }}>
            团体票详情 - {ticket.orderNo}
          </h2>
          <span
            className="status-tag"
            style={{
              backgroundColor: (ticket.statusColor || STATUS_COLORS[ticket.status]) + '20',
              color: ticket.statusColor || STATUS_COLORS[ticket.status],
              marginLeft: 12,
            }}
          >
            {ticket.statusLabel || STATUS_LABELS[ticket.status]}
          </span>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-label">当前责任人</div>
          <div className="summary-card-value">
            <span className="role-avatar">{(ticket.currentHandlerLabel || ROLE_LABELS[ticket.currentHandler]).charAt(0)}</span>
            {ticket.currentHandlerLabel || ROLE_LABELS[ticket.currentHandler]}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">时效状态</div>
          <div className="summary-card-value">
            {ticket.isOverdue ? (
              <span className="tag tag-danger">已逾期</span>
            ) : ticket.isUrgent ? (
              <span className="tag tag-warning">临期中</span>
            ) : ticket.status === 'completed' ? (
              <span className="tag tag-success">已完成</span>
            ) : (
              <span className="tag tag-success">正常</span>
            )}
            {ticket.slaDeadline && (
              <span style={{ marginLeft: '8px', color: '#8c8c8c', fontSize: '13px' }}>
                SLA截止: {new Date(ticket.slaDeadline).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">卡住原因</div>
          <div className="summary-card-value" style={{ color: ticket.stuckReason ? '#fa8c16' : '#52c41a' }}>
            {ticket.stuckReason || '流程正常进行中'}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">下一节点时间</div>
          <div className="summary-card-value">
            {ticket.nextNodeTime ? new Date(ticket.nextNodeTime).toLocaleString('zh-CN') : '-'}
          </div>
        </div>
        <div className="summary-card" style={{ gridColumn: 'span 2' }}>
          <div className="summary-card-label">最近一次备注</div>
          <div className="summary-card-value" style={{ color: '#595959' }}>
            {logs.length > 0 && logs[logs.length - 1].remark
              ? logs[logs.length - 1].remark
              : '暂无操作备注'}
            {logs.length > 0 && (
              <span style={{ marginLeft: '8px', color: '#8c8c8c', fontSize: '13px' }}>
                —— {logs[logs.length - 1].operatorName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'info' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('info')}
        >
          基本信息
        </button>
        <button
          className={activeTab === 'timeline' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('timeline')}
        >
          处理时间线
        </button>
        <button
          className={activeTab === 'action' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('action')}
        >
          流程处理
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && (
          <div className="info-content">
            <div className="info-section">
              <h3>企业信息</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>企业名称</label>
                  <span>{ticket.companyName}</span>
                </div>
                <div className="info-item">
                  <label>联系人</label>
                  <span>{ticket.contactName}</span>
                </div>
                <div className="info-item">
                  <label>联系电话</label>
                  <span>{ticket.contactPhone}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>场次信息</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>影片名称</label>
                  <span>{ticket.movieName}</span>
                </div>
                <div className="info-item">
                  <label>放映日期</label>
                  <span>{ticket.showDate}</span>
                </div>
                <div className="info-item">
                  <label>放映时间</label>
                  <span>{ticket.showTime}</span>
                </div>
                <div className="info-item">
                  <label>影厅</label>
                  <span>{ticket.hallName}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>票务信息</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>票数</label>
                  <span>{ticket.ticketCount} 张</span>
                </div>
                <div className="info-item">
                  <label>单价</label>
                  <span>¥{ticket.unitPrice}</span>
                </div>
                <div className="info-item">
                  <label>总金额</label>
                  <span>¥{ticket.totalAmount}</span>
                </div>
                <div className="info-item">
                  <label>当前责任人</label>
                  <span>{ticket.currentHandlerLabel || ROLE_LABELS[ticket.currentHandler]}</span>
                </div>
              </div>
            </div>

            {ticket.verificationData && (
              <div className="info-section">
                <h3>核销数据</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>实际到场</label>
                    <span>{ticket.verificationData.actualAttendance} 人</span>
                  </div>
                  <div className="info-item">
                    <label>使用票数</label>
                    <span>{ticket.verificationData.ticketUsed} 张</span>
                  </div>
                  <div className="info-item">
                    <label>退票数量</label>
                    <span>{ticket.verificationData.ticketRefunded} 张</span>
                  </div>
                  <div className="info-item">
                    <label>核销备注</label>
                    <span>{ticket.verificationData.remark || '-'}</span>
                  </div>
                  <div className="info-item">
                    <label>核销时间</label>
                    <span>{ticket.verifiedAt ? new Date(ticket.verifiedAt).toLocaleString('zh-CN') : '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {ticket.rejectRecords && ticket.rejectRecords.length > 0 && (
              <div className="info-section">
                <h3>驳回记录</h3>
                {ticket.rejectRecords.map((record, idx) => (
                  <div key={idx} className="reject-item">
                    <div className="reject-header">
                      <span className="reject-role">{ROLE_LABELS[record.role]}</span>
                      <span className="reject-time">
                        {new Date(record.rejectedAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="reject-reason">{record.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {ticket.supplementaryRemark && (
              <div className="info-section">
                <h3>补充备注</h3>
                <p className="supplementary-text">{ticket.supplementaryRemark}</p>
                <span className="supplementary-time">
                  更新于 {ticket.supplementaryAt ? new Date(ticket.supplementaryAt).toLocaleString('zh-CN') : ''}
                </span>
              </div>
            )}

            {ticket.reviewRemark && (
              <div className="info-section">
                <h3>复核意见</h3>
                <p className="supplementary-text">{ticket.reviewRemark}</p>
                <span className="supplementary-time">
                  复核于 {ticket.reviewedAt ? new Date(ticket.reviewedAt).toLocaleString('zh-CN') : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline">
            {logs.map(log => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-role">{ROLE_LABELS[log.operatorRole]}</span>
                    <span className="timeline-operator">· {log.operatorName}</span>
                    <span className="timeline-time">
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="timeline-status">
                    {log.fromStatus && (
                      <>
                        <span
                          className="status-tag status-tag-small"
                          style={{
                            backgroundColor: STATUS_COLORS[log.fromStatus] + '20',
                            color: STATUS_COLORS[log.fromStatus],
                          }}
                        >
                          {STATUS_LABELS[log.fromStatus]}
                        </span>
                        <span className="timeline-arrow">→</span>
                      </>
                    )}
                    <span
                      className="status-tag status-tag-small"
                      style={{
                        backgroundColor: STATUS_COLORS[log.toStatus] + '20',
                        color: STATUS_COLORS[log.toStatus],
                      }}
                    >
                      {STATUS_LABELS[log.toStatus]}
                    </span>
                  </div>
                  {log.remark && <p className="timeline-remark">{log.remark}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'action' && (
          <div className="action-content">
            {canDoSchedulingAction && (
              <div className="action-section">
                <h3>排片审核</h3>
                {ticket.status === 'pending_scheduling' && (
                  <div className="action-form">
                    <p>该团体票等待排片审核，确认开始处理吗？</p>
                    <button className="btn btn-primary" onClick={handleStartScheduling}>
                      开始排片审核
                    </button>
                  </div>
                )}

                {(ticket.status === 'scheduling_reviewing' || ticket.status === 'scheduling_rejected') && (
                  <div className="action-form">
                    <div className="form-group">
                      <label>审核结果</label>
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            checked={schedulingApproved}
                            onChange={() => setSchedulingApproved(true)}
                          />
                          通过
                        </label>
                        <label>
                          <input
                            type="radio"
                            checked={!schedulingApproved}
                            onChange={() => setSchedulingApproved(false)}
                          />
                          驳回
                        </label>
                      </div>
                    </div>
                    {!schedulingApproved && (
                      <div className="form-group">
                        <label>驳回原因</label>
                        <textarea
                          rows={3}
                          value={schedulingReason}
                          onChange={e => setSchedulingReason(e.target.value)}
                          placeholder="请输入驳回原因..."
                        />
                      </div>
                    )}
                    {schedulingApproved && (
                      <div className="form-group">
                        <label>补充备注（可选）</label>
                        <textarea
                          rows={2}
                          value={supplementaryRemark}
                          onChange={e => setSupplementaryRemark(e.target.value)}
                          placeholder="如特殊要求、注意事项等..."
                        />
                      </div>
                    )}
                    <button className="btn btn-primary" onClick={handleSubmitSchedulingReview}>
                      提交审核结果
                    </button>
                  </div>
                )}
              </div>
            )}

            {canDoVerificationAction && (
              <div className="action-section">
                <h3>现场核销</h3>
                {(ticket.status === 'scheduling_approved' || ticket.status === 'pending_verification') && (
                  <div className="action-form">
                    <p>该团体票已排片通过，确认开始现场核销吗？</p>
                    <button className="btn btn-primary" onClick={handleStartVerification}>
                      开始现场核销
                    </button>
                  </div>
                )}

                {(ticket.status === 'verifying' || ticket.status === 'verification_rejected') && (
                  <div className="action-form">
                    <div className="form-group">
                      <label>实际到场人数</label>
                      <input
                        type="number"
                        value={actualAttendance}
                        onChange={e => setActualAttendance(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>使用票数</label>
                      <input
                        type="number"
                        value={ticketUsed}
                        onChange={e => setTicketUsed(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>退票数量</label>
                      <input
                        type="number"
                        value={ticketRefunded}
                        onChange={e => setTicketRefunded(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label>核销备注（可选）</label>
                      <textarea
                        rows={2}
                        value={verificationRemark}
                        onChange={e => setVerificationRemark(e.target.value)}
                        placeholder="特殊情况说明..."
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleSubmitVerification}>
                      提交核销数据
                    </button>
                  </div>
                )}
              </div>
            )}

            {canDoReviewAction && (
              <div className="action-section">
                <h3>核销复核</h3>
                <div className="action-form">
                  <div className="form-group">
                    <label>复核结果</label>
                    <div className="radio-group">
                      <label>
                        <input
                          type="radio"
                          checked={reviewApproved}
                          onChange={() => setReviewApproved(true)}
                        />
                        通过
                      </label>
                      <label>
                        <input
                          type="radio"
                          checked={!reviewApproved}
                          onChange={() => setReviewApproved(false)}
                        />
                        驳回
                      </label>
                    </div>
                  </div>
                  {!reviewApproved && (
                    <div className="form-group">
                      <label>驳回原因</label>
                      <textarea
                        rows={3}
                        value={reviewReason}
                        onChange={e => setReviewReason(e.target.value)}
                        placeholder="请输入驳回原因..."
                      />
                    </div>
                  )}
                  {reviewApproved && (
                    <div className="form-group">
                      <label>复核意见（可选）</label>
                      <textarea
                        rows={2}
                        value={reviewRemark}
                        onChange={e => setReviewRemark(e.target.value)}
                        placeholder="复核意见..."
                      />
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={handleReviewVerification}>
                    提交复核结果
                  </button>
                </div>
              </div>
            )}

            {!canDoSchedulingAction && !canDoVerificationAction && !canDoReviewAction && (
              <div className="empty-state">
                当前状态下您没有可执行的操作
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailPage;
