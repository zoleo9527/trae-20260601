import { useState } from 'react';
import { Search, Filter, User, Wrench, Package, FileText, AlertTriangle } from 'lucide-react';
import { OperationLog } from '../types';

interface OperationLogsProps {
  logs: OperationLog[];
}

export function OperationLogs({ logs }: OperationLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || log.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
    maintenance_manager: { label: '维保主管', color: 'text-blue-600', bg: 'bg-blue-100' },
    field_technician: { label: '现场技师', color: 'text-green-600', bg: 'bg-green-100' },
    warehouse_manager: { label: '仓库管理员', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    system: { label: '系统', color: 'text-gray-600', bg: 'bg-gray-100' },
  };

  const actionLabels: Record<string, string> = {
    create_equipment: '创建设备档案',
    update_equipment: '更新设备档案',
    delete_equipment: '删除设备档案',
    create_maintenance_plan: '创建保养计划',
    update_maintenance_plan: '更新保养计划',
    complete_maintenance: '完成保养计划',
    add_parts: '新增配件',
    issue_parts: '发放配件',
    receive_parts: '入库配件',
    wrong_delivery: '配件错发',
    update_equipment_status: '设备状态变更',
    report_issue: '上报异常',
    emergency_repair: '紧急维修',
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'equipment': return <Wrench className="w-4 h-4" />;
      case 'maintenance_plan': return <FileText className="w-4 h-4" />;
      case 'parts': return <Package className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">操作日志</h1>
          <p className="text-gray-500 mt-1">记录系统所有操作记录</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="搜索操作人、目标名称..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">全部角色</option>
              <option value="maintenance_manager">维保主管</option>
              <option value="field_technician">现场技师</option>
              <option value="warehouse_manager">仓库管理员</option>
              <option value="system">系统</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredLogs.map(log => (
            <div 
              key={log.id} 
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${roleLabels[log.role].bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <User className={`w-5 h-5 ${roleLabels[log.role].color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{log.operator}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${roleLabels[log.role].bg} ${roleLabels[log.role].color}`}>
                        {roleLabels[log.role].label}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{actionLabels[log.action] || log.action}</p>
                    <p className="text-sm text-gray-500 mt-2">{log.description}</p>
                    {log.detail && (
                      <p className="text-xs text-gray-400 mt-1 border-t border-gray-200 pt-2">
                        {log.detail}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                    {getTargetIcon(log.targetType)}
                    <span>{log.targetName}</span>
                  </div>
                  <p className="text-xs text-gray-400">{log.createdAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无操作日志</p>
          </div>
        )}
      </div>
    </div>
  );
}
