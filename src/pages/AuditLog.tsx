import React, { useState } from 'react';
import { Search, Filter, Clock, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuditStore } from '../stores/auditStore';
import { formatDateTime } from '../utils/storage';

const AuditLog: React.FC = () => {
  const { logs } = useAuditStore();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const entityOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'booking', label: '预订' },
    { value: 'package', label: '套餐' },
    { value: 'decoration', label: '布置' },
    { value: 'member', label: '会员' },
    { value: 'transaction', label: '交易' },
    { value: 'anomaly', label: '异常' },
  ];

  const actionLabels: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    status_change: '状态变更',
  };

  const entityLabels: Record<string, string> = {
    booking: '预订',
    package: '套餐',
    package_order: '套餐订单',
    decoration: '布置任务',
    member: '会员',
    transaction: '交易记录',
    anomaly: '异常处理',
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch = search === '' ||
      log.entityId.includes(search) ||
      (log.operator && log.operator.includes(search)) ||
      (log.note && log.note.includes(search));
    const matchEntity = entityFilter === 'all' || log.entityType === entityFilter;
    return matchSearch && matchEntity;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索ID、操作员、备注..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            {entityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold">操作日志</h3>
          <span className="text-sm text-slate-400">共 {filteredLogs.length} 条记录</span>
        </div>
        <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLog === log.id;
            const hasChanges = log.beforeData || log.afterData;
            const changedKeys = hasChanges
              ? new Set([
                  ...Object.keys(log.beforeData || {}),
                  ...Object.keys(log.afterData || {}),
                ])
              : [];

            return (
              <div key={log.id} className="hover:bg-slate-800/20">
                <div
                  className="px-5 py-3 cursor-pointer"
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-800 rounded">
                        <FileText className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                            {entityLabels[log.entityType] || log.entityType}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                            {actionLabels[log.action] || log.action}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{log.entityId}</span>
                        </div>
                        {log.note && (
                          <p className="text-sm text-slate-300">{log.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5" />
                        <span>{log.operator || '系统'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                      {hasChanges && (
                        isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-500" />
                          : <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && hasChanges && (
                  <div className="px-5 pb-4 border-t border-slate-800/50">
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">变更详情</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-500">
                            <th className="text-left py-1 w-1/4">字段</th>
                            <th className="text-left py-1 w-1/4">变更前</th>
                            <th className="text-left py-1 w-1/4">变更后</th>
                            <th className="text-left py-1 w-1/4"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(changedKeys).map((key) => {
                            const before = log.beforeData?.[key];
                            const after = log.afterData?.[key];
                            const hasChanged = formatValue(before) !== formatValue(after);

                            return (
                              <tr key={key} className={hasChanged ? 'text-amber-400' : ''}>
                                <td className="py-1 font-mono">{key}</td>
                                <td className="py-1 font-mono text-slate-400">{formatValue(before)}</td>
                                <td className="py-1 font-mono">{formatValue(after)}</td>
                                <td className="py-1">
                                  {hasChanged && (
                                    <span className="text-amber-500">已变更</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
