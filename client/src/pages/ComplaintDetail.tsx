import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  Send,
  UserCheck,
  RefreshCw,
  FileText,
  AlertTriangle,
  Clock,
  DollarSign,
  RotateCcw,
  ArrowRightLeft,
  History,
  Timer,
  Star,
  PhoneCall,
} from 'lucide-react';
import type { User, Complaint, AssignTarget, ComplaintStatus, CompensationType, Role } from '../types';
import {
  fetchComplaint,
  assignComplaint,
  reassignComplaint,
  addNote,
  changeStatus,
  proposeCompensation,
  reviewCompensation,
  executeCompensation,
  followUpComplaint,
  fetchUsers,
} from '../api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';

interface ComplaintDetailProps {
  id: string;
  user: User;
  onBack: () => void;
}

const ROLE_LABELS: Record<Role, string> = {
  operator: '计调',
  guide: '导游',
  fleet: '车队调度',
  supervisor: '主管',
};

const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  service: '服务态度',
  transport: '交通问题',
  accommodation: '住宿问题',
  food: '餐饮问题',
  schedule: '行程问题',
  other: '其他',
};

const COMPENSATION_TYPE_LABELS: Record<CompensationType, string> = {
  refund: '退款',
  discount: '折扣',
  gift: '赠品',
  upgrade: '升级',
  apology_letter: '致歉信',
  other: '其他',
};

const COMPENSATION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  proposed: { label: '待审批', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已批准', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  executed: { label: '已执行', color: 'bg-slate-100 text-slate-600' },
};

const TIMELINE_ICON_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
  created: { icon: <FileText className="w-4 h-4" />, color: 'bg-blue-500' },
  assigned: { icon: <UserCheck className="w-4 h-4" />, color: 'bg-purple-500' },
  reassigned: { icon: <ArrowRightLeft className="w-4 h-4" />, color: 'bg-indigo-500' },
  note: { icon: <FileText className="w-4 h-4" />, color: 'bg-slate-400' },
  status_change: { icon: <RefreshCw className="w-4 h-4" />, color: 'bg-amber-500' },
  compensation_proposed: { icon: <DollarSign className="w-4 h-4" />, color: 'bg-emerald-500' },
  compensation_approved: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500' },
  compensation_rejected: { icon: <XCircle className="w-4 h-4" />, color: 'bg-red-500' },
  compensation_executed: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-teal-500' },
  closed: { icon: <CheckCircle className="w-4 h-4" />, color: 'bg-slate-400' },
  reopened: { icon: <RotateCcw className="w-4 h-4" />, color: 'bg-orange-500' },
  follow_up: { icon: <PhoneCall className="w-4 h-4" />, color: 'bg-pink-500' },
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getSLALabel(dueDate?: string, status?: ComplaintStatus): { text: string; variant: 'normal' | 'warning' | 'overdue' | 'none' } {
  if (!dueDate || status === 'closed') return { text: '', variant: 'none' };
  const diff = new Date(dueDate).getTime() - Date.now();
  if (diff <= 0) {
    const overdueMs = -diff;
    const hours = Math.floor(overdueMs / 3600000);
    const minutes = Math.floor((overdueMs % 3600000) / 60000);
    if (hours > 0) return { text: `已逾期 ${hours}h${minutes}m`, variant: 'overdue' };
    return { text: `已逾期 ${minutes}m`, variant: 'overdue' };
  }
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (diff < 2 * 3600000) {
    if (hours > 0) return { text: `剩余 ${hours}h${minutes}m`, variant: 'warning' };
    return { text: `剩余 ${minutes}m`, variant: 'warning' };
  }
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return { text: `剩余 ${days}d${hours % 24}h`, variant: 'normal' };
  }
  return { text: `剩余 ${hours}h${minutes}m`, variant: 'normal' };
}

export default function ComplaintDetail({ id, user, onBack }: ComplaintDetailProps) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const [noteContent, setNoteContent] = useState('');
  const [assignRole, setAssignRole] = useState<AssignTarget>('guide');
  const [assignTo, setAssignTo] = useState('');
  const [compType, setCompType] = useState<CompensationType>('refund');
  const [compAmount, setCompAmount] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [reassignRole, setReassignRole] = useState<AssignTarget>('guide');
  const [reassignTo, setReassignTo] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpRating, setFollowUpRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [c, u] = await Promise.all([fetchComplaint(id), fetchUsers()]);
      setComplaint(c);
      setUsers(u);
    } catch (err) {
      console.error('加载投诉详情失败', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAssign = async () => {
    if (!assignTo) return;
    try {
      setSubmitting(true);
      const updated = await assignComplaint(id, { assignedRole: assignRole, assignedTo: assignTo });
      setComplaint(updated);
      setAssignTo('');
    } catch (err) {
      console.error('指派失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignTo || !reassignReason.trim()) return;
    try {
      setSubmitting(true);
      const updated = await reassignComplaint(id, {
        assignedRole: reassignRole,
        assignedTo: reassignTo,
        reason: reassignReason.trim(),
      });
      setComplaint(updated);
      setReassignTo('');
      setReassignReason('');
    } catch (err) {
      console.error('转派失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      setSubmitting(true);
      const updated = await addNote(id, noteContent.trim());
      setComplaint(updated);
      setNoteContent('');
    } catch (err) {
      console.error('添加备注失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (status: ComplaintStatus) => {
    try {
      setSubmitting(true);
      const updated = await changeStatus(id, status);
      setComplaint(updated);
    } catch (err) {
      console.error('更改状态失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposeCompensation = async () => {
    if (!compAmount || !compDesc.trim()) return;
    try {
      setSubmitting(true);
      const updated = await proposeCompensation(id, {
        type: compType,
        amount: parseFloat(compAmount),
        description: compDesc.trim(),
      });
      setComplaint(updated);
      setCompAmount('');
      setCompDesc('');
    } catch (err) {
      console.error('提出补偿方案失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewCompensation = async (action: 'approve' | 'reject') => {
    try {
      setSubmitting(true);
      const updated = await reviewCompensation(id, {
        action,
        rejectionReason: action === 'reject' ? rejectReason : undefined,
      });
      setComplaint(updated);
      setRejectReason('');
    } catch (err) {
      console.error('审批补偿失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCompensation = async () => {
    try {
      setSubmitting(true);
      const updated = await executeCompensation(id);
      setComplaint(updated);
    } catch (err) {
      console.error('执行补偿失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpNote.trim() || followUpRating === 0) return;
    try {
      setSubmitting(true);
      const updated = await followUpComplaint(id, {
        note: followUpNote.trim(),
        satisfactionRating: followUpRating,
      });
      setComplaint(updated);
      setFollowUpNote('');
      setFollowUpRating(0);
    } catch (err) {
      console.error('提交回访失败', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !complaint) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="text-center py-12 text-slate-400">加载中...</div>
      </div>
    );
  }

  const sla = getSLALabel(complaint.dueDate, complaint.status);
  const assignableUsers = users.filter((u) =>
    assignRole === 'guide' ? u.role === 'guide' : u.role === 'fleet'
  );
  const reassignableUsers = users.filter((u) =>
    reassignRole === 'guide' ? u.role === 'guide' : u.role === 'fleet'
  );
  const isAssignedToMe =
    complaint.assignedTo === user.id;
  const canAssign = user.role === 'operator' && complaint.status === 'registered';
  const canReassign = (user.role === 'operator' || user.role === 'supervisor') && (complaint.status === 'assigned' || complaint.status === 'processing');
  const canAddNoteOnAssigned = isAssignedToMe && complaint.status === 'assigned';
  const canAddNoteProcessing = (user.role === 'operator' || isAssignedToMe) && complaint.status === 'processing';
  const canProposeCompensation = user.role === 'operator' && complaint.status === 'processing';
  const canReviewCompensation = user.role === 'supervisor' && complaint.status === 'compensating' && complaint.compensation?.status === 'proposed';
  const canExecuteCompensation = user.role === 'operator' && complaint.status === 'compensating' && complaint.compensation?.status === 'approved';
  const canReopen = user.role === 'supervisor' && complaint.status === 'closed';
  const canFollowUp = user.role === 'supervisor' && complaint.status === 'closed' && !complaint.followUp;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800 truncate">{complaint.title}</h2>
        <SeverityBadge severity={complaint.severity} size="md" />
        <StatusBadge status={complaint.status} size="md" />
        {sla.variant === 'overdue' && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-bold">
            <AlertTriangle className="w-3 h-3" />{sla.text}
          </span>
        )}
        {sla.variant === 'warning' && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
            <Timer className="w-3 h-3" />{sla.text}
          </span>
        )}
        {sla.variant === 'normal' && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
            <Clock className="w-3 h-3" />{sla.text}
          </span>
        )}
      </div>

      {complaint.status === 'closed' && !complaint.followUp && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <PhoneCall className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">该投诉已关闭但尚未完成客户回访，请尽快填写回访说明和满意度评分。</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500">旅游团组</span>
            <div className="font-medium text-slate-800 mt-0.5">{complaint.tourGroup}</div>
          </div>
          <div>
            <span className="text-slate-500">投诉类型</span>
            <div className="font-medium text-slate-800 mt-0.5">{COMPLAINT_TYPE_LABELS[complaint.complaintType] || complaint.complaintType}</div>
          </div>
          <div>
            <span className="text-slate-500">登记人</span>
            <div className="font-medium text-slate-800 mt-0.5">{complaint.createdByName}</div>
          </div>
          <div>
            <span className="text-slate-500">处理人</span>
            <div className="font-medium text-slate-800 mt-0.5">{complaint.assignedToName || '—'}</div>
          </div>
        </div>
        <div className="mt-3 text-sm">
          <span className="text-slate-500">描述</span>
          <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{complaint.description}</p>
        </div>
        {complaint.assignmentHistory && complaint.assignmentHistory.length > 1 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-2">
              <History className="w-3.5 h-3.5" />指派历史
            </h4>
            <div className="space-y-2">
              {complaint.assignmentHistory.map((entry, idx) => {
                const roleLabel = entry.assignedRole === 'guide' ? '导游' : '车队调度';
                const isCurrent = !entry.removedAt;
                return (
                  <div key={idx} className={`text-xs p-2 rounded ${isCurrent ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{entry.assignedToName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{roleLabel}</span>
                      {isCurrent && <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">当前</span>}
                    </div>
                    <div className="text-slate-500 mt-1">
                      由 {entry.assignedByName} 指派 · {formatTime(entry.assignedAt)}
                    </div>
                    {entry.removedAt && (
                      <div className="text-slate-500">
                        由 {entry.removedByName} 转出 · {formatTime(entry.removedAt)}
                        {entry.reason && <span className="ml-1 text-slate-600">原因：{entry.reason}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {complaint.followUp && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1.5 mb-2">
              <PhoneCall className="w-3.5 h-3.5" />客户回访
            </h4>
            <div className={`text-xs p-3 rounded border ${complaint.followUp.satisfactionRating <= 2 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`flex items-center gap-0.5 ${complaint.followUp.satisfactionRating <= 2 ? 'text-orange-500' : 'text-green-500'}`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-4 h-4 ${i <= complaint.followUp!.satisfactionRating ? 'fill-current' : ''}`} />
                  ))}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${complaint.followUp.satisfactionRating <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                  {complaint.followUp.satisfactionRating}/5
                </span>
              </div>
              <p className="text-slate-700">{complaint.followUp.note}</p>
              <div className="text-slate-500 mt-2">
                回访人：{complaint.followUp.followedUpByName} · {formatTime(complaint.followUp.followedUpAt)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />处理时间线
              </h3>
            </div>
            <div className="p-4 space-y-0">
              {complaint.timeline.map((event, idx) => {
                const config = TIMELINE_ICON_MAP[event.type] || TIMELINE_ICON_MAP.note;
                return (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${config.color}`}>
                        {config.icon}
                      </div>
                      {idx < complaint.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-slate-800">{event.authorName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {ROLE_LABELS[event.role]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap break-words">{event.content}</p>
                      <span className="text-xs text-slate-400">{formatTime(event.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              {complaint.timeline.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">暂无处理记录</p>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-96 shrink-0 space-y-4">
          {complaint.compensation && (
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />补偿方案
                </h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">类型</span>
                  <span className="font-medium text-slate-800">
                    {COMPENSATION_TYPE_LABELS[complaint.compensation.type]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">金额</span>
                  <span className="font-medium text-slate-800">¥{complaint.compensation.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">状态</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${COMPENSATION_STATUS_CONFIG[complaint.compensation.status]?.color || ''}`}>
                    {COMPENSATION_STATUS_CONFIG[complaint.compensation.status]?.label || complaint.compensation.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">说明</span>
                  <p className="text-slate-700 mt-0.5">{complaint.compensation.description}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">提出人</span>
                  <span className="text-slate-700">{complaint.compensation.proposedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">提出时间</span>
                  <span className="text-slate-700">{formatTime(complaint.compensation.proposedAt)}</span>
                </div>
                {complaint.compensation.approvedByName && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">审批人</span>
                      <span className="text-slate-700">{complaint.compensation.approvedByName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">审批时间</span>
                      <span className="text-slate-700">{formatTime(complaint.compensation.approvedAt!)}</span>
                    </div>
                  </>
                )}
                {complaint.compensation.rejectionReason && (
                  <div>
                    <span className="text-slate-500">驳回原因</span>
                    <p className="text-red-600 mt-0.5">{complaint.compensation.rejectionReason}</p>
                  </div>
                )}
                {complaint.compensation.executedAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">执行时间</span>
                    <span className="text-slate-700">{formatTime(complaint.compensation.executedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />操作
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {canAssign && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">指派处理</h4>
                  <div className="flex gap-2">
                    <select
                      value={assignRole}
                      onChange={(e) => {
                        setAssignRole(e.target.value as AssignTarget);
                        setAssignTo('');
                      }}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="guide">导游</option>
                      <option value="fleet">车队调度</option>
                    </select>
                  </div>
                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择人员</option>
                    {assignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!assignTo || submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />指派
                  </button>
                </div>
              )}

              {canReassign && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">转派处理人</h4>
                  <p className="text-xs text-amber-600">转派后状态将回退为「已指派」，新处理人需重新添加备注</p>
                  <select
                    value={reassignRole}
                    onChange={(e) => {
                      setReassignRole(e.target.value as AssignTarget);
                      setReassignTo('');
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="guide">导游</option>
                    <option value="fleet">车队调度</option>
                  </select>
                  <select
                    value={reassignTo}
                    onChange={(e) => setReassignTo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">选择新处理人</option>
                    {reassignableUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <textarea
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="转派原因（必填）..."
                  />
                  <button
                    onClick={handleReassign}
                    disabled={!reassignTo || !reassignReason.trim() || submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ArrowRightLeft className="w-4 h-4" />确认转派
                  </button>
                </div>
              )}

              {canAddNoteOnAssigned && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">添加处理备注</h4>
                  <p className="text-xs text-amber-600">首次添加备注将自动进入"处理中"状态</p>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="记录处理情况..."
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />提交备注
                  </button>
                </div>
              )}

              {canAddNoteProcessing && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">添加备注</h4>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="添加处理备注..."
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />提交备注
                  </button>
                </div>
              )}

              {canProposeCompensation && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">提出补偿方案</h4>
                  <select
                    value={compType}
                    onChange={(e) => setCompType(e.target.value as CompensationType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(COMPENSATION_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={compAmount}
                    onChange={(e) => setCompAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="金额"
                    min="0"
                    step="0.01"
                  />
                  <textarea
                    value={compDesc}
                    onChange={(e) => setCompDesc(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="补偿说明..."
                  />
                  <button
                    onClick={handleProposeCompensation}
                    disabled={!compAmount || !compDesc.trim() || submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <DollarSign className="w-4 h-4" />提出方案
                  </button>
                </div>
              )}

              {canReviewCompensation && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">审批补偿方案</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewCompensation('approve')}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />批准
                    </button>
                    <button
                      onClick={() => {
                        if (rejectReason.trim()) handleReviewCompensation('reject');
                      }}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />驳回
                    </button>
                  </div>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="驳回原因（驳回时必填）..."
                  />
                </div>
              )}

              {canExecuteCompensation && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">执行补偿</h4>
                  <button
                    onClick={handleExecuteCompensation}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />确认执行
                  </button>
                </div>
              )}

              {canReopen && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">重新打开</h4>
                  <button
                    onClick={() => handleChangeStatus('registered')}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />重新打开
                  </button>
                </div>
              )}

              {canFollowUp && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700">客户回访与满意度</h4>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFollowUpRating(i)}
                        className={`p-0.5 transition-colors ${i <= followUpRating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                      >
                        <Star className={`w-6 h-6 ${i <= followUpRating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                    {followUpRating > 0 && (
                      <span className="text-sm text-slate-600 ml-2">{followUpRating}/5</span>
                    )}
                  </div>
                  <textarea
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="回访说明（必填）..."
                  />
                  <button
                    onClick={handleFollowUp}
                    disabled={!followUpNote.trim() || followUpRating === 0 || submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <PhoneCall className="w-4 h-4" />提交回访
                  </button>
                </div>
              )}

              {user.role === 'supervisor' && complaint.status !== 'closed' && complaint.status !== 'registered' && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">主管操作</h4>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="添加备注..."
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || submitting}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 mt-2"
                  >
                    <Plus className="w-4 h-4" />添加备注
                  </button>
                </div>
              )}

              {!canAssign && !canReassign && !canAddNoteOnAssigned && !canAddNoteProcessing && !canProposeCompensation && !canReviewCompensation && !canExecuteCompensation && !canReopen && !canFollowUp && !(user.role === 'supervisor' && complaint.status !== 'closed') && (
                <p className="text-sm text-slate-400 text-center py-2">当前无可执行操作</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
