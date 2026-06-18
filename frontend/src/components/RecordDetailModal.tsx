import { ServiceRecord } from '../types';

interface CheckinRecord {
  id: number;
  service_record_id: number;
  checkin_time: string;
  checkin_location: string;
  checkin_by: number;
  created_at: string;
}

interface ConfirmRecord {
  id: number;
  service_record_id: number;
  confirm_time: string;
  confirmed_duration: number;
  confirmed_by: number;
  notes: string | null;
  created_at: string;
}

interface RecordDetail {
  checkin?: CheckinRecord;
  confirm?: ConfirmRecord;
}

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: (ServiceRecord & RecordDetail) | null;
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

export function RecordDetailModal({ isOpen, onClose, record }: RecordDetailModalProps) {
  if (!isOpen || !record) return null;

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('zh-CN');
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>服务记录详情</h3>
          <span style={{ ...styles.statusBadge, backgroundColor: statusColors[record.status] }}>
            {statusLabels[record.status]}
          </span>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>基本信息</h4>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>志愿者</span>
              <span style={styles.infoValue}>{record.volunteer_name}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>联系电话</span>
              <span style={styles.infoValue}>{record.volunteer_phone}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>服务类型</span>
              <span style={styles.infoValue}>{record.service_type}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>服务日期</span>
              <span style={styles.infoValue}>{record.service_date}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>开始时间</span>
              <span style={styles.infoValue}>{record.start_time}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>结束时间</span>
              <span style={styles.infoValue}>{record.end_time || '-'}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>服务时长</span>
              <span style={styles.infoValue}>{formatDuration(record.duration)}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>服务地点</span>
              <span style={styles.infoValue}>{record.location}</span>
            </div>
          </div>
          {record.description && (
            <div style={styles.description}>
              <span style={styles.infoLabel}>服务描述</span>
              <p style={styles.descriptionText}>{record.description}</p>
            </div>
          )}
        </div>

        {record.checkin && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>签到留痕</h4>
            <div style={styles.traceCard}>
              <div style={styles.traceRow}>
                <span style={styles.traceLabel}>签到时间</span>
                <span style={styles.traceValue}>{formatTime(record.checkin.checkin_time)}</span>
              </div>
              <div style={styles.traceRow}>
                <span style={styles.traceLabel}>签到地点</span>
                <span style={styles.traceValue}>{record.checkin.checkin_location}</span>
              </div>
              <div style={styles.traceRow}>
                <span style={styles.traceLabel}>记录时间</span>
                <span style={styles.traceValue}>{formatTime(record.checkin.created_at)}</span>
              </div>
            </div>
          </div>
        )}

        {record.confirm && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>确认留痕</h4>
            <div style={styles.traceCard}>
              <div style={styles.traceRow}>
                <span style={styles.traceLabel}>确认时间</span>
                <span style={styles.traceValue}>{formatTime(record.confirm.confirm_time)}</span>
              </div>
              <div style={styles.traceRow}>
                <span style={styles.traceLabel}>确认时长</span>
                <span style={styles.traceValue}>{formatDuration(record.confirm.confirmed_duration)}</span>
              </div>
              {record.confirm.notes && (
                <div style={styles.traceRow}>
                  <span style={styles.traceLabel}>备注</span>
                  <span style={styles.traceValue}>{record.confirm.notes}</span>
                </div>
              )}
              <div style={styles.traceRow}>
                <span style={styles.traceLabel}>记录时间</span>
                <span style={styles.traceValue}>{formatTime(record.confirm.created_at)}</span>
              </div>
            </div>
          </div>
        )}

        {record.status === 'rejected' && record.reject_reason && (
          <div style={styles.section}>
            <h4 style={{ ...styles.sectionTitle, color: '#f44336' }}>退回留痕</h4>
            <div style={{ ...styles.traceCard, borderColor: '#f44336' }}>
              <div style={styles.traceRow}>
                <span style={styles.traceLabel}>退回原因</span>
                <span style={{ ...styles.traceValue, color: '#f44336' }}>{record.reject_reason}</span>
              </div>
              <div style={styles.traceRow}>
                <span style={styles.traceLabel}>退回时间</span>
                <span style={styles.traceValue}>{formatTime(record.updated_at)}</span>
              </div>
            </div>
          </div>
        )}

        <div style={styles.footer}>
          <span style={styles.footerText}>创建时间: {formatTime(record.created_at)}</span>
          <span style={styles.footerText}>更新时间: {formatTime(record.updated_at)}</span>
        </div>

        <div style={styles.actions}>
          <button style={styles.closeButton} onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 12px 0',
    padding: '8px 12px',
    background: '#f5f7fa',
    borderRadius: '6px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#999',
  },
  infoValue: {
    fontSize: '14px',
    color: '#333',
  },
  description: {
    marginTop: '12px',
    padding: '12px',
    background: '#fafafa',
    borderRadius: '8px',
  },
  descriptionText: {
    fontSize: '14px',
    color: '#333',
    margin: '8px 0 0 0',
    lineHeight: '1.5',
  },
  traceCard: {
    padding: '12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    background: '#fff',
  },
  traceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  traceLabel: {
    fontSize: '13px',
    color: '#666',
  },
  traceValue: {
    fontSize: '13px',
    color: '#333',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderTop: '1px solid #f0f0f0',
    marginBottom: '16px',
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
  },
  closeButton: {
    padding: '12px 24px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
};