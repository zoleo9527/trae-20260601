import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auditService } from '../../services/auditService.js';
import { ACTION_TYPE_CONFIG, STATUS_CONFIG, ROLE_CONFIG } from '../../utils/constants.js';
import './AuditLogs.css';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await auditService.getAll({ limit: 100 });
      setLogs(response.data?.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action) => {
    return ACTION_TYPE_CONFIG[action]?.label || action;
  };

  const getActionColor = (action) => {
    return ACTION_TYPE_CONFIG[action]?.color || '#8c8c8c';
  };

  const getStatusLabel = (status) => {
    return STATUS_CONFIG[status]?.label || status;
  };

  const getRoleLabel = (role) => {
    return ROLE_CONFIG[role]?.label || role;
  };

  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }

  return (
    <div className="audit-logs-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">审计日志</h1>
          <p className="page-subtitle">查看所有业务操作的审计记录</p>
        </div>
      </div>

      <div className="logs-stats">
        <div className="stat-item">
          <span className="stat-value">{logs.length}</span>
          <span className="stat-label">总记录数</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {logs.filter(l => l.action_type === 'STATUS_CHANGE').length}
          </span>
          <span className="stat-label">状态变更</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {logs.filter(l => l.action_type === 'ABNORMAL_FLAG').length}
          </span>
          <span className="stat-label">异常标记</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {new Set(logs.map(l => l.operator_username)).size}
          </span>
          <span className="stat-label">操作人员</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>暂无审计日志</p>
        </div>
      ) : (
        <div className="logs-table">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>操作类型</th>
                <th>委托单号</th>
                <th>状态变更</th>
                <th>操作人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="time-cell">
                    {new Date(log.operate_time).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    <span
                      className="action-badge"
                      style={{ backgroundColor: getActionColor(log.action_type) }}
                    >
                      {getActionLabel(log.action_type)}
                    </span>
                  </td>
                  <td>
                    <Link to={`/delegations/${log.delegation_id}`} className="delegation-link">
                      #{log.delegation_id}
                    </Link>
                  </td>
                  <td className="status-cell">
                    {log.previous_status && log.new_status && (
                      <>
                        <span className="status-text">{getStatusLabel(log.previous_status)}</span>
                        <span className="arrow">→</span>
                        <span className="status-text">{getStatusLabel(log.new_status)}</span>
                      </>
                    )}
                    {log.previous_status && !log.new_status && (
                      <span className="status-text">{getStatusLabel(log.previous_status)}</span>
                    )}
                    {!log.previous_status && log.new_status && (
                      <span className="status-text">{getStatusLabel(log.new_status)}</span>
                    )}
                    {!log.previous_status && !log.new_status && (
                      <span className="no-status">-</span>
                    )}
                  </td>
                  <td>
                    <div className="operator-cell">
                      <span className="operator-name">{log.operator_name}</span>
                      <span className="operator-role">{getRoleLabel(log.operator_role)}</span>
                    </div>
                  </td>
                  <td className="remarks-cell">
                    {log.remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;
