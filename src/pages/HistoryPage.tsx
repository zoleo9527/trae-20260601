import { useState, useMemo } from 'react';
import {
  Search, Filter, History, Clock, User, FileText,
  ArrowRight, Building2, UserCheck, ChevronDown, ChevronUp,
  Download, CalendarDays
} from 'lucide-react';
import { useSaleControlStore } from '@/store/useSaleControlStore';
import { useUserStore } from '@/store/useUserStore';
import LogTimeline from '@/components/history/LogTimeline';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import DateRangePicker from '@/components/common/DateRangePicker';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import { cn } from '@/lib/utils';
import type { OperationLog, OperationType, ControlStage } from '@/types';
import { OPERATION_TYPE_MAP, STAGE_MAP, ROLE_MAP } from '@/utils/status';
import { formatDateTime, formatDate } from '@/utils/date';

export default function HistoryPage() {
  const { filteredLogs, setLogFilters, logFilters, operationLogs, saleControls } = useSaleControlStore();
  const { users } = useUserStore();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    return {
      total: operationLogs.length,
      today: operationLogs.filter(
        (l) => new Date(l.timestamp) >= today
      ).length,
      lockCount: operationLogs.filter((l) => l.operationType === 'lock_house').length,
      reviewCount: operationLogs.filter(
        (l) => l.operationType === 'review_approve' || l.operationType === 'review_reject'
      ).length,
      completeCount: operationLogs.filter((l) => l.operationType === 'complete_sale').length,
    };
  }, [operationLogs]);

  const operationOptions: Array<{ value: OperationType | 'all'; label: string }> = [
    { value: 'all', label: '全部操作' },
    { value: 'create_application', label: '创建销控申请' },
    { value: 'submit_for_review', label: '提交审核' },
    { value: 'review_approve', label: '审核通过' },
    { value: 'review_reject', label: '审核驳回' },
    { value: 'lock_house', label: '锁定房源' },
    { value: 'unlock_house', label: '解锁房源' },
    { value: 'complete_sale', label: '完成销售' },
    { value: 'update_remark', label: '更新备注' },
  ];

  const operatorOptions = [
    { value: 'all', label: '全部操作人' },
    ...users.map((u) => ({ value: u.id, label: `${u.name} (${u.roleName})` })),
  ];

  const groupedLogs = useMemo(() => {
    const groups: Record<string, OperationLog[]> = {};
    filteredLogs.forEach((log) => {
      const date = formatDate(log.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return Object.entries(groups).sort((a, b) =>
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredLogs]);

  const getSaleControlInfo = (saleControlId: string) => {
    return saleControls.find((s) => s.id === saleControlId);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="总操作数" value={stats.total} icon={History} color="primary" />
        <StatCard label="今日操作" value={stats.today} icon={CalendarDays} color="secondary" />
        <StatCard label="审核操作" value={stats.reviewCount} icon={UserCheck} color="success" />
        <StatCard label="锁定操作" value={stats.lockCount} icon={Building2} color="primary" />
        <StatCard label="完成销售" value={stats.completeCount} icon={FileText} color="slate" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">操作历史记录</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                共 {filteredLogs.length} 条记录
              </p>
            </div>
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  viewMode === 'timeline'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                时间线视图
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                列表视图
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
              <Filter className="w-4 h-4" />
              筛选
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="w-4 h-4" />
              导出
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">关键词搜索</label>
              <Input
                placeholder="搜索操作/操作人/备注..."
                value={logFilters.keyword || ''}
                onChange={(e) => setLogFilters({ keyword: e.target.value || undefined })}
                prefixIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">操作类型</label>
              <Select
                options={operationOptions}
                value={logFilters.operationType || 'all'}
                onChange={(v) => setLogFilters({ operationType: v === 'all' ? undefined : (v as OperationType) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">操作人</label>
              <Select
                options={operatorOptions}
                value={logFilters.operatorId || 'all'}
                onChange={(v) => setLogFilters({ operatorId: v === 'all' ? undefined : (v as string) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">操作日期</label>
              <DateRangePicker
                startDate={logFilters.startDate}
                endDate={logFilters.endDate}
                onChange={(start, end) => setLogFilters({ startDate: start, endDate: end })}
              />
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 mr-2">快速筛选：</span>
          </div>
          {operationOptions.slice(0, 6).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLogFilters({ operationType: opt.value === 'all' ? undefined : (opt.value as OperationType) })}
              className={cn(
                'px-2.5 py-1 text-xs rounded-md transition-all',
                (logFilters.operationType || 'all') === opt.value
                  ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <History className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">暂无操作记录</p>
            </div>
          ) : viewMode === 'timeline' ? (
            <div className="max-w-4xl mx-auto">
              <LogTimeline logs={filteredLogs.slice(0, 50)} />
              {filteredLogs.length > 50 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" size="sm">
                    加载更多记录
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedLogs.map(([date, logs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">{date}</span>
                    <span className="text-xs text-slate-400">({logs.length} 条操作)</span>
                  </div>
                  <div className="space-y-2">
                    {logs.map((log) => {
                      const scInfo = getSaleControlInfo(log.saleControlId);
                      const isExpanded = expandedLog === log.id;

                      return (
                        <div
                          key={log.id}
                          className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-sm transition-all"
                        >
                          <button
                            onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                            className="w-full px-4 py-3 flex items-center gap-4 text-left"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <StatusBadge type="log" value={log.operationType} size="sm" />
                              {scInfo && (
                                <div className="flex items-center gap-2 min-w-0">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="text-sm font-medium text-slate-700 truncate">
                                    {scInfo.house.houseNumber}
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="text-sm text-slate-600 truncate">
                                    {scInfo.customer.name}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <User className="w-3 h-3" />
                                <span>{log.operatorName}</span>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-400">{log.operatorRoleName}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-400 w-28 text-right">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{formatDateTime(log.timestamp).split(' ')[1]}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <InfoRow label="操作类型" value={log.operationTypeName} />
                                  <InfoRow label="操作人" value={`${log.operatorName} (${log.operatorRoleName})`} />
                                  <InfoRow label="操作时间" value={formatDateTime(log.timestamp)} />
                                  {(log.beforeStage || log.afterStage) && log.beforeStage !== log.afterStage && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">
                                        阶段变化
                                      </span>
                                      <div className="flex items-center gap-1.5 text-sm">
                                        {log.beforeStage && (
                                          <StatusBadge type="stage" value={log.beforeStage} size="sm" />
                                        )}
                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                        {log.afterStage && (
                                          <StatusBadge type="stage" value={log.afterStage} size="sm" />
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {log.beforeStatus !== log.afterStatus && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">
                                        房源状态
                                      </span>
                                      <div className="flex items-center gap-1.5 text-sm">
                                        <StatusBadge type="house" value={log.beforeStatus} size="sm" />
                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                        <StatusBadge type="house" value={log.afterStatus} size="sm" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-3">
                                  {(log.beforeHandlerName || log.afterHandlerName) && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">
                                        处理人交接
                                      </span>
                                      <div className="flex items-center gap-1.5 text-sm">
                                        {log.beforeHandlerName && (
                                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                            {log.beforeHandlerName}
                                          </span>
                                        )}
                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                        {log.afterHandlerName && (
                                          <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs font-medium">
                                            {log.afterHandlerName}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {log.remark && (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">
                                        备注信息
                                      </span>
                                      <div className="flex-1">
                                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                                          <p className="text-sm text-slate-700 leading-relaxed">
                                            {log.remark}
                                          </p>
                                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                                            {log.remarkSource && (
                                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                                来源：{log.remarkSource === 'application' ? '销控申请' :
                                                  log.remarkSource === 'review' ? '经理审核' :
                                                  log.remarkSource === 'lock' ? '执行锁定' :
                                                  log.remarkSource === 'complete' ? '完成销售' : log.remarkSource}
                                              </span>
                                            )}
                                            {log.remarkInherited && (
                                              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-200">
                                                自动带入
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof History;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'slate';
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    success: 'bg-success/10 text-success border-success/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-slate-400 w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-700 font-medium">{value}</span>
    </div>
  );
}
