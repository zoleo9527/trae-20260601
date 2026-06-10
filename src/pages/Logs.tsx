import { useState, useEffect } from 'react';
import { logsApi } from '../api/endpoints';
import type { OperationLog } from '../../shared/types.js';
import { useAppStore } from '../stores/appStore';
import {
  ScrollText,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  ArrowRight,
} from 'lucide-react';

const roleOptions = [
  { value: 'all', label: '全部角色' },
  { value: 'grower', label: '种植员' },
  { value: 'sales', label: '销售内勤' },
  { value: 'packaging', label: '包装主管' },
];

const actionOptions = [
  { value: 'all', label: '全部操作' },
  { value: 'order_create', label: '创建订单' },
  { value: 'spec_change', label: '规格变更' },
  { value: 'bloom_forecast', label: '花期预测' },
  { value: 'bloom_report', label: '花期上报' },
  { value: 'inspection_submit', label: '提交质检' },
  { value: 'inspection_update', label: '修改质检' },
  { value: 'loading_confirm', label: '装车确认' },
  { value: 'loading_reject', label: '装车退回' },
  { value: 'patrol_record', label: '棚区巡检' },
  { value: 'schedule', label: '排产确认' },
];

const roleColors: Record<string, { bg: string; text: string; dot: string }> = {
  grower: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  sales: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  packaging: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

export default function Logs() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { showToastMessage } = useAppStore();

  useEffect(() => {
    loadLogs();
  }, [roleFilter, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await logsApi.getLogs({
        role: roleFilter,
        action: actionFilter,
      });
      setLogs(result);
    } catch (error) {
      showToastMessage('加载日志失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFullTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const hasChanges = (log: OperationLog) => {
    return log.changes && log.changes.length > 0;
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-900">操作日志</h1>
          <p className="text-forest-600 mt-1 text-sm">全链路操作审计记录，追踪每一次变更</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-cream-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-forest-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field text-sm w-32"
              >
                {roleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="input-field text-sm w-40"
              >
                {actionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <span className="text-sm text-forest-500">共 {logs.length} 条记录</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-forest-500">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-forest-300 mx-auto mb-3" />
            <p className="text-forest-500">暂无日志记录</p>
          </div>
        ) : (
          <div className="relative p-6">
            <div className="absolute left-9 top-6 bottom-6 w-px bg-forest-200"></div>
            <div className="space-y-6">
              {logs.map((log, index) => {
                const colors = roleColors[log.operatorRole] || {
                  bg: 'bg-gray-50',
                  text: 'text-gray-700',
                  dot: 'bg-gray-400',
                };
                const isExpanded = expandedId === log.id;
                const hasChangeDetails = hasChanges(log);

                return (
                  <div
                    key={log.id}
                    className="relative pl-16 animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className={`absolute left-7 top-1.5 w-4 h-4 rounded-full ${colors.dot} ring-4 ring-white z-10`}></div>

                    <div
                      className={`rounded-xl border border-cream-200 overflow-hidden transition-all ${
                        isExpanded && hasChangeDetails ? 'shadow-md' : ''
                      }`}
                    >
                      <div
                        className={`p-4 cursor-pointer hover:bg-cream-50/50 transition-colors ${
                          hasChangeDetails ? '' : 'cursor-default'
                        }`}
                        onClick={() => hasChangeDetails && toggleExpand(log.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {log.actionText}
                              </div>
                              <span className="text-sm font-medium text-forest-900">
                                {log.description}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-forest-500">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                <span>{log.operator}</span>
                                <span className="text-forest-400">·</span>
                                <span>{log.operatorRoleText}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatTime(log.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-forest-400">对象：</span>
                                <span>{log.targetName}</span>
                              </div>
                            </div>
                          </div>
                          {hasChangeDetails && (
                            <button className="text-forest-400 hover:text-forest-600 ml-4">
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && hasChangeDetails && log.changes && (
                        <div className="bg-cream-50 border-t border-cream-200 p-4">
                          <p className="text-sm font-medium text-forest-700 mb-3">变更详情</p>
                          <div className="space-y-3">
                            {log.changes.map((change, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-red-200">
                                  <p className="text-xs text-red-500 mb-0.5">变更前</p>
                                  <p className="text-sm text-red-700 line-through">
                                    {change.oldValue || '无'}
                                  </p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-forest-400 flex-shrink-0" />
                                <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-green-200">
                                  <p className="text-xs text-green-500 mb-0.5">变更后</p>
                                  <p className="text-sm text-green-700 font-medium">
                                    {change.newValue || '无'}
                                  </p>
                                </div>
                                <div className="w-24 text-sm text-forest-600">
                                  {change.fieldText}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
