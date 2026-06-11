import { useState, useMemo } from 'react';
import {
  Search, Filter, ClipboardCheck, User, Clock, FileText,
  ArrowRight, UserCheck, Building2, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useUserStore } from '@/store/useUserStore';
import ApprovalCard from '@/components/approval/ApprovalCard';
import ProcessTimeline from '@/components/approval/ProcessTimeline';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import DateRangePicker from '@/components/common/DateRangePicker';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import RemarkSection from '@/components/sale/RemarkSection';
import { cn } from '@/lib/utils';
import type { SaleControl, ControlStage } from '@/types';
import { STAGE_MAP, ROLE_MAP } from '@/utils/status';
import { formatDateTime } from '@/utils/date';

export default function ApprovalPage() {
  const {
    filteredSaleControls,
    setFilters,
    filters,
    getSaleControlLogs,
  } = useSaleControlStore();
  const { currentUser, users } = useUserStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const pendingControls = useMemo(() => {
    if (currentUser.role === 'consultant') {
      return filteredSaleControls.filter((s) => s.applicantId === currentUser.id);
    }
    if (currentUser.role === 'manager') {
      return filteredSaleControls.filter((s) =>
        (s.stage === 'review' && s.currentHandlerId === currentUser.id) ||
        (s.stage === 'rejected' && s.currentHandlerId === currentUser.id) ||
        (s.stage === 'rejected' && s.applicantId === currentUser.id)
      );
    }
    if (currentUser.role === 'controller') {
      return filteredSaleControls.filter((s) =>
        (s.stage === 'lock' && s.currentHandlerId === currentUser.id) ||
        s.stage === 'completed'
      );
    }
    return filteredSaleControls;
  }, [filteredSaleControls, currentUser]);

  const selectedControl = selectedId ? filteredSaleControls.find((s) => s.id === selectedId) : null;
  const selectedLogs = selectedId ? getSaleControlLogs(selectedId) : [];

  const stats = useMemo(() => {
    return {
      myPending: pendingControls.filter((s) => s.currentHandlerId === currentUser.id && s.stage !== 'completed' && s.stage !== 'rejected').length,
      reviewPending: pendingControls.filter((s) => s.stage === 'review').length,
      lockPending: pendingControls.filter((s) => s.stage === 'lock').length,
      completed: pendingControls.filter((s) => s.stage === 'completed').length,
    };
  }, [pendingControls, currentUser]);

  const stageOptions: Array<{ value: ControlStage | 'all'; label: string }> = [
    { value: 'all', label: '全部阶段' },
    { value: 'application', label: '销控申请' },
    { value: 'review', label: '经理审核' },
    { value: 'lock', label: '执行锁定' },
    { value: 'completed', label: '已完成' },
    { value: 'rejected', label: '已驳回' },
  ];

  const operatorOptions = [
    { value: 'all', label: '全部操作人' },
    ...users.map((u) => ({ value: u.id, label: `${u.name} (${u.roleName})` })),
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="待我处理"
          value={stats.myPending}
          icon={ClipboardCheck}
          color="primary"
          highlight
        />
        <StatCard label="待经理审核" value={stats.reviewPending} icon={User} color="secondary" />
        <StatCard label="待执行锁定" value={stats.lockPending} icon={Clock} color="success" />
        <StatCard label="已完成" value={stats.completed} icon={Building2} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className={cn(
          'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all',
          viewMode === 'detail' ? 'lg:col-span-2' : 'lg:col-span-5'
        )}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-800">审批列表</h3>
              <p className="text-xs text-slate-400 mt-0.5">共 {pendingControls.length} 条记录</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="w-4 h-4" />
              筛选
            </Button>
          </div>

          {showFilters && (
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="搜索房号/客户..."
                  value={filters.keyword || ''}
                  onChange={(e) => setFilters({ keyword: e.target.value || undefined })}
                  prefixIcon={<Search className="w-4 h-4 text-slate-400" />}
                />
                <Select
                  options={stageOptions}
                  value={filters.stage || 'all'}
                  onChange={(v) => setFilters({ stage: v === 'all' ? undefined : (v as ControlStage) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  options={operatorOptions}
                  value={filters.operatorId || 'all'}
                  onChange={(v) => setFilters({ operatorId: v === 'all' ? undefined : (v as string) })}
                />
                <DateRangePicker
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onChange={(start, end) => setFilters({ startDate: start, endDate: end })}
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
            {pendingControls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <ClipboardCheck className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm">暂无审批记录</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingControls.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedId(sc.id);
                      setViewMode('detail');
                    }}
                    className={cn(
                      'w-full px-6 py-4 text-left transition-all hover:bg-slate-50',
                      selectedId === sc.id && 'bg-primary/5 border-l-2 border-l-primary'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{sc.house.houseNumber}</span>
                        <StatusBadge type="stage" value={sc.stage} size="sm" />
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {sc.house.totalPrice >= 10000
                          ? `${(sc.house.totalPrice / 10000).toFixed(0)}万`
                          : sc.house.totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sc.customer.name}</span>
                        <StatusBadge type="customer" value={sc.customer.level} size="sm" className="ml-1" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDateTime(sc.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <UserCheck className="w-3 h-3" />
                        <span>当前：{sc.currentHandler.name}</span>
                      </div>
                      {sc.previousHandler && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <span>上一环节：{sc.previousHandler.name}</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    {sc.currentRemark && (
                      <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded px-2 py-1.5 line-clamp-2">
                        {sc.currentRemark}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {viewMode === 'detail' && selectedControl && (
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  审批详情
                  <span className="text-xs text-slate-400 font-normal">#{selectedControl.id.slice(-8)}</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  返回列表
                </Button>
              </div>
              <div className="p-6">
                <ApprovalCard saleControl={selectedControl} className="shadow-none border-0 p-0" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  流程时间线
                </h3>
              </div>
              <div className="px-6 py-4">
                <ProcessTimeline
                  currentStage={selectedControl.stage}
                  stageHistory={selectedControl.stageHistory}
                />
              </div>
            </div>

            {selectedControl.stageHistory && selectedControl.stageHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    交接记录
                  </h3>
                  <span className="text-xs text-slate-400">共 {selectedControl.stageHistory.length} 个环节</span>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {selectedControl.stageHistory.map((record, index) => (
                      <div
                        key={record.stage}
                        className={cn(
                          'p-4 rounded-xl border transition-all',
                          record.completedAt
                            ? 'bg-success/5 border-success/20'
                            : selectedControl.stage === record.stage
                            ? 'bg-primary/5 border-primary/20'
                            : 'bg-slate-50 border-slate-200'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                              record.completedAt
                                ? 'bg-success text-white'
                                : selectedControl.stage === record.stage
                                ? 'bg-primary text-white animate-pulse'
                                : 'bg-slate-300 text-white'
                            )}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800">{record.stageName}</span>
                                {record.completedAt && (
                                  <span className="text-xs text-success bg-success/10 px-1.5 py-0.5 rounded">已完成</span>
                                )}
                                {!record.completedAt && selectedControl.stage === record.stage && (
                                  <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">处理中</span>
                                )}
                                {!record.completedAt && selectedControl.stage !== record.stage && (
                                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">待处理</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                处理人：{record.handlerName}（{record.handlerRoleName}）
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {record.receivedAt && (
                              <p className="text-xs text-slate-500">
                                接收：{formatDateTime(record.receivedAt)}
                              </p>
                            )}
                            {record.completedAt && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                完成：{formatDateTime(record.completedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        {record.remark && (
                          <div className="mt-2 pt-2 border-t border-slate-200/50">
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              备注：
                            </p>
                            <p className="text-sm text-slate-700 bg-white/60 rounded px-2 py-1.5">
                              {record.remark}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedLogs.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    操作日志
                  </h3>
                  <span className="text-xs text-slate-400">共 {selectedLogs.length} 条记录</span>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {selectedLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">{log.operationTypeName}</span>
                            {log.remarkInherited && (
                              <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">
                                备注自动带入
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{formatDateTime(log.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <User className="w-3 h-3" />
                          <span>{log.operatorName}（{log.operatorRoleName}）</span>
                          {(log.beforeStage || log.afterStage) && log.beforeStage !== log.afterStage && (
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">·</span>
                              {log.beforeStage && <span>{STAGE_MAP[log.beforeStage]}</span>}
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              {log.afterStage && <span className="text-primary">{STAGE_MAP[log.afterStage]}</span>}
                            </span>
                          )}
                        </div>
                        {(log.beforeHandlerName || log.afterHandlerName) && log.beforeHandlerName !== log.afterHandlerName && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                            <UserCheck className="w-3 h-3" />
                            <span>交接：</span>
                            {log.beforeHandlerName && <span>{log.beforeHandlerName}</span>}
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            {log.afterHandlerName && <span className="text-success font-medium">{log.afterHandlerName}</span>}
                          </div>
                        )}
                        {log.remark && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-sm text-slate-600 bg-white rounded px-2 py-1.5">
                              {log.remark}
                              {log.remarkSource && (
                                <span className="text-xs text-slate-400 ml-2">
                                  [{log.remarkSource === 'application' ? '销控申请' :
                                    log.remarkSource === 'review' ? '经理审核' :
                                    log.remarkSource === 'lock' ? '执行锁定' : '完成销售'}]
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedControl.remarks && selectedControl.remarks.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    备注记录
                  </h3>
                  <span className="text-xs text-slate-400">共 {selectedControl.remarks.length} 条</span>
                </div>
                <div className="px-6 py-4">
                  <RemarkSection remarks={selectedControl.remarks} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  highlight,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardCheck;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'slate';
  highlight?: boolean;
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    success: 'bg-success/10 text-success border-success/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className={cn(
      'bg-white rounded-xl border shadow-sm p-4 transition-all',
      highlight ? 'border-primary/30 ring-2 ring-primary/10' : 'border-slate-200'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className={cn(
            'text-2xl font-bold',
            highlight ? 'text-primary' : 'text-slate-800'
          )}>{value}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
