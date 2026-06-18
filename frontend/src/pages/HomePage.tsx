import { useState, useEffect } from 'react';
import { User, ServiceRecord, ServiceCreateRequest } from '../types';
import { getTodayTasks, checkin, completeService, confirmDuration, rejectDuration, resetRecord, createServiceRecord } from '../api';
import { StatsCard } from '../components/StatsCard';
import { ServiceRecordCard } from '../components/ServiceRecordCard';
import { CheckinModal } from '../components/CheckinModal';
import { CompleteModal } from '../components/CompleteModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { RejectModal } from '../components/RejectModal';
import { CreateServiceModal } from '../components/CreateServiceModal';

interface HomePageProps {
  user: User;
}

type TabType = 'pending' | 'overdue' | 'rejected';

export function HomePage({ user }: HomePageProps) {
  const [tasks, setTasks] = useState<{
    pendingConfirm: ServiceRecord[];
    overdue: ServiceRecord[];
    recentlyRejected: ServiceRecord[];
    pendingCount: number;
    overdueCount: number;
    rejectedCount: number;
  }>({
    pendingConfirm: [],
    overdue: [],
    recentlyRejected: [],
    pendingCount: 0,
    overdueCount: 0,
    rejectedCount: 0,
  });

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loading, setLoading] = useState(true);

  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [currentRecordId, setCurrentRecordId] = useState<number | null>(null);
  const [currentDuration, setCurrentDuration] = useState<number | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const result = await getTodayTasks();
      setTasks(result);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (location: string) => {
    if (!currentRecordId) return;
    try {
      await checkin({ service_record_id: currentRecordId, checkin_location: location });
      setCheckinModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Checkin failed:', error);
    }
  };

  const handleComplete = async (endTime: string, duration: number) => {
    if (!currentRecordId) return;
    try {
      await completeService({ service_record_id: currentRecordId, end_time: endTime, duration });
      setCompleteModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Complete service failed:', error);
    }
  };

  const handleConfirm = async (duration: number, notes: string) => {
    if (!currentRecordId) return;
    try {
      await confirmDuration({ service_record_id: currentRecordId, confirmed_duration: duration, notes });
      setConfirmModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Confirm duration failed:', error);
    }
  };

  const handleReject = async (reason: string) => {
    if (!currentRecordId) return;
    try {
      await rejectDuration({ service_record_id: currentRecordId, reason });
      setRejectModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  const handleReset = async (id: number) => {
    if (window.confirm('确定要重置这条记录吗？所有签到和确认信息将被清除。')) {
      try {
        await resetRecord(id);
        refreshData();
      } catch (error) {
        console.error('Reset failed:', error);
      }
    }
  };

  const handleCreateService = async (data: ServiceCreateRequest) => {
    try {
      await createServiceRecord(data);
      setCreateModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Create service failed:', error);
    }
  };

  const openCheckinModal = (id: number) => {
    setCurrentRecordId(id);
    setCheckinModalOpen(true);
  };

  const openCompleteModal = (id: number) => {
    setCurrentRecordId(id);
    setCompleteModalOpen(true);
  };

  const openConfirmModal = (id: number, duration: number | null) => {
    setCurrentRecordId(id);
    setCurrentDuration(duration || 0);
    setConfirmModalOpen(true);
  };

  const openRejectModal = (id: number) => {
    setCurrentRecordId(id);
    setRejectModalOpen(true);
  };

  const canCreateService = user.role === 'social_worker';

  const records = {
    pending: tasks.pendingConfirm,
    overdue: tasks.overdue,
    rejected: tasks.recentlyRejected,
  };

  const tabLabels = {
    pending: '待确认时长',
    overdue: '超时未处理',
    rejected: '刚退回',
  };

  return (
    <div style={styles.container}>
      <div style={styles.statsRow}>
        <StatsCard
          title="待确认时长"
          count={tasks.pendingCount}
          color="#e91e63"
          icon="⏳"
          onClick={() => setActiveTab('pending')}
        />
        <StatsCard
          title="超时未处理"
          count={tasks.overdueCount}
          color="#f44336"
          icon="⚠️"
          onClick={() => setActiveTab('overdue')}
        />
        <StatsCard
          title="刚退回"
          count={tasks.rejectedCount}
          color="#ff9800"
          icon="↩️"
          onClick={() => setActiveTab('rejected')}
        />
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.tabs}>
            {(['pending', 'overdue', 'rejected'] as TabType[]).map((tab) => (
              <button
                key={tab}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab ? styles.tabButtonActive : {}),
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tabLabels[tab]}
                <span style={styles.tabCount}>{records[tab].length}</span>
              </button>
            ))}
          </div>
          {canCreateService && (
            <button style={styles.createButton} onClick={() => setCreateModalOpen(true)}>
              + 创建服务记录
            </button>
          )}
        </div>

        <div style={styles.list}>
          {loading ? (
            <div style={styles.loading}>加载中...</div>
          ) : records[activeTab].length === 0 ? (
            <div style={styles.empty}>暂无相关记录</div>
          ) : (
            records[activeTab].map((record) => (
              <ServiceRecordCard
                key={record.id}
                record={record}
                userRole={user.role}
                onCheckin={openCheckinModal}
                onComplete={openCompleteModal}
                onConfirm={(id) => openConfirmModal(id, record.duration)}
                onReject={openRejectModal}
                onReset={handleReset}
              />
            ))
          )}
        </div>
      </div>

      <CheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onSubmit={handleCheckin}
      />

      <CompleteModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onSubmit={handleComplete}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onSubmit={handleConfirm}
        currentDuration={currentDuration}
      />

      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onSubmit={handleReject}
      />

      <CreateServiceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateService}
      />
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  content: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
  },
  tabButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: '#f5f7fa',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    background: '#667eea',
    color: '#fff',
  },
  tabCount: {
    background: 'rgba(0,0,0,0.15)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
  },
  createButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    background: '#667eea',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  list: {
    padding: '16px',
    maxHeight: 'calc(100vh - 320px)',
    overflowY: 'auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    background: '#fafafa',
    borderRadius: '8px',
  },
};
