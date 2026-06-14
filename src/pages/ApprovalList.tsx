import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  User,
  MapPin,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  ROLE_LABELS,
} from '@/types';
import type { ClaimStatus } from '@/types';
import { formatCurrency, formatDateTime, calculateStuckPoint } from '@/utils/workflow';
import { cn } from '@/lib/utils';

const filterTabs: { key: ClaimStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部待处理' },
  { key: 'urged', label: '催办中' },
  { key: 'returned', label: '已退回' },
  { key: 'supplement', label: '补材料' },
  { key: 'pending', label: '待审批' },
];

export default function ApprovalList() {
  const navigate = useNavigate();
  const { claims, handlers, currentUserId, getResponsibilityInfo } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<ClaimStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = handlers.find((h) => h.id === currentUserId);

  const pendingClaims = claims.filter((c) => c.status !== 'completed' && c.status !== 'calculating' && c.status !== 'approved');

  const filteredClaims = pendingClaims
    .filter((claim) => {
      if (activeFilter === 'all') return true;
      return claim.status === activeFilter;
    })
    .filter((claim) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        claim.caseNumber.toLowerCase().includes(query) ||
        claim.claimantName.toLowerCase().includes(query) ||
        claim.accidentType.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const statusPriority: Record<string, number> = {
        urged: 0,
        returned: 1,
        supplement: 2,
        pending: 3,
      };
      const aPriority = statusPriority[a.status] ?? 99;
      const bPriority = statusPriority[b.status] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const stats = {
    total: pendingClaims.length,
    urged: pendingClaims.filter((c) => c.status === 'urged').length,
    returned: pendingClaims.filter((c) => c.status === 'returned').length,
    supplement: pendingClaims.filter((c) => c.status === 'supplement').length,
    pending: pendingClaims.filter((c) => c.status === 'pending').length,
    my: pendingClaims.filter((c) => c.currentHandlerId === currentUserId).length,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">核赔审批工作台</h2>
            <p className="mt-1 text-sm text-slate-500">
              当前用户：{currentUser?.name} ({currentUser?.role && ROLE_LABELS[currentUser.role]})
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索案件号、报案人、事故类型..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-64 rounded-lg border border-slate-300 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm text-slate-600 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
              筛选
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="mt-1 text-sm text-slate-500">全部待处理</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.urged}</p>
            <p className="mt-1 text-sm text-slate-500">催办中</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.returned}</p>
            <p className="mt-1 text-sm text-slate-500">已退回</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.supplement}</p>
            <p className="mt-1 text-sm text-slate-500">补材料</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-600">{stats.pending}</p>
            <p className="mt-1 text-sm text-slate-500">待审批</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.my}</p>
            <p className="mt-1 text-sm text-slate-500">我负责</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeFilter === tab.key
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {tab.label}
              <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {tab.key === 'all' ? stats.total : stats[tab.key as keyof typeof stats]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredClaims.length > 0 ? (
          filteredClaims.map((claim) => {
            const responsibility = getResponsibilityInfo(claim.id);
            const stuckInfo = calculateStuckPoint(claim, handlers);
            const currentHandler = handlers.find((h) => h.id === claim.currentHandlerId);
            const isMine = claim.currentHandlerId === currentUserId;

            return (
              <div
                key={claim.id}
                onClick={() => navigate(`/approval/${claim.id}`)}
                className={cn(
                  'group cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-lg',
                  claim.status === 'urged' && 'border-red-200 bg-red-50/30',
                  claim.status === 'returned' && 'border-amber-200',
                  claim.status === 'supplement' && 'border-blue-200',
                  isMine && 'ring-2 ring-emerald-200'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-slate-800">{claim.caseNumber}</span>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white',
                          STATUS_COLORS[claim.status]
                        )}
                      >
                        {STATUS_LABELS[claim.status]}
                      </span>
                      {isMine && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          我负责
                        </span>
                      )}
                      {claim.urgeCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          催办 {claim.urgeCount} 次
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-slate-700">
                      <span className="font-medium">{claim.claimantName}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span>{claim.accidentType}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(claim.claimAmount)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                      {claim.accidentDescription}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                    <span className="text-xs text-slate-400">
                      {formatDateTime(claim.updatedAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                      <User className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">当前处理人</p>
                      <div className="flex items-center gap-2">
                        {currentHandler && (
                          <img
                            src={currentHandler.avatar}
                            alt={currentHandler.name}
                            className="h-5 w-5 rounded-full"
                          />
                        )}
                        <span className="text-sm font-medium text-slate-800">
                          {responsibility.currentHandler?.name || '未分配'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({responsibility.currentHandler?.role
                            ? ROLE_LABELS[responsibility.currentHandler.role]
                            : ''})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <MapPin className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">卡点位置</p>
                      <p className="text-sm font-medium text-slate-800">
                        {responsibility.stuckPoint}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">停留时长</p>
                      <p className="text-sm font-medium text-slate-800">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {stuckInfo.duration.toFixed(1)} 小时
                      </p>
                    </div>
                  </div>
                </div>

                {responsibility.reason && (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">原因说明：</p>
                    <p className="text-sm text-slate-700">{responsibility.reason}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-slate-600">暂无符合条件的案件</p>
            <p className="mt-1 text-sm text-slate-500">请尝试调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}
