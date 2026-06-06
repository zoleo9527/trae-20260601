import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Film,
  MonitorPlay,
  Ticket,
  AlertTriangle,
  User,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useHallStore } from '@/store/hallStore';
import { useTicketStore } from '@/store/ticketStore';
import { formatDateTime } from '@/utils/date';
import { roleLabels } from '@/types/common';

const HistoryCenter: React.FC = () => {
  const { scheduleLogs } = useScheduleStore();
  const { hallLogs, inspections, faultTickets } = useHallStore();
  const { ticketLogs, getAllRefundListLogs } = useTicketStore();
  const refundListLogs = getAllRefundListLogs();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const allLogs = useMemo(() => {
    const logs: any[] = [];

    scheduleLogs.forEach((log) => {
      logs.push({
        id: log.id,
        type: 'schedule',
        typeLabel: '排片',
        entityId: log.scheduleId,
        action: log.action,
        operator: log.operator,
        operatorRole: log.operatorRole,
        remark: log.remark,
        createdAt: log.createdAt,
        icon: Film,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      });
    });

    hallLogs.forEach((log) => {
      logs.push({
        id: log.id,
        type: 'hall',
        typeLabel: '影厅',
        entityId: log.hallId,
        action: log.action,
        operator: log.operator,
        operatorRole: log.operatorRole,
        remark: log.reason,
        createdAt: log.createdAt,
        icon: MonitorPlay,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      });
    });

    inspections.forEach((ins) => {
      logs.push({
        id: ins.id,
        type: 'inspection',
        typeLabel: '巡检',
        entityId: ins.hallId,
        action: `巡检记录：${ins.result === 'normal' ? '正常' : ins.result === 'warning' ? '异常' : '故障'}`,
        operator: ins.operator,
        operatorRole: ins.operatorRole,
        remark: ins.remark,
        createdAt: ins.createdAt,
        icon: MonitorPlay,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      });
    });

    faultTickets.forEach((ticket) => {
      logs.push({
        id: ticket.id,
        type: 'fault',
        typeLabel: '故障',
        entityId: ticket.hallId,
        action: `故障工单：${ticket.title}`,
        operator: ticket.reportedBy,
        operatorRole: ticket.reportedByRole,
        remark: ticket.description,
        createdAt: ticket.createdAt,
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
      });
    });

    ticketLogs.forEach((log) => {
      logs.push({
        id: log.id,
        type: 'ticket',
        typeLabel: '票务',
        entityId: log.ticketId,
        action: log.action,
        operator: log.operator,
        operatorRole: log.operatorRole,
        remark: log.remark,
        createdAt: log.createdAt,
        icon: Ticket,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      });
    });

    refundListLogs.forEach((log) => {
      logs.push({
        id: log.id,
        type: 'refund',
        typeLabel: '退票',
        entityId: log.refundListId,
        action: log.action,
        operator: log.operator,
        operatorRole: log.operatorRole,
        remark: log.remark,
        createdAt: log.createdAt,
        icon: RefreshCw,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      });
    });

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [scheduleLogs, hallLogs, inspections, faultTickets, ticketLogs, refundListLogs]);

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.remark && log.remark.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesRole = roleFilter === 'all' || log.operatorRole === roleFilter;
    return matchesSearch && matchesType && matchesRole;
  });

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'schedule', label: '排片操作' },
    { value: 'hall', label: '影厅状态' },
    { value: 'inspection', label: '巡检记录' },
    { value: 'fault', label: '故障工单' },
    { value: 'ticket', label: '票务操作' },
    { value: 'refund', label: '退票操作' },
  ];

  const roleOptions = [
    { value: 'all', label: '全部角色' },
    { value: 'schedule_manager', label: '排片经理' },
    { value: 'ticket_manager', label: '票务主管' },
    { value: 'duty_manager', label: '值班经理' },
  ];

  const stats = {
    total: allLogs.length,
    schedule: allLogs.filter((l) => l.type === 'schedule').length,
    hall: allLogs.filter((l) => l.type === 'hall' || l.type === 'inspection').length,
    ticket: allLogs.filter((l) => l.type === 'ticket').length,
    fault: allLogs.filter((l) => l.type === 'fault').length,
    refund: allLogs.filter((l) => l.type === 'refund').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">历史回看中心</h1>
        <p className="text-gray-500 mt-1">全系统操作日志，完整追溯每一步操作</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总记录数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">排片操作</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.schedule}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">影厅操作</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.hall}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MonitorPlay className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">票务操作</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.ticket}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">故障工单</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.fault}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">退票操作</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.refund}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索操作内容、操作人、备注..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-36"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input w-36"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {allLogs.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无操作记录</h3>
          <p className="text-gray-500">开始使用系统后，操作记录将在此显示</p>
        </div>
      ) : (
        <div className="card p-6">
          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {filteredLogs.slice(0, 50).map((log, index) => {
                const Icon = log.icon;
                return (
                  <div key={log.id} className="relative pl-10">
                    <div
                      className={`absolute left-2 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                        index === 0 ? 'border-cinema-red' : 'border-gray-300'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-cinema-red' : 'bg-gray-300'
                      }`} />
                    </div>
                    <div className={`${log.bgColor} rounded-xl p-4`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${log.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 uppercase">
                                {log.typeLabel}
                              </span>
                              <span className="font-medium text-gray-900">{log.action}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(log.createdAt)}
                        </div>
                      </div>
                      {log.remark && (
                        <p className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2 mt-2">
                          {log.remark}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/50">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          {log.operator}
                          {log.operatorRole && (
                            <span className="text-gray-400">
                              （{roleLabels[log.operatorRole as keyof typeof roleLabels] || log.operatorRole}）
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredLogs.length > 50 && (
              <div className="text-center pt-4 border-t mt-6">
                <p className="text-sm text-gray-500">
                  显示前 50 条，共 {filteredLogs.length} 条记录
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryCenter;
