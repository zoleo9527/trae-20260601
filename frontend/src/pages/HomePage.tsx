import { useState, useEffect } from 'react';
import { User, ServiceRecord, ServiceCreateRequest, TodayTasksResponse } from '../types';
import { getTodayTasks, checkin, completeService, confirmDuration, rejectDuration, resetRecord, createServiceRecord, getServiceRecordById } from '../api';
import { StatsCard } from '../components/StatsCard';
import { ServiceRecordCard } from '../components/ServiceRecordCard';
import { CheckinModal } from '../components/CheckinModal';
import { CompleteModal } from '../components/CompleteModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { RejectModal } from '../components/RejectModal';
import { CreateServiceModal } from '../components/CreateServiceModal';
import { RecordDetailModal } from '../components/RecordDetailModal';

interface HomePageProps {
  user: User;
}

type SocialWorkerTab = 'pending_checkin' | 'checked_in' | 'overdue' | 'rejected';
type LeaderTab = 'pending_confirm' | 'overdue' | 'rejected';
type TabType = SocialWorkerTab | LeaderTab;

export function HomePage({ user }: HomePageProps) {
  const [tasks, setTasks] = useState<TodayTasksResponse>({
    pendingCheckin: [],
    checkedIn: [],
    pendingConfirm: [],
    overdue: [],
    recentlyRejected: [],
    pendingCheckinCount: 0,
    checkedInCount: 0,
    pendingConfirmCount: 0,
    overdueCount: 0,
    rejectedCount: 0,
  });

  const isSocialWorker = user.role === 'social_worker';
  const defaultTab = isSocialWorker ? 'pending_checkin' : 'pending_confirm';
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [loading, setLoading] = useState(true);

  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [currentRecordId, setCurrentRecordId] = useState<number | null>(null);
  const [currentDuration, setCurrentDuration] = useState<number | null>(null);
  const [currentRecordDetail, setCurrentRecordDetail] = useState<any>(null);

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

  const openDetailModal = async (id: number) => {
    try {
      const detail = await getServiceRecordById(id);
      setCurrentRecordDetail(detail);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to get record detail:', error);
    }
  };

  const socialWorkerTabs: { key: SocialWorkerTab; label: string; records: ServiceRecord[]; count: number; color: string }[] = [
    { key: 'pending_checkin', label: '待签到', records: tasks.pendingCheckin, count: tasks.pendingCheckinCount, color: '#ff9800' },
    { key: 'checked_in', label: '已签到待完成', records: tasks.checkedIn, count: tasks.checkedInCount, color: '#2196f3' },
    { key: 'overdue', label: '超时未处理', records: tasks.overdue, count: tasks.overdueCount, color: '#f44336' },
    { key: 'rejected', label: '刚退回', records: tasks.recentlyRejected, count: tasks.rejectedCount, color: '#9e9e9e' },
  ];

  const leaderTabs: { key: LeaderTab; label: string; records: ServiceRecord[]; count: number; color: string }[] = [
    { key: 'pending_confirm', label: '待确认时长', records: tasks.pendingConfirm, count: tasks.pendingConfirmCount, color: '#e91e63' },
    { key: 'overdue', label: '超时未处理', records: tasks.overdue, count: tasks.overdueCount, color: '#f44336' },
    { key: 'rejected', label: '刚退回', records: tasks.recentlyRejected, count: tasks.rejectedCount, color: '#9e9e9e' },
  ];

  const tabs = isSocialWorker ? socialWorkerTabs : leaderTabs;
  const currentTabData = tabs.find(t => t.key === activeTab) || tabs[0];

  return (
    <div style={styles.container}>
      <div style={styles.statsRow}>
        {tabs.map(tab => (
          <StatsCard
            key={tab.key}
            title={tab.label}
            count={tab.count}
            color={tab.color}
            icon={tab.key === 'pending_checkin' ? '📋' : tab.key === 'checked_in' ? '✅' : tab.key === 'pending_confirm' ? '⏳' : tab.key === 'overdue' ? '⚠️' : '↩️'}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.key ? { ...styles.tabButtonActive, background: tab.color } : {}),
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span style={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>
          {isSocialWorker && (
            <button style={styles.createButton} onClick={() => setCreateModalOpen(true)}>
              + 创建服务记录
            </button>
          )}
        </div>

        <div style={styles.list}>
          {loading ? (
            <div style={styles.loading}>加载中...</div>
          ) : currentTabData.records.length === 0 ? (
            <div style={styles.empty}>暂无相关记录</div>
          ) : (
            currentTabData.records.map((record) => (
              <ServiceRecordCard
                key={record.id}
                record={record}
                userRole={user.role}
                onCheckin={openCheckinModal}
                onComplete={openCompleteModal}
                onConfirm={(id) => openConfirmModal(id, record.duration)}
                onReject={openRejectModal}
                onReset={handleReset}
                onViewDetail={openDetailModal}
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

      <RecordDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        record={currentRecordDetail}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    flexWrap: 'wrap',
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