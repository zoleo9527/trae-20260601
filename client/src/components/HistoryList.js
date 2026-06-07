import React from 'react';
import { formatDate, getRoleLabel } from '../utils';

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

function HistoryList({ history, constants }) {
  if (!history || history.length === 0) {
    return <div className="empty-state">暂无历史记录</div>;
  }

  const { statusLabels: STATUS_LABELS = DEFAULT_STATUS_LABELS, roleLabels: ROLE_LABELS = DEFAULT_ROLE_LABELS } = constants || {};
  
  const safeGetStatusLabel = (status) => {
    if (!status) return '';
    return STATUS_LABELS[status] || DEFAULT_STATUS_LABELS[status] || status;
  };
  
  const safeGetRoleLabel = (role) => {
    if (!role) return '';
    return ROLE_LABELS[role] || DEFAULT_ROLE_LABELS[role] || getRoleLabel(role, ROLE_LABELS) || role;
  };

  return (
    <div>
      {[...history].reverse().map((item, index) => (
        <div key={item.id || index} className="history-item">
          <div className="history-header">
            <span className="history-action">{item.action}</span>
            <span className="history-time">{formatDate(item.timestamp)}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
            操作人：{item.operator}
            {item.operatorRole && (
              <span className="assignee-role" style={{ marginLeft: '8px' }}>
                {safeGetRoleLabel(item.operatorRole)}
              </span>
            )}
          </div>
          {(item.previousStatus || item.newStatus) && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              状态：
              {item.previousStatus && (
                <span className={`status-badge status-${item.previousStatus}`} style={{ marginRight: '8px' }}>
                  {safeGetStatusLabel(item.previousStatus)}
                </span>
              )}
              →
              {item.newStatus && (
                <span className={`status-badge status-${item.newStatus}`} style={{ marginLeft: '8px' }}>
                  {safeGetStatusLabel(item.newStatus)}
                </span>
              )}
            </div>
          )}
          {item.remark && (
            <div className="history-remark">
              <span style={{ fontWeight: 500 }}>说明：</span>{item.remark}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default HistoryList;
