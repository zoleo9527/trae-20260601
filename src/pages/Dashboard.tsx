import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatsData, OperationLog, STATUS_LABELS, ROLE_LABELS } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { role, userName, roleLabel } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [role, userName]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?role=${role}&userName=${encodeURIComponent(userName)}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getLogIcon = (action: string) => {
    if (action === 'create') return '➕';
    if (action === 'update_status') return '🔄';
    if (action === 'comment') return '💬';
    if (action === 'review') return '✅';
    if (action === 'close') return '🎉';
    if (action === 'upload') return '📎';
    if (action === 'create_review') return '🔗';
    if (action === 'reopen') return '🔁';
    return '📝';
  };

  const getLogText = (log: OperationLog) => {
    const prefix = log.ref_type === 'rectification' ? '整改单' : '复查单';
    const refId = log.ref_id;

    switch (log.action) {
      case 'create':
        return `${log.operator_name} 创建了${prefix} #${refId}`;
      case 'update_status':
        return `${log.operator_name} 更新了${prefix}状态`;
      case 'comment':
        return `${log.operator_name} 在${prefix}中留言`;
      case 'review':
        return `${log.operator_name} 完成了${prefix}`;
      case 'close':
        return `${prefix} #${refId} 已结案`;
      case 'create_review':
        return `关联生成闭店复查单`;
      case 'reopen':
        return `复查未通过，${prefix}重新打开`;
      case 'assign':
        return log.detail || '指派负责人';
      case 'upload':
        return log.detail || '上传了附件';
      default:
        return log.detail || `${log.operator_name} 执行了操作`;
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            {getGreeting()}，{userName} 👋
          </div>
          <div className="page-subtitle">
            {roleLabel} 工作台 · 今日待办与风险提醒
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div
          className="stat-card stat-primary"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/rectifications?status=pending')}
        >
          <span className="stat-icon">📋</span>
          <div className="stat-value">{stats?.pendingRectCount || 0}</div>
          <div className="stat-label">待处理整改</div>
        </div>

        <div
          className="stat-card stat-warning"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/reviews?status=pending')}
        >
          <span className="stat-icon">✅</span>
          <div className="stat-value">{stats?.pendingReviewCount || 0}</div>
          <div className="stat-label">待闭店复查</div>
        </div>

        <div
          className="stat-card stat-danger risk-highlight"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/rectifications?severity=紧急')}
        >
          <span className="stat-icon">⚠️</span>
          <div className="stat-value">{stats?.riskCount || 0}</div>
          <div className="stat-label">风险项 (临期/紧急)</div>
        </div>

        <div
          className="stat-card stat-success"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/rectifications')}
        >
          <span className="stat-icon">📌</span>
          <div className="stat-value">{stats?.myTaskCount || 0}</div>
          <div className="stat-label">我的待办</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <span>最近变更</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/rectifications')}>
              查看全部 →
            </button>
          </div>
          <div className="card-body">
            {stats?.recentLogs && stats.recentLogs.length > 0 ? (
              <div className="recent-list">
                {stats.recentLogs.slice(0, 8).map(log => (
                  <div
                    key={log.id}
                    className="recent-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (log.ref_type === 'rectification') {
                        navigate(`/rectifications/${log.ref_id}`);
                      } else {
                        navigate(`/reviews/${log.ref_id}`);
                      }
                    }}
                  >
                    <div className="recent-dot" style={{ background: log.action === 'create' ? 'var(--success)' : log.action === 'review' ? 'var(--primary)' : 'var(--warning)' }}></div>
                    <div className="recent-content">
                      <div className="recent-text">
                        {getLogIcon(log.action)} {getLogText(log)}
                      </div>
                      <div className="recent-time">{formatTime(log.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">暂无变更记录</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span>快捷入口</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {role === 'ops_supervisor' && (
                <>
                  <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/rectifications/new')}>
                    ➕ 新建巡店整改单
                  </button>
                  <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/reviews?status=pending')}>
                    📝 处理待复查项
                  </button>
                </>
              )}
              {role === 'store_manager' && (
                <>
                  <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/rectifications?status=pending')}>
                    📋 查看我的整改任务
                  </button>
                  <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/reviews')}>
                    👀 查看复查记录
                  </button>
                </>
              )}
              {role === 'leasing_manager' && (
                <>
                  <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/rectifications?severity=紧急')}>
                    ⚠️ 重点关注风险项
                  </button>
                  <button className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/rectifications')}>
                    📊 查看整改进度总览
                  </button>
                </>
              )}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>状态说明</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <span key={key} className={`tag tag-${key === 'completed' ? 'success' : key === 'pending' ? 'warning' : 'primary'}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>使用提示</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                • 左侧可切换不同角色视角<br/>
                • 巡店整改 → 提交复查 → 闭店复查<br/>
                • 每条记录都有完整操作日志可追溯
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
