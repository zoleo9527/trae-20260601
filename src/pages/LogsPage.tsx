import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, Clock, User, ArrowRight, Search, X, RefreshCw, Wallet, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { formatDate, getOperationTypeText, getRoleText, cn, getBottleReturnStatusText, getDepositStatusText } from '@/lib/utils';
import { OperationType, UserRole } from '@/types';

export default function LogsPage() {
  const location = useLocation();
  const { 
    operationLogs, 
    logFilters, 
    setLogFilters, 
    getFilteredLogs,
    getRelatedLogsByBottleId,
    getRelatedLogsByDepositId,
    bottleReturnRecords,
    depositReconciliations,
  } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [typeFilter, setTypeFilter] = useState<OperationType | ''>('');
  const [viewMode, setViewMode] = useState<'all' | 'related'>('all');

  useEffect(() => {
    const state = location.state as any;
    if (state) {
      if (state.bottleReturnId || state.depositId) {
        setViewMode('related');
      }
    }
  }, [location.state]);

  const getCurrentTargetInfo = () => {
    const state = location.state as any;
    if (!state) return null;
    
    if (state.bottleReturnId) {
      const bottle = bottleReturnRecords.find(b => b.id === state.bottleReturnId);
      if (bottle) {
        return {
          type: 'bottle' as const,
          id: bottle.id,
          title: `空瓶回收 - ${bottle.customer.name}`,
          status: bottle.status,
          getStatusText: getBottleReturnStatusText,
        };
      }
    }
    if (state.depositId) {
      const deposit = depositReconciliations.find(d => d.id === state.depositId);
      if (deposit) {
        return {
          type: 'deposit' as const,
          id: deposit.id,
          title: `押金核对 - ${deposit.customer.name}`,
          status: deposit.status,
          getStatusText: getDepositStatusText,
        };
      }
    }
    return null;
  };

  const getDisplayLogs = () => {
    const state = location.state as any;
    let logs: typeof operationLogs;

    if (viewMode === 'related' && state) {
      if (state.bottleReturnId) {
        logs = getRelatedLogsByBottleId(state.bottleReturnId);
      } else if (state.depositId) {
        logs = getRelatedLogsByDepositId(state.depositId);
      } else {
        logs = getFilteredLogs();
      }
    } else {
      logs = getFilteredLogs();
    }

    return logs.filter(log => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!log.remark.toLowerCase().includes(term) && 
            !log.operatorName.toLowerCase().includes(term) &&
            !getOperationTypeText(log.operationType).toLowerCase().includes(term)) {
          return false;
        }
      }
      if (roleFilter && log.operatorRole !== roleFilter) return false;
      if (typeFilter && log.operationType !== typeFilter) return false;
      return true;
    });
  };

  const filteredLogs = getDisplayLogs();
  const targetInfo = getCurrentTargetInfo();

  const handleClearFilter = () => {
    setLogFilters({});
    setViewMode('all');
    setSearchTerm('');
    setRoleFilter('');
    setTypeFilter('');
  };

  const operationTypes: { value: OperationType; label: string }[] = [
    { value: 'bottle_collect', label: '回收空瓶' },
    { value: 'bottle_return_station', label: '运回站点' },
    { value: 'bottle_verify', label: '核验空瓶' },
    { value: 'bottle_dispute', label: '空瓶争议' },
    { value: 'bottle_reject', label: '退回回收' },
    { value: 'bottle_stick', label: '标记空瓶卡住' },
    { value: 'bottle_unstick', label: '解除空瓶卡住' },
    { value: 'deposit_init', label: '发起核对' },
    { value: 'deposit_match', label: '核对一致' },
    { value: 'deposit_mismatch', label: '核对不一致' },
    { value: 'deposit_verify', label: '核验押金' },
    { value: 'deposit_dispute', label: '押金争议' },
    { value: 'deposit_stick', label: '标记押金卡住' },
    { value: 'deposit_unstick', label: '解除押金卡住' },
    { value: 'acknowledge_alert', label: '确认提醒' },
    { value: 'resolve_alert', label: '解决提醒' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">操作日志</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredLogs.length} 条操作记录
            {viewMode === 'related' && <span className="ml-2 text-indigo-600">（上下游关联视图）</span>}
          </p>
        </div>
        {viewMode === 'related' && (
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('related')}
                className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm rounded-lg font-medium"
              >
                上下游关联
              </button>
              <button
                onClick={() => setViewMode('all')}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                全部日志
              </button>
            </div>
            <button
              onClick={handleClearFilter}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <X className="w-4 h-4" /> 清除筛选
            </button>
          </div>
        )}
      </div>

      {targetInfo && (
        <div className={cn(
          'border-l-4 bg-white shadow-sm rounded-r-lg p-4',
          targetInfo.type === 'bottle' ? 'border-blue-500' : 'border-purple-500'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                targetInfo.type === 'bottle' ? 'bg-blue-100' : 'bg-purple-100'
              )}>
                {targetInfo.type === 'bottle' ? (
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                ) : (
                  <Wallet className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{targetInfo.title}</h3>
                <p className="text-sm text-gray-500">
                  当前状态: {targetInfo.getStatusText(targetInfo.status)}
                </p>
              </div>
            </div>
            <div className="text-sm text-indigo-600 font-medium">
              显示上下游关联日志
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索操作备注或操作人..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部角色</option>
            <option value="station_clerk">站点文员</option>
            <option value="delivery_person">配送员</option>
            <option value="customer_service">客服</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as OperationType | '')}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部操作类型</option>
            {operationTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目标类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态变更</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-900">{log.operatorName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {getRoleText(log.operatorRole)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {getOperationTypeText(log.operationType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded',
                      log.targetType === 'bottle_return' && 'bg-blue-100 text-blue-700',
                      log.targetType === 'deposit_reconciliation' && 'bg-purple-100 text-purple-700',
                      log.targetType === 'alert' && 'bg-yellow-100 text-yellow-700'
                    )}>
                      {log.targetType === 'bottle_return' && '空瓶回收'}
                      {log.targetType === 'deposit_reconciliation' && '押金核对'}
                      {log.targetType === 'alert' && '异常提醒'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.oldStatus && log.newStatus ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {log.targetType === 'bottle_return' ? getBottleReturnStatusText(log.oldStatus as any) :
                           log.targetType === 'deposit_reconciliation' ? getDepositStatusText(log.oldStatus as any) : log.oldStatus}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {log.targetType === 'bottle_return' ? getBottleReturnStatusText(log.newStatus as any) :
                           log.targetType === 'deposit_reconciliation' ? getDepositStatusText(log.newStatus as any) : log.newStatus}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 max-w-xs truncate">{log.remark}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无符合条件的操作记录</p>
        </div>
        )}
      </div>
    </div>
  );
}
