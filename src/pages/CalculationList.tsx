import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  User,
  MapPin,
  AlertCircle,
  Clock,
  CheckCircle,
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
  { key: 'all', label: '全部' },
  { key: 'approved', label: '待计算' },
  { key: 'calculating', label: '计算中' },
  { key: 'completed', label: '已完成' },
];

export default function CalculationList() {
  const navigate = useNavigate();
  const { claims, handlers, currentUserId, getResponsibilityInfo } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<ClaimStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = handlers.find((h) => h.id === currentUserId);

  const calculationClaims = claims.filter((c) =>
    ['approved', 'calculating', 'completed'].includes(c.status)
  );

  const filteredClaims = calculationClaims
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
        calculating: 0,
        approved: 1,
        completed: 2,
      };
      const aPriority = statusPriority[a.status] ?? 99;
      const bPriority = statusPriority[b.status] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const stats = {
    total: calculationClaims.length,
    approved: calculationClaims.filter((c) => c.status === 'approved').length,
    calculating: calculationClaims.filter((c) => c.status === 'calculating').length,
    completed: calculationClaims.filter((c) => c.status === 'completed').length,
    my: calculationClaims.filter((c) => c.currentHandlerId === currentUserId && c.status !== 'completed').length,
  };

  const totalCalculatedAmount = calculationClaims
    .filter((c) => c.compensationCalc)
    .reduce((sum, c) => sum + (c.compensationCalc?.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">赔付计算工作台</h2>
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
                className="h-10 w-64 rounded-lg border border-slate-300 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <button className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm text-slate-600 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
              筛选
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
            <p className="mt-1 text-sm text-slate-500">全部案件</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.approved}</p>
            <p className="mt-1 text-sm text-slate-500">待计算</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.calculating}</p>
            <p className="mt-1 text-sm text-slate-500">计算中</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="mt-1 text-sm text-slate-500">已完成</p>
          </div>
          <div className="rounded-lg bg-rose-50 p-4 text-center">
            <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalCalculatedAmount)}</p>
            <p className="mt-1 text-sm text-slate-500">已计算金额</p>
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
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {tab.label}
              <span className="ml-1.5 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {tab.key === 'all'
                  ? stats.total
                  : stats[tab.key as keyof typeof stats]}
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
                onClick={() => navigate(`/calculation/${claim.id}`)}
                className={cn(
                  'group cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-lg',
                  claim.status === 'calculating' && 'border-purple-200 bg-purple-50/30',
                  claim.status === 'completed' && 'border-emerald-200',
                  isMine && claim.status !== 'completed' && 'ring-2 ring-emerald-200'
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
                      {isMine && claim.status !== 'completed' && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          我负责
                        </span>
                      )}
                      {claim.status === 'completed' && claim.compensationCalc && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle className="h-3 w-3" />
                          赔付 {formatCurrency(claim.compensationCalc.totalAmount)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-slate-700">
                      <span className="font-medium">{claim.claimantName}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span>{claim.accidentType}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="font-medium text-slate-900">
                        报案 {formatCurrency(claim.claimAmount)}
                      </span>
                      {claim.compensationCalc && (
                        <>
                          <span className="mx-2 text-slate-400">|</span>
                          <span className="font-medium text-emerald-600">
                            赔付 {formatCurrency(claim.compensationCalc.totalAmount)}
                          </span>
                        </>
                      )}
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

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                      <User className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">计算人</p>
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
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <MapPin className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">当前环节</p>
                      <p className="text-sm font-medium text-slate-800">
                        {responsibility.stuckPoint}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">停留时长</p>
                      <p className="text-sm font-medium text-slate-800">
                        {stuckInfo.duration.toFixed(1)} 小时
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <Calculator className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">流转步数</p>
                      <p className="text-sm font-medium text-slate-800">
                        {claim.workflowLogs.length} 步
                      </p>
                    </div>
                  </div>
                </div>

                {responsibility.reason && claim.status !== 'completed' && (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">原因说明：</p>
                    <p className="text-sm text-slate-700">{responsibility.reason}</p>
                  </div>
                )}

                {claim.compensationCalc && claim.compensationCalc.remark && (
                  <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-200">
                    <p className="text-xs text-emerald-600">计算说明：</p>
                    <p className="text-sm text-emerald-800">{claim.compensationCalc.remark}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <Calculator className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-slate-600">暂无符合条件的案件</p>
            <p className="mt-1 text-sm text-slate-500">请尝试调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}
