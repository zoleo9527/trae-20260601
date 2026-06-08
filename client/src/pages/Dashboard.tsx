import { AlertTriangle, ArrowUpDown, CheckCircle, ChevronRight, Clock, Plus, RefreshCw, Timer, Truck, UserCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { createComplaint, fetchComplaints, fetchUsers, resetData } from '../api';
import CreateComplaintModal from '../components/CreateComplaintModal';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import type { Complaint, ComplaintStatus, Role, User } from '../types';

interface DashboardProps {
  user: User;
  onSelectComplaint: (id: string) => void;
}

type SortMode = 'newest' | 'severity';

const SEVERITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const ROLE_LABELS: Record<Role, string> = {
  operator: '计调',
  guide: '导游',
  fleet: '车队调度',
  supervisor: '主管',
};

const STATUS_STATS: { status: ComplaintStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { status: 'registered', label: '已登记', icon: <Clock className="w-4 h-4" />, color: 'text-blue-600' },
  { status: 'assigned', label: '已指派', icon: <Users className="w-4 h-4" />, color: 'text-purple-600' },
  { status: 'processing', label: '处理中', icon: <RefreshCw className="w-4 h-4" />, color: 'text-amber-600' },
  { status: 'compensating', label: '补偿中', icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-600' },
  { status: 'closed', label: '已关闭', icon: <CheckCircle className="w-4 h-4" />, color: 'text-slate-500' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

function isOverdue(complaint: Complaint): boolean {
  if (!complaint.dueDate || complaint.status === 'closed') return false;
  return new Date(complaint.dueDate) < new Date();
}

function isApproachingDue(complaint: Complaint): boolean {
  if (!complaint.dueDate || complaint.status === 'closed') return false;
  const diff = new Date(complaint.dueDate).getTime() - Date.now();
  return diff > 0 && diff < 2 * 3600000;
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

export default function Dashboard({ user, onSelectComplaint }: DashboardProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [slaFilter, setSlaFilter] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [drillDownUserId, setDrillDownUserId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const filters: { status?: string; overdue?: boolean } = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (overdueOnly) filters.overdue = true;
      const [data, users] = await Promise.all([fetchComplaints(filters), fetchUsers()]);
      setComplaints(data);
      setAllUsers(users);
    } catch (err) {
      console.error('加载投诉列表失败', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, overdueOnly]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const handleCreate = async (data: {
    title: string;
    description: string;
    tourGroup: string;
    complaintType: string;
    severity: string;
  }) => {
    try {
      setCreating(true);
      await createComplaint(data as any);
      setShowCreate(false);
      loadComplaints();
    } catch (err) {
      console.error('创建投诉失败', err);
    } finally {
      setCreating(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetData();
      loadComplaints();
    } catch (err) {
      console.error('重置数据失败', err);
    }
  };

  const sorted = [...complaints].sort((a, b) => {
    if (sortMode === 'severity') {
      return (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const overdueCount = complaints.filter(isOverdue).length;
  const statsByStatus = STATUS_STATS.map((s) => ({
    ...s,
    count: complaints.filter((c) => c.status === s.status).length,
  }));

  const assigneeUsers = allUsers.filter((u) => u.role === 'guide' || u.role === 'fleet');
  const assigneeStats = assigneeUsers.map((u) => {
    const userComplaints = complaints.filter((c) => c.assignedTo === u.id && c.status !== 'closed');
    const overdueComplaints = userComplaints.filter(isOverdue);
    const approachingComplaints = userComplaints.filter(isApproachingDue);
    return {
      user: u,
      activeCount: userComplaints.length,
      overdueCount: overdueComplaints.length,
      approachingCount: approachingComplaints.length,
    };
  }).filter((s) => s.activeCount > 0);

  const displayComplaints = (drillDownUserId
    ? sorted.filter((c) => c.assignedTo === drillDownUserId)
    : sorted
  ).filter((c) => !slaFilter || isApproachingDue(c));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">投诉看板</h2>
        <div className="flex items-center gap-2">
          {user.role === 'supervisor' && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              重置演示数据
            </button>
          )}
          {user.role === 'operator' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建投诉
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
          <div className="text-2xl font-bold text-slate-800">{complaints.length}</div>
          <div className="text-xs text-slate-500 mt-1">总计</div>
        </div>
        {statsByStatus.map((s) => (
          <div key={s.status} className="bg-white rounded-lg border border-slate-200 p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
              {s.icon}{s.label}
            </div>
          </div>
        ))}
        {overdueCount > 0 && (
          <div className="bg-red-50 rounded-lg border border-red-200 p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <div className="text-xs text-red-500 mt-1 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />已逾期
            </div>
          </div>
        )}
      </div>

      {drillDownUserId && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setDrillDownUserId(null)}
            className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
          >
            ← 返回全部投诉
          </button>
          <span className="text-sm text-slate-400">|</span>
          <span className="text-sm text-slate-700 font-medium">
            {allUsers.find((u) => u.id === drillDownUserId)?.name} 的在办投诉
          </span>
        </div>
      )}

      {assigneeStats.length > 0 && (user.role === 'supervisor' || user.role === 'operator') && !drillDownUserId && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">处理人在办情况</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {assigneeStats.map((s) => (
              <button
                key={s.user.id}
                onClick={() => setDrillDownUserId(s.user.id)}
                className={`text-left bg-white rounded-lg border p-3 hover:shadow-md transition-all ${
                  s.overdueCount > 0 ? 'border-orange-200 hover:border-orange-300' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className={`w-4 h-4 ${s.user.role === 'guide' ? 'text-purple-500' : 'text-blue-500'}`} />
                    <span className="font-medium text-sm text-slate-800">{s.user.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {ROLE_LABELS[s.user.role]}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <span className="text-slate-600">在办 <span className="font-bold text-slate-800">{s.activeCount}</span></span>
                  {s.approachingCount > 0 && (
                    <span className="text-amber-600">即将逾期 <span className="font-bold">{s.approachingCount}</span></span>
                  )}
                  {s.overdueCount > 0 && (
                    <span className="text-red-600">逾期 <span className="font-bold">{s.overdueCount}</span></span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="registered">已登记</option>
          <option value="assigned">已指派</option>
          <option value="processing">处理中</option>
          <option value="compensating">补偿中</option>
          <option value="closed">已关闭</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
          <AlertTriangle className="w-4 h-4 text-red-500" />
          仅看逾期
        </label>
        <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={slaFilter}
            onChange={(e) => setSlaFilter(e.target.checked)}
            className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          <Timer className="w-4 h-4 text-amber-500" />
          SLA&lt;2h
        </label>
        <button
          onClick={() => setSortMode(sortMode === 'newest' ? 'severity' : 'newest')}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 px-2 py-1 hover:bg-slate-100 rounded transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortMode === 'newest' ? '按时间' : '按严重程度'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : displayComplaints.length === 0 ? (
        <div className="text-center py-12 text-slate-400">暂无投诉记录</div>
      ) : (
        <div className="space-y-3">
          {displayComplaints.map((c) => {
            const overdue = isOverdue(c);
            const sla = getSLALabel(c.dueDate, c.status);
            return (
              <button
                key={c.id}
                onClick={() => onSelectComplaint(c.id)}
                className={`w-full text-left bg-white rounded-lg border p-4 hover:shadow-md transition-all ${
                  overdue ? 'border-red-300 hover:border-red-400' : sla.variant === 'warning' ? 'border-amber-300 hover:border-amber-400' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 truncate">{c.title}</span>
                      <SeverityBadge severity={c.severity} />
                      <StatusBadge status={c.status} />
                      {overdue && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          <AlertTriangle className="w-3 h-3" />已逾期
                        </span>
                      )}
                      {!overdue && sla.variant === 'warning' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          <Timer className="w-3 h-3" />{sla.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />{c.tourGroup}
                      </span>
                      {c.assignedToName && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />{c.assignedToName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{timeAgo(c.createdAt)}
                      </span>
                    </div>
                  </div>
                  {sla.variant === 'normal' && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      <Clock className="w-3 h-3" />{sla.text}
                    </span>
                  )}
                  {overdue && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-bold shrink-0">
                      <AlertTriangle className="w-3 h-3" />{sla.text}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CreateComplaintModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        loading={creating}
      />
    </div>
  );
}
