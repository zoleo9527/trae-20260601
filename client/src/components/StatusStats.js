import React from 'react';

const STATUS_ORDER = ['pending', 'processing', 'urged', 'returned', 'supplement_needed', 'closed'];

const STATUS_ICONS = {
  pending: '⏳',
  processing: '⚙️',
  urged: '🔥',
  returned: '↩️',
  supplement_needed: '📎',
  closed: '✅'
};

const ACTIVE_STATUSES = ['pending', 'processing', 'urged', 'returned', 'supplement_needed'];

function StatusStats({ data = [], statusLabels = {}, activeStatus, onStatusClick, onClearFilter }) {
  const stats = STATUS_ORDER.map(status => ({
    status,
    count: data.filter(item => item.status === status).length,
    label: statusLabels[status] || status
  }));

  const totalCount = data.length;
  const totalActive = data.filter(item => ACTIVE_STATUSES.includes(item.status)).length;

  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      marginBottom: '20px',
      flexWrap: 'wrap'
    }}>
      <div 
        onClick={() => onClearFilter && onClearFilter()}
        style={{
          flex: '0 0 auto',
          minWidth: '120px',
          padding: '16px',
          background: activeStatus === '' ? '#1e88e5' : '#fff',
          color: activeStatus === '' ? '#fff' : '#333',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: activeStatus === '' ? '2px solid #1e88e5' : '2px solid transparent'
        }}
      >
        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
          {totalCount}
        </div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>
          全部
        </div>
        {totalActive > 0 && (
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
            待处理 {totalActive} 项
          </div>
        )}
      </div>

      {stats.map(({ status, count, label }) => (
        <div
          key={status}
          onClick={() => onStatusClick && onStatusClick(status)}
          style={{
            flex: '0 0 auto',
            minWidth: '120px',
            padding: '16px',
            background: activeStatus === status ? '#fff' : '#fafafa',
            borderRadius: '8px',
            boxShadow: activeStatus === status 
              ? '0 2px 8px rgba(30, 136, 229, 0.3)' 
              : '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: activeStatus === status 
              ? '2px solid #1e88e5' 
              : count > 0 
                ? '2px solid #e0e0e0' 
                : '2px solid #f0f0f0',
            opacity: count > 0 ? 1 : 0.5
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>{STATUS_ICONS[status]}</span>
            <span 
              className={`status-badge status-${status}`}
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              {label}
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#333' }}>
            {count}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatusStats;
