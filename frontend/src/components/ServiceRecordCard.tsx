import { ServiceRecord, UserRole } from '../types';

interface ServiceRecordCardProps {
  record: ServiceRecord;
  userRole: UserRole;
  onCheckin?: (id: number) => void;
  onComplete?: (id: number) => void;
  onConfirm?: (id: number) => void;
  onReject?: (id: number) => void;
  onReset?: (id: number) => void;
  onViewDetail?: (id: number) => void;
}

const statusLabels: Record<string, string> = {
  pending_checkin: '待签到',
  checked_in: '已签到',
  pending_confirm: '待确认',
  confirmed: '已确认',
  rejected: '已退回',
  cancelled: '已取消',
};

const statusColors: Record<string, string> = {
  pending_checkin: '#ff9800',
  checked_in: '#2196f3',
  pending_confirm: '#e91e63',
  confirmed: '#4caf50',
  rejected: '#f44336',
  cancelled: '#9e9e9e',
};

export function ServiceRecordCard({ record, userRole, onCheckin, onComplete, onConfirm, onReject, onReset, onViewDetail }: ServiceRecordCardProps) {
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const canCheckin = userRole === 'social_worker' && record.status === 'pending_checkin';
  const canComplete = userRole === 'social_worker' && record.status === 'checked_in';
  const canConfirm = (userRole === 'volunteer_leader' || userRole === 'community_officer') && record.status === 'pending_confirm';
  const canReject = (userRole === 'volunteer_leader' || userRole === 'community_officer') && record.status === 'pending_confirm';
  const canReset = (userRole === 'social_worker' || userRole === 'community_officer') && record.status !== 'confirmed';

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.serviceType}>{record.service_type}</div>
        <span style={{ ...styles.statusBadge, backgroundColor: statusColors[record.status] }}>
          {statusLabels[record.status]}
        </span>
      </div>
      
      <div style={styles.cardBody}>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>志愿者</span>
          <span style={styles.infoValue}>{record.volunteer_name} ({record.volunteer_phone})</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>服务日期</span>
          <span style={styles.infoValue}>{record.service_date}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>时间</span>
          <span style={styles.infoValue}>{record.start_time} - {record.end_time || '-'}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>时长</span>
          <span style={styles.infoValue}>{formatDuration(record.duration)}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>地点</span>
          <span style={styles.infoValue}>{record.location}</span>
        </div>
        {record.description && (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>描述</span>
            <span style={styles.infoValue}>{record.description}</span>
          </div>
        )}
        {record.reject_reason && (
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>退回原因</span>
            <span style={styles.rejectReason}>{record.reject_reason}</span>
          </div>
        )}
      </div>

      <div style={styles.cardFooter}>
        <div style={styles.meta}>
          <span style={styles.metaItem}>创建人: {record.creator_name}</span>
          <span style={styles.metaItem}>{record.created_at}</span>
        </div>
        <div style={styles.actions}>
          <button style={{ ...styles.actionButton, ...styles.detailButton }} onClick={() => onViewDetail?.(record.id)}>查看详情</button>
          {canCheckin && (
            <button style={styles.actionButton} onClick={() => onCheckin?.(record.id)}>签到</button>
          )}
          {canComplete && (
            <button style={styles.actionButton} onClick={() => onComplete?.(record.id)}>完成服务</button>
          )}
          {canConfirm && (
            <button style={{ ...styles.actionButton, ...styles.confirmButton }} onClick={() => onConfirm?.(record.id)}>确认时长</button>
          )}
          {canReject && (
            <button style={{ ...styles.actionButton, ...styles.rejectButton }} onClick={() => onReject?.(record.id)}>退回</button>
          )}
          {canReset && (
            <button style={{ ...styles.actionButton, ...styles.resetButton }} onClick={() => onReset?.(record.id)}>重置</button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    marginBottom: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  serviceType: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
  },
  infoLabel: {
    fontSize: '13px',
    color: '#999',
    width: '80px',
  },
  infoValue: {
    fontSize: '13px',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  rejectReason: {
    fontSize: '13px',
    color: '#f44336',
    flex: 1,
    textAlign: 'right',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaItem: {
    fontSize: '11px',
    color: '#999',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    background: '#fff',
    color: '#666',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  confirmButton: {
    borderColor: '#4caf50',
    background: '#e8f5e9',
    color: '#4caf50',
  },
  rejectButton: {
    borderColor: '#f44336',
    background: '#ffebee',
    color: '#f44336',
  },
  resetButton: {
    borderColor: '#9e9e9e',
    background: '#f5f5f5',
    color: '#666',
  },
  detailButton: {
    borderColor: '#667eea',
    background: '#f0f4ff',
    color: '#667eea',
  },
};
