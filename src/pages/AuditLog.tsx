import { useState } from 'react';
import { Search, Filter, FileText, Clock, User, Edit3, Trash2, CheckCircle, Plus } from 'lucide-react';
import { useAuditLogs } from '@/store/store';
import type { AuditLog as AuditLogType } from '@/types';

export const AuditLog = () => {
  const logs = useAuditLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AuditLogType['targetType'] | 'all'>('all');
  const [filterAction, setFilterAction] = useState<AuditLogType['action'] | 'all'>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || log.targetType === filterType;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesType && matchesAction;
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionIcon = (action: AuditLogType['action']) => {
    switch (action) {
      case 'create': return Plus;
      case 'update': return Edit3;
      case 'delete': return Trash2;
      case 'resolve': return CheckCircle;
      case 'confirm': return CheckCircle;
      default: return FileText;
    }
  };

  const getActionColor = (action: AuditLogType['action']) => {
    switch (action) {
      case 'create': return 'text-green-600 bg-green-100';
      case 'update': return 'text-blue-600 bg-blue-100';
      case 'delete': return 'text-red-600 bg-red-100';
      case 'resolve': return 'text-green-600 bg-green-100';
      case 'confirm': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionLabel = (action: AuditLogType['action']) => {
    switch (action) {
      case 'create': return '创建';
      case 'update': return '更新';
      case 'delete': return '删除';
      case 'resolve': return '解决';
      case 'confirm': return '确认';
      default: return action;
    }
  };

  const getTypeLabel = (type: AuditLogType['targetType']) => {
    switch (type) {
      case 'soupBase': return '锅底';
      case 'soldOut': return '沽清';
      case 'order': return '订单';
      case 'user': return '用户';
      default: return type;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case '前厅经理': return '前厅经理';
      case '后厨主管': return '后厨主管';
      case '收银': return '收银';
      case '管理员': return '管理员';
      default: return role;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">审计日志</h2>
          <p className="text-gray-500 mt-1">系统操作记录追踪</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="搜索目标名称或操作人..."
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as AuditLogType['targetType'] | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">全部类型</option>
                <option value="soupBase">锅底</option>
                <option value="soldOut">沽清</option>
                <option value="order">订单</option>
                <option value="user">用户</option>
              </select>
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as AuditLogType['action'] | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">全部操作</option>
              <option value="create">创建</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="resolve">解决</option>
              <option value="confirm">确认</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目标</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getActionColor(log.action)}`}>
                        <ActionIcon className="h-4 w-4" />
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{log.targetName}</p>
                        <p className="text-xs text-gray-500">类型: {getTypeLabel(log.targetType)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-800">{log.actor}</p>
                          <p className="text-xs text-gray-500">{getRoleLabel(log.actorRole)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{formatTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs">
                        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无审计记录</p>
          </div>
        )}
      </div>
    </div>
  );
};
