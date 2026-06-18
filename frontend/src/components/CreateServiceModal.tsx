import { useState, useEffect } from 'react';
import { Volunteer, ServiceCreateRequest } from '../types';
import { getVolunteers } from '../api';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceCreateRequest) => void;
}

export function CreateServiceModal({ isOpen, onClose, onSubmit }: CreateServiceModalProps) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [volunteer_id, setVolunteerId] = useState('');
  const [service_type, setServiceType] = useState('');
  const [service_date, setServiceDate] = useState('');
  const [start_time, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      getVolunteers().then(setVolunteers);
      const today = new Date().toISOString().split('T')[0];
      setServiceDate(today);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (volunteer_id && service_type && service_date && start_time && location) {
      onSubmit({
        volunteer_id: parseInt(volunteer_id, 10),
        service_type,
        service_date,
        start_time,
        location,
        description,
      });
      setVolunteerId('');
      setServiceType('');
      setServiceDate('');
      setStartTime('');
      setLocation('');
      setDescription('');
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>创建服务记录</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>志愿者</label>
            <select
              value={volunteer_id}
              onChange={(e) => setVolunteerId(e.target.value)}
              style={styles.select}
            >
              <option value="">请选择志愿者</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>{v.name} ({v.phone})</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>服务类型</label>
            <input
              type="text"
              value={service_type}
              onChange={(e) => setServiceType(e.target.value)}
              style={styles.input}
              placeholder="如：社区清洁、老人陪护"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>服务日期</label>
            <input
              type="date"
              value={service_date}
              onChange={(e) => setServiceDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>开始时间</label>
            <input
              type="time"
              value={start_time}
              onChange={(e) => setStartTime(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>服务地点</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={styles.input}
              placeholder="请输入服务地点"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>描述（可选）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              placeholder="请输入服务描述"
              rows={2}
            />
          </div>
          <div style={styles.actions}>
            <button type="button" style={styles.cancelButton} onClick={onClose}>取消</button>
            <button type="submit" style={styles.submitButton}>创建记录</button>
          </div>
        </form>
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
    maxWidth: '480px',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    background: '#667eea',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
};
