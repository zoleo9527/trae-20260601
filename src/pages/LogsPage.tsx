import { useState } from 'react';
import { FileText, Clock, User, ArrowRight, Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { formatDate, getOperationTypeText, getRoleText, cn } from '@/lib/utils';
import { OperationType, UserRole } from '@/types';

export default function LogsPage() {
  const { operationLogs } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [typeFilter, setTypeFilter] = useState<OperationType | ''>('');

  const filteredLogs = operationLogs.filter(log => {
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
      <div>
        <h2 className="text-xl font-bold text-gray-900">操作日志</h2>
        <p className="text-sm text-gray-500 mt-1">
          共 {filteredLogs.length} 条操作记录
        </p>
      </div>

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
                    {log.oldStatus && log.newStatus ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{log.oldStatus}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{log.newStatus}</span>
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
