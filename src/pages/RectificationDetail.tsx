import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Rectification, STATUS_LABELS, STATUS_COLORS,
  SEVERITY_LABELS, SEVERITY_COLORS, Attachment, OperationLog, Comment, Store, User
} from '../types';

const RectificationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, userName } = useAuth();
  const [data, setData] = useState<Rectification | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processNote, setProcessNote] = useState('');
  const [processAction, setProcessAction] = useState<'start' | 'submit'>('start');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedHandler, setSelectedHandler] = useState('');
  const [customHandlerMode, setCustomHandlerMode] = useState(false);
  const [customHandlerName, setCustomHandlerName] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [storeManagers, setStoreManagers] = useState<User[]>([]);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  useEffect(() => {
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(console.error);
    fetch('/api/users?role=store_manager').then(r => r.json()).then(setStoreManagers).catch(console.error);
  }, []);

  const managerOptions = useMemo(() => {
    const names = new Set<string>();
    stores.forEach(s => { if (s.manager) names.add(s.manager); });
    storeManagers.forEach(u => { if (u.name) names.add(u.name); });
    return Array.from(names).sort();
  }, [stores, storeManagers]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rectifications/${id}`);
      const detail = await res.json();
      setData(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string, note?: string) => {
    try {
      await fetch(`/api/rectifications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, operatorName: userName, note }),
      });
      setShowProcessModal(false);
      setProcessNote('');
      fetchDetail();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    try {
      await fetch(`/api/rectifications/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: userName, content: commentText }),
      });
      setCommentText('');
      fetchDetail();
    } catch (e) {
      console.error(e);
    }
  };

  const openReassignModal = () => {
    setSelectedHandler(data?.handler_name || '');
    setCustomHandlerMode(false);
    setCustomHandlerName('');
    setShowReassignModal(true);
  };

  const handleReassign = async () => {
    const handlerName = customHandlerMode ? customHandlerName.trim() : selectedHandler;
    try {
      await fetch(`/api/rectifications/${id}/handler`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handlerName, operatorName: userName }),
      });
      setShowReassignModal(false);
      fetchDetail();
    } catch (e) {
      console.error(e);
    }
  };

  const openProcessModal = (action: 'start' | 'submit') => {
    setProcessAction(action);
    setProcessNote('');
    setShowProcessModal(true);
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    return '📎';
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!data) {
    return <div>整改单不存在</div>;
  }

  const canStartRectify = role === 'store_manager' && data.status === 'pending' && data.handler_name === userName;
  const canSubmitReview = role === 'store_manager' && data.status === 'in_progress' && data.handler_name === userName;
  const canGoReview = role === 'ops_supervisor' && data.status === 'pending_review' && data.review;
  const canReassign = role === 'ops_supervisor' && data.status !== 'completed';

  return (
    <div>
      <div className="breadcrumb">
        <span onClick={() => navigate('/rectifications')}>巡店整改</span>
        <span className="separator">/</span>
        <span>整改单 #{data.id}</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">
            {data.title}
            <span style={{ marginLeft: 12 }}>
              <span className={`tag tag-${STATUS_COLORS[data.status]}`} style={{ fontSize: 14 }}>
                {STATUS_LABELS[data.status]}
              </span>
            </span>
            <span style={{ marginLeft: 8 }}>
              <span className={`tag tag-${SEVERITY_COLORS[data.severity]}`} style={{ fontSize: 14 }}>
                {data.severity}
              </span>
            </span>
          </div>
          <div className="page-subtitle">
            {data.store_name} · {data.brand}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canStartRectify && (
            <button className="btn btn-primary" onClick={() => openProcessModal('start')}>
              ▶️ 开始整改
            </button>
          )}
          {canSubmitReview && (
            <button className="btn btn-success" onClick={() => openProcessModal('submit')}>
              ✅ 提交复查
            </button>
          )}
          {canGoReview && data.review && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/reviews/${data.review!.id}`)}
            >
              📝 去复查
            </button>
          )}
          <button className="btn" onClick={() => navigate('/rectifications')}>
            返回列表
          </button>
        </div>
      </div>

      <div className="two-col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 基本信息 */}
          <div className="card">
            <div className="card-header">基本信息</div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">整改编号</span>
                  <span className="detail-value">#{data.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">所属店铺</span>
                  <span className="detail-value">{data.store_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">品牌</span>
                  <span className="detail-value">{data.brand}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">问题分类</span>
                  <span className="detail-value">{data.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">严重程度</span>
                  <span className="detail-value">
                    <span className={`tag tag-${SEVERITY_COLORS[data.severity]}`}>
                      {data.severity}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">当前状态</span>
                  <span className="detail-value">
                    <span className={`tag tag-${STATUS_COLORS[data.status]}`}>
                      {STATUS_LABELS[data.status]}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">巡店人</span>
                  <span className="detail-value">{data.inspector_name || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">巡店日期</span>
                  <span className="detail-value">{data.inspection_date}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">负责人</span>
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {data.handler_name ? (
                      <span>{data.handler_name}</span>
                    ) : (
                      <span className="tag tag-default" style={{ fontSize: 12 }}>待指派</span>
                    )}
                    {canReassign && (
                      <button className="btn btn-sm" style={{ padding: '2px 8px', fontSize: 12 }} onClick={openReassignModal}>
                        {data.handler_name ? '改派' : '补录'}
                      </button>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">截止日期</span>
                  <span className="detail-value">{data.deadline}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">创建时间</span>
                  <span className="detail-value">{formatTime(data.created_at)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">更新时间</span>
                  <span className="detail-value">{formatTime(data.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 问题描述 */}
          <div className="card">
            <div className="card-header">问题描述</div>
            <div className="card-body">
              <p style={{ lineHeight: 1.8, color: 'var(--text-primary)' }}>{data.description}</p>
            </div>
          </div>

          {/* 整改要求 */}
          <div className="card">
            <div className="card-header">整改要求</div>
            <div className="card-body">
              <p style={{ lineHeight: 1.8, color: 'var(--text-primary)' }}>{data.requirement}</p>
            </div>
          </div>

          {/* 整改说明（如果有） */}
          {data.rectify_note && (
            <div className="card" style={{ borderColor: '#bae7ff', background: '#e6f7ff' }}>
              <div className="card-header" style={{ borderBottomColor: '#bae7ff' }}>
                整改说明
              </div>
              <div className="card-body">
                <p style={{ lineHeight: 1.8 }}>{data.rectify_note}</p>
                {data.rectify_date && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                    提交时间：{data.rectify_date}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 附件 */}
          <div className="card">
            <div className="card-header">
              附件
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                （占位示意）
              </span>
            </div>
            <div className="card-body">
              {data.attachments && data.attachments.length > 0 ? (
                <div className="attachment-list">
                  {data.attachments.map((att: Attachment) => (
                    <div key={att.id} className="attachment-item">
                      <span className="attachment-icon">{getFileIcon(att.file_name)}</span>
                      <div>
                        <div className="attachment-name">{att.file_name}</div>
                        <div className="attachment-size">
                          {formatFileSize(att.file_size)} · {att.uploader_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">暂无附件</div>
              )}
            </div>
          </div>

          {/* 评论区 */}
          <div className="card">
            <div className="card-header">沟通留言</div>
            <div className="card-body">
              {data.comments && data.comments.length > 0 ? (
                <div className="comment-list">
                  {data.comments.map((c: Comment) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-header">
                        <span className="comment-author">{c.author_name}</span>
                        <span className="comment-time">{formatTime(c.created_at)}</span>
                      </div>
                      <div className="comment-content">{c.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">暂无留言</div>
              )}

              <div className="comment-input-box">
                <textarea
                  className="textarea"
                  placeholder="输入留言内容..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="comment-input-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleSubmitComment}>
                    发送留言
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 关联复查单 */}
          {data.review && (
            <div className="card" style={{ borderColor: '#b7eb8f', background: '#f6ffed' }}>
              <div className="card-header" style={{ borderBottomColor: '#d9f7be' }}>
                🔗 关联闭店复查单
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 500 }}>复查单 #{data.review.id}</span>
                  <span className={`tag tag-${data.review.status === 'completed' ? 'success' : 'warning'}`} style={{ marginLeft: 8 }}>
                    {data.review.status === 'completed' ? '已完成' : '待复查'}
                  </span>
                </div>
                {data.review.result && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    复查结果：{data.review.result === 'passed' ? '通过 ✅' : '未通过 ❌'}
                  </div>
                )}
                {data.review.review_date && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    复查日期：{data.review.review_date}
                  </div>
                )}
                <button
                  className="link-btn"
                  onClick={() => navigate(`/reviews/${data.review!.id}`)}
                >
                  查看复查详情 →
                </button>
              </div>
            </div>
          )}

          {/* 操作日志 */}
          <div className="card">
            <div className="card-header">
              操作日志
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                共 {data.logs?.length || 0} 条
              </span>
            </div>
            <div className="card-body">
              {data.logs && data.logs.length > 0 ? (
                <div className="timeline">
                  {data.logs.map((log: OperationLog) => (
                    <div key={log.id} className="timeline-item">
                      <div className="timeline-time">{formatTime(log.created_at)}</div>
                      <div className="timeline-content">
                        <span className="timeline-operator">{log.operator_name}</span>
                        {' '}
                        {log.detail || log.action}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">暂无操作记录</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 处理弹窗 */}
      {showProcessModal && (
        <div className="modal-overlay" onClick={() => setShowProcessModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              {processAction === 'start' ? '开始整改' : '提交复查申请'}
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  {processAction === 'start' ? '整改说明（可选）' : '整改完成说明'}
                </label>
                <textarea
                  className="textarea"
                  placeholder={processAction === 'start'
                    ? '请简要描述整改计划和预计完成时间...'
                    : '请详细描述整改措施和完成情况...'
                  }
                  value={processNote}
                  onChange={e => setProcessNote(e.target.value)}
                  rows={4}
                />
              </div>
              {processAction === 'submit' && (
                <div className="form-hint">
                  提交后将自动生成闭店复查单，由营运督导进行现场复查。
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowProcessModal(false)}>取消</button>
              <button
                className={`btn ${processAction === 'submit' ? 'btn-success' : 'btn-primary'}`}
                onClick={() => handleStatusUpdate(
                  processAction === 'start' ? 'in_progress' : 'pending_review',
                  processNote
                )}
              >
                {processAction === 'start' ? '确认开始' : '提交复查'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 改派负责人弹窗 */}
      {showReassignModal && (
        <div className="modal-overlay" onClick={() => setShowReassignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              {data?.handler_name ? '改派负责人' : '补录负责人'}
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">选择负责人</label>
                {!customHandlerMode ? (
                  <select
                    className="select"
                    value={selectedHandler}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setCustomHandlerMode(true);
                        setCustomHandlerName('');
                      } else {
                        setSelectedHandler(val);
                      }
                    }}
                  >
                    <option value="">请选择...</option>
                    {managerOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="__custom__">✏️ 手动输入...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      placeholder="输入负责人姓名"
                      value={customHandlerName}
                      onChange={e => setCustomHandlerName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn"
                      onClick={() => {
                        setCustomHandlerMode(false);
                        setCustomHandlerName('');
                      }}
                    >
                      返回选择
                    </button>
                  </div>
                )}
              </div>
              {!data?.handler_name && (
                <div className="form-hint" style={{ color: 'var(--warning)' }}>
                  ⚠️ 当前整改单尚未指派负责人，补录后店长将收到整改任务。
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowReassignModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleReassign}
                disabled={customHandlerMode ? !customHandlerName.trim() : !selectedHandler}
              >
                确认{data?.handler_name ? '改派' : '补录'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RectificationDetail;
