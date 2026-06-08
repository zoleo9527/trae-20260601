import { useEffect, useState } from 'react';
import { RefreshCw, Filter, ArrowRight } from 'lucide-react';
import { api } from '../api';
import type { StatusChangeLog } from '../types';
import { STATUS_LABELS, ROLE_LABELS, ENTITY_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function AuditLog() {
  const [logs, setLogs] = useState<StatusChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [entityFilter, roleFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (entityFilter) params.entity_type = entityFilter;
      if (roleFilter) params.role = roleFilter;
      const data = await api.logs.list(params);
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">审计日志</h1>
          <p className="text-sm text-slate-500 mt-1">
            所有状态变更、责任人、时间点和备注的完整记录
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
        >
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">全部实体</option>
            <option value="cargo_order">货单</option>
            <option value="location_allocation">库位分配</option>
            <option value="pickup_appointment">提货预约</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">全部角色</option>
            <option value="system">系统</option>
            <option value="cargo_acceptor">货站受理</option>
            <option value="security_inspector">安检员</option>
            <option value="warehouse_dispatcher">库区调度</option>
          </select>
          <span className="text-sm text-slate-400">{logs.length} 条记录</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">时间</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">实体</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">变更人</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">角色</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">状态变更</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">备注</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                      {ENTITY_LABELS[log.entity_type] || log.entity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">#{log.entity_id}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{log.changed_by}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                      {ROLE_LABELS[log.role] || log.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {log.from_status ? (
                        <>
                          <StatusBadge status={log.from_status} />
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">起始</span>
                      )}
                      <StatusBadge status={log.to_status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
