import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Review, Attachment, OperationLog, Comment,
  STATUS_LABELS, SEVERITY_COLORS
} from '../types';

const ReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, userName } = useAuth();
  const [data, setData] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewResult, setReviewResult] = useState<'passed' | 'rejected'>('passed');
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${id}`);
      const detail = await res.json();
      setData(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: reviewResult,
          reviewNote,
          reviewerName: userName,
        }),
      });
      setShowReviewForm(false);
      setReviewNote('');
      fetchDetail();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    try {
      await fetch(`/api/reviews/${id}/comments`, {
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

  if (!data || !data.rectification) {
    return <div>复查单不存在</div>;
  }

  const canReview = role === 'ops_supervisor' && data.status === 'pending';
  const rect = data.rectification;

  return (
    <div>
      <div className="breadcrumb">
        <span onClick={() => navigate('/reviews')}>闭店复查</span>
        <span className="separator">/</span>
        <span>复查单 #{data.id}</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">
            闭店复查 #{data.id}
            <span style={{ marginLeft: 12 }}>
              <span className={`tag tag-${data.status === 'completed' ? 'success' : 'warning'}`} style={{ fontSize: 14 }}>
                {data.status === 'completed' ? '已完成' : '待复查'}
              </span>
            </span>
          </div>
          <div className="page-subtitle">
            {data.store_name} · {data.brand}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canReview && (
            <button className="btn btn-primary" onClick={() => setShowReviewForm(true)}>
              ✍️ 填写复查结果
            </button>
          )}
          <button className="btn" onClick={() => navigate('/reviews')}>
            返回列表
          </button>
        </div>
      </div>

      {/* 整改上下文承接卡片 - 核心设计 */}
      <div className="review-context-card">
        <div className="review-context-title">
          🔗 关联巡店整改单 #{rect.id}
          <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 'normal', color: 'var(--text-secondary)' }}>
            <button className="link-btn" onClick={() => navigate(`/rectifications/${rect.id}`)}>
              查看完整整改单 →
            </button>
          </span>
        </div>
        <div className="review-context-grid">
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>问题标题：</span>
            <span style={{ fontWeight: 500 }}>{rect.title}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>严重程度：</span>
            <span className={`tag tag-${SEVERITY_COLORS[rect.severity]}`}>
              {rect.severity}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>问题分类：</span>
            {rect.category}
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>巡店人：</span>
            {rect.inspector_name || '-'}
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: 'var(--text-secondary)' }}>整改要求：</span>
            {rect.requirement}
          </div>
          {rect.rectify_note && (
            <div style={{ gridColumn: 'span 2', padding: '8px 12px', background: '#fff', borderRadius: 4, border: '1px solid #d9f7be' }}>
              <span style={{ color: 'var(--text-secondary)' }}>整改说明：</span>
              {rect.rectify_note}
            </div>
          )}
        </div>
      </div>

      <div className="two-col" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 复查结果 */}
          <div className="card">
            <div className="card-header">复查结果</div>
            <div className="card-body">
              {data.status === 'completed' ? (
                <>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">复查人</span>
                      <span className="detail-value">{data.reviewer_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">复查日期</span>
                      <span className="detail-value">{data.review_date}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">复查结果</span>
                      <span className="detail-value">
                        {data.result === 'passed' ? (
                          <span className="tag tag-success">通过 ✅</span>
                        ) : (
                          <span className="tag tag-error">未通过 ❌</span>
                        )}
                      </span>
                    </div>
                  </div>
                  {data.review_note && (
                    <div style={{ marginTop: 12, padding: '12px', background: '#fafafa', borderRadius: 4 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>复查意见</div>
                      <p style={{ lineHeight: 1.8 }}>{data.review_note}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  待复查
                  <div style={{ fontSize: 12, marginTop: 8 }}>
                    {canReview ? '点击右上角按钮填写复查结果' : '等待营运督导进行复查'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 整改回看 - 整改单附件 */}
          <div className="card">
            <div className="card-header">
              整改回看 · 巡店时附件
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                （来自整改单）
              </span>
            </div>
            <div className="card-body">
              {data.rectAttachments && data.rectAttachments.length > 0 ? (
                <div className="attachment-list">
                  {data.rectAttachments.map((att: Attachment) => (
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

          {/* 复查附件 */}
          <div className="card">
            <div className="card-header">
              复查附件
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
                <div className="empty-state">暂无复查附件</div>
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
          {/* 完整操作时间线 - 包含整改和复查的全部日志 */}
          <div className="card">
            <div className="card-header">
              完整操作轨迹
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                整改+复查 全链路
              </span>
            </div>
            <div className="card-body">
              <div className="timeline">
                {/* 复查日志 */}
                {data.logs?.map((log: OperationLog) => (
                  <div key={`review-${log.id}`} className="timeline-item">
                    <div className="timeline-time">{formatTime(log.created_at)}</div>
                    <div className="timeline-content">
                      <span className="timeline-operator">{log.operator_name}</span>
                      {' '}
                      {log.detail || log.action}
                      <span className="tag tag-primary" style={{ marginLeft: 6 }}>复查</span>
                    </div>
                  </div>
                ))}

                {/* 整改日志 - 倒序展示，所以放在后面 */}
                {data.rectLogs?.slice().reverse().map((log: OperationLog) => (
                  <div key={`rect-${log.id}`} className="timeline-item">
                    <div className="timeline-time">{formatTime(log.created_at)}</div>
                    <div className="timeline-content">
                      <span className="timeline-operator">{log.operator_name}</span>
                      {' '}
                      {log.detail || log.action}
                      <span className="tag tag-default" style={{ marginLeft: 6 }}>整改</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 快速信息 */}
          <div className="card">
            <div className="card-header">复查信息</div>
            <div className="card-body">
              <div className="detail-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="detail-item">
                  <span className="detail-label">复查编号</span>
                  <span className="detail-value">#{data.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">店铺</span>
                  <span className="detail-value">{data.store_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">品牌</span>
                  <span className="detail-value">{data.brand}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">关联整改单</span>
                  <span className="detail-value">
                    <button
                      className="link-btn"
                      onClick={() => navigate(`/rectifications/${data.rectification_id}`)}
                    >
                      #{data.rectification_id}
                    </button>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">创建时间</span>
                  <span className="detail-value">{formatTime(data.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 复查填写弹窗 */}
      {showReviewForm && (
        <div className="modal-overlay" onClick={() => setShowReviewForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">填写闭店复查结果</div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label required">复查结果</label>
                <div className="radio-group">
                  <label className="radio-item">
                    <input
                      type="radio"
                      checked={reviewResult === 'passed'}
                      onChange={() => setReviewResult('passed')}
                    />
                    <span>通过 ✅</span>
                  </label>
                  <label className="radio-item">
                    <input
                      type="radio"
                      checked={reviewResult === 'rejected'}
                      onChange={() => setReviewResult('rejected')}
                    />
                    <span>未通过 ❌（需重新整改）</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">复查意见</label>
                <textarea
                  className="textarea"
                  placeholder="请详细描述现场复查情况..."
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="form-hint">
                {reviewResult === 'passed'
                  ? '复查通过后，整改单将自动结案。'
                  : '复查未通过后，整改单将重新打开，需要店铺再次整改。'}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowReviewForm(false)}>取消</button>
              <button
                className={`btn ${reviewResult === 'passed' ? 'btn-success' : 'btn-primary'}`}
                onClick={handleSubmitReview}
                disabled={!reviewNote.trim()}
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewDetail;
