import React from 'react';
import { formatDate, getRoleLabel } from '../utils';

function HistoryList({ history, constants }) {
  if (!history || history.length === 0) {
    return <div className="empty-state">暂无历史记录</div>;
  }

  const { STATUS_LABELS = {}, ROLE_LABELS = {} } = constants || {};

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
                {getRoleLabel(item.operatorRole, ROLE_LABELS)}
              </span>
            )}
          </div>
          {(item.previousStatus || item.newStatus) && (
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              状态：
              {item.previousStatus && (
                <span className={`status-badge status-${item.previousStatus}`} style={{ marginRight: '8px' }}>
                  {STATUS_LABELS?.[item.previousStatus] || item.previousStatus}
                </span>
              )}
              →
              {item.newStatus && (
                <span className={`status-badge status-${item.newStatus}`} style={{ marginLeft: '8px' }}>
                  {STATUS_LABELS?.[item.newStatus] || item.newStatus}
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
