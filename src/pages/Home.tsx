import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, ShieldAlert } from 'lucide-react';
import Header from '../components/Header';
import StatusTabs from '../components/StatusTabs';
import ReminderRow from '../components/ReminderRow';
import DetailPanel from '../components/DetailPanel';
import ScheduleModal from '../components/ScheduleModal';
import ExecuteModal from '../components/ExecuteModal';
import ConfirmFeeModal from '../components/ConfirmFeeModal';
import DisputeModal from '../components/DisputeModal';
import ReviewModal from '../components/ReviewModal';
import ResolveDisputeModal from '../components/ResolveDisputeModal';
import RiskModal from '../components/RiskModal';
import ResolveRiskModal from '../components/ResolveRiskModal';
import { useReminderStore } from '../store/reminder';
import { roleMap } from '../utils/format';

export default function Home() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    reminders,
    loading,
    selectedId,
    setSelectedId,
    loadReminders,
    loadUsers,
    currentRole,
    currentUserId,
    users,
  } = useReminderStore();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve');
  const [resolveDisputeOpen, setResolveDisputeOpen] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);
  const [resolveRiskOpen, setResolveRiskOpen] = useState(false);
  const [activeRiskId, setActiveRiskId] = useState('');

  useEffect(() => {
    loadReminders();
    loadUsers();
  }, []);

  useEffect(() => {
    if (id && id !== selectedId) {
      setSelectedId(id);
    }
  }, [id]);

  useEffect(() => {
    if (selectedId && selectedId !== id) {
      navigate(`/reminders/${selectedId}`, { replace: true });
    } else if (!selectedId && id) {
      navigate('/reminders', { replace: true });
    }
  }, [selectedId, id, navigate]);

  const selectedReminder = useMemo(
    () => reminders.find((r) => r.id === selectedId) || null,
    [reminders, selectedId]
  );

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId),
    [users, currentUserId]
  );

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <Header />
      <StatusTabs />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              共 <span className="font-semibold text-navy-800">{reminders.length}</span> 条记录
              <span className="mx-2 text-slate-300">|</span>
              当前身份：
              <span className={`ml-1 px-1.5 py-0.5 rounded-sm text-xs ${roleMap[currentRole].className}`}>
                {currentUser?.name || roleMap[currentRole].label}（{roleMap[currentRole].label}）
              </span>
            </div>
            <div className="text-xs text-slate-400">
              提示：状态口径统一，每一步流转都有明确责任人，杜绝责任空档
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && reminders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ClipboardList size={40} className="mb-3 opacity-40" />
                <div className="text-sm">加载中...</div>
              </div>
            ) : reminders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ClipboardList size={40} className="mb-3 opacity-40" />
                <div className="text-sm">暂无符合条件的补训记录</div>
              </div>
            ) : (
              <div className="bg-white min-h-full">
                <div className="grid grid-cols-12 gap-4 px-6 py-2.5 border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <div className="col-span-2">学员信息</div>
                  <div className="col-span-2">补训科目/原因</div>
                  <div className="col-span-1 text-center">课时</div>
                  <div className="col-span-1">状态</div>
                  <div className="col-span-2">当前责任人</div>
                  <div className="col-span-1 text-right">费用</div>
                  <div className="col-span-2 text-right">创建/安排时间</div>
                  <div className="col-span-1 text-right">操作</div>
                </div>
                {reminders.map((r) => (
                  <ReminderRow key={r.id} reminder={r} />
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedReminder && (
          <DetailPanel
            reminder={selectedReminder}
            onOpenSchedule={() => setScheduleOpen(true)}
            onOpenExecute={() => setExecuteOpen(true)}
            onOpenConfirmFee={() => setConfirmOpen(true)}
            onOpenDispute={() => setDisputeOpen(true)}
            onOpenReview={(type) => {
              setReviewType(type);
              setReviewOpen(true);
            }}
            onOpenResolveDispute={() => setResolveDisputeOpen(true)}
            onOpenMarkRisk={() => setRiskOpen(true)}
            onOpenResolveRisk={(riskId) => {
              setActiveRiskId(riskId);
              setResolveRiskOpen(true);
            }}
          />
        )}
      </div>

      <ScheduleModal
        open={scheduleOpen}
        reminderId={selectedId}
        onClose={() => setScheduleOpen(false)}
      />
      <ExecuteModal
        open={executeOpen}
        reminderId={selectedId}
        onClose={() => setExecuteOpen(false)}
      />
      <ConfirmFeeModal
        open={confirmOpen}
        reminder={selectedReminder}
        onClose={() => setConfirmOpen(false)}
      />
      <DisputeModal
        open={disputeOpen}
        reminderId={selectedId}
        onClose={() => setDisputeOpen(false)}
      />
      <ReviewModal
        open={reviewOpen}
        reminderId={selectedId}
        type={reviewType}
        onClose={() => setReviewOpen(false)}
      />
      <ResolveDisputeModal
        open={resolveDisputeOpen}
        reminderId={selectedId}
        onClose={() => setResolveDisputeOpen(false)}
      />
      <RiskModal
        open={riskOpen}
        reminderId={selectedId}
        onClose={() => setRiskOpen(false)}
      />
      <ResolveRiskModal
        open={resolveRiskOpen}
        reminderId={selectedId}
        riskId={activeRiskId}
        onClose={() => setResolveRiskOpen(false)}
      />
    </div>
  );
}
