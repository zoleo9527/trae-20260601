import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Calculator,
  User,
  MapPin,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_TEXT_COLORS,
  ROLE_LABELS,
} from '@/types';
import type { ClaimStatus, Claim } from '@/types';
import { formatCurrency, formatDateTime, calculateStuckPoint } from '@/utils/workflow';
import { cn } from '@/lib/utils';

const statusOrder: ClaimStatus[] = [
  'urged',
  'returned',
  'supplement',
  'pending',
  'approved',
  'calculating',
  'completed',
];

interface StatusCardProps {
  status: ClaimStatus;
  count: number;
  claims: Claim[];
  onClick: () => void;
}

function StatusCard({ status, count, claims, onClick }: StatusCardProps) {
  const latestClaim = claims[0];
  const colorClass = STATUS_COLORS[status];
  const textColorClass = STATUS_TEXT_COLORS[status];

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('h-3 w-3 rounded-full', colorClass)} />
          <h3 className="font-bold text-slate-800">{STATUS_LABELS[status]}</h3>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-slate-900">{count}</span>
        <span className="text-sm text-slate-500">件</span>
      </div>
      {latestClaim && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {latestClaim.caseNumber}
            </span>
            <span className={cn('text-sm font-medium', textColorClass)}>
              {formatCurrency(latestClaim.claimAmount)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {latestClaim.claimantName} - {latestClaim.accidentType}
          </p>
          {latestClaim.urgeCount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3 w-3" />
              催办 {latestClaim.urgeCount} 次
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ClaimCardProps {
  claim: Claim;
  onClick: () => void;
}

function ClaimCard({ claim, onClick }: ClaimCardProps) {
  const navigate = useNavigate();
  const { handlers, getResponsibilityInfo } = useAppStore();
  const responsibility = getResponsibilityInfo(claim.id);
  const stuckInfo = calculateStuckPoint(claim, handlers);
  const currentHandler = handlers.find((h) => h.id === claim.currentHandlerId);

  const handleClick = () => {
    if (claim.status === 'calculating' || claim.status === 'approved') {
      navigate(`/calculation/${claim.id}`);
    } else {
      navigate(`/approval/${claim.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-lg',
        claim.status === 'urged' && 'border-red-200 bg-red-50/30',
        claim.status === 'returned' && 'border-amber-200',
        claim.status === 'supplement' && 'border-blue-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{claim.caseNumber}</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                STATUS_COLORS[claim.status]
              )}
            >
              {STATUS_LABELS[claim.status]}
            </span>
            {claim.urgeCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {claim.urgeCount}次催办
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {claim.claimantName} - {claim.accidentType}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">
            {formatCurrency(claim.claimAmount)}
          </p>
          <p className="text-xs text-slate-400">
            {formatDateTime(claim.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <User className="h-3.5 w-3.5" />
            <span>处理人</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {currentHandler && (
              <img
                src={currentHandler.avatar}
                alt={currentHandler.name}
                className="h-6 w-6 rounded-full"
              />
            )}
            <div>
              <p className="text-sm font-medium text-slate-800">
                {responsibility.currentHandler?.name || '未分配'}
              </p>
              <p className="text-xs text-slate-500">
                {responsibility.currentHandler?.role
                  ? ROLE_LABELS[responsibility.currentHandler.role]
                  : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            <span>卡点</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-slate-800">
            {responsibility.stuckPoint}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            已停留 {stuckInfo.duration.toFixed(1)} 小时
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>原因</span>
          </div>
          <p className="mt-1.5 text-sm text-slate-700 line-clamp-2">
            {responsibility.reason || '暂无'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          流转 {claim.workflowLogs.length} 步
        </div>
        <div className="flex items-center gap-1 text-sm text-blue-600 group-hover:text-blue-700">
          {claim.status === 'calculating' || claim.status === 'approved' ? (
            <>
              <Calculator className="h-4 w-4" />
              <span>去计算</span>
            </>
          ) : (
            <>
              <FileCheck className="h-4 w-4" />
              <span>去审批</span>
            </>
          )}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { claims, handlers, currentUserId, getResponsibilityInfo } = useAppStore();
  const [selectedStatus, setSelectedStatus] = useState<ClaimStatus | 'all'>('all');

  const currentUser = handlers.find((h) => h.id === currentUserId);

  const myClaims = claims.filter((c) => c.currentHandlerId === currentUserId);
  const myPendingClaims = myClaims.filter((c) => c.status !== 'completed');

  const claimsByStatus: Record<ClaimStatus, Claim[]> = {
    pending: [],
    urged: [],
    returned: [],
    supplement: [],
    approved: [],
    calculating: [],
    completed: [],
  };

  claims.forEach((claim) => {
    claimsByStatus[claim.status].push(claim);
  });

  const totalClaims = claims.length;
  const totalAmount = claims.reduce((sum, c) => sum + c.claimAmount, 0);

  const displayClaims =
    selectedStatus === 'all'
      ? [...claims].sort((a, b) => {
          const statusPriority: Record<ClaimStatus, number> = {
            urged: 0,
            returned: 1,
            supplement: 2,
            pending: 3,
            approved: 4,
            calculating: 5,
            completed: 6,
          };
          return statusPriority[a.status] - statusPriority[b.status];
        })
      : claimsByStatus[selectedStatus];

  const totalResponsibility = {
    handling: myPendingClaims.length,
    stuck: claims.filter((c) => c.status === 'urged' || c.status === 'returned').length,
    delayed: claims.filter((c) => {
      if (c.workflowLogs.length === 0) return false;
      const lastLog = c.workflowLogs[c.workflowLogs.length - 1];
      const hours =
        (new Date().getTime() - new Date(lastLog.createdAt).getTime()) /
        (1000 * 60 * 60);
      return hours > 24 && c.status !== 'completed';
    }).length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">全部案件</p>
              <p className="mt-2 text-3xl font-bold">{totalClaims}</p>
              <p className="mt-1 text-sm text-blue-100">
                总金额 {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="rounded-full bg-white/20 p-3">
              <FileCheck className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            <span className="text-sm text-slate-600">我处理中</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {totalResponsibility.handling}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {currentUser?.name} ({currentUser?.role && ROLE_LABELS[currentUser.role]})
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-slate-600">异常卡点</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-red-600">
            {totalResponsibility.stuck}
          </p>
          <p className="mt-1 text-sm text-slate-500">催办中 + 已退回</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-slate-600">超时未处理</span>
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-600">
            {totalResponsibility.delayed}
          </p>
          <p className="mt-1 text-sm text-slate-500">停留超过24小时</p>
        </div>
      </div>

      {myPendingClaims.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            我的待处理案件
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myPendingClaims.slice(0, 2).map((claim) => (
              <ClaimCard key={claim.id} claim={claim} onClick={() => {}} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">案件状态概览</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {statusOrder.map((status) => (
            <StatusCard
              key={status}
              status={status}
              count={claimsByStatus[status].length}
              claims={claimsByStatus[status]}
              onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            {selectedStatus === 'all'
              ? '全部案件'
              : `${STATUS_LABELS[selectedStatus]}案件`}
          </h2>
          {selectedStatus !== 'all' && (
            <button
              onClick={() => setSelectedStatus('all')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              查看全部
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayClaims.length > 0 ? (
            displayClaims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} onClick={() => {}} />
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-slate-500">暂无案件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
