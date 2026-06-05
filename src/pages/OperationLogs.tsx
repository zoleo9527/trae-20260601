import { useEffect } from 'react';
import { useStore } from '@/store';

export default function OperationLogs() {
  const { operationLogs, loading, logFilters, setLogFilters, fetchOperationLogs } = useStore();

  useEffect(() => {
    fetchOperationLogs();
  }, [fetchOperationLogs]);

  const filtered = operationLogs.filter((log) => {
    if (logFilters.module && log.module !== logFilters.module) return false;
    if (logFilters.operator && !log.operator.includes(logFilters.operator)) return false;
    if (logFilters.dateFrom && log.timestamp < logFilters.dateFrom) return false;
    if (logFilters.dateTo && log.timestamp > logFilters.dateTo + 'T23:59:59') return false;
    return true;
  });

  const modules = [...new Set(operationLogs.map((l) => l.module))];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-display font-bold text-roast-text mb-6">操作日志</h1>

      <div className="flex items-center gap-3 mb-5">
        <select
          className="filter-input"
          value={logFilters.module}
          onChange={(e) => setLogFilters({ module: e.target.value })}
        >
          <option value="">全部模块</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          type="text"
          className="filter-input"
          placeholder="操作人..."
          value={logFilters.operator}
          onChange={(e) => setLogFilters({ operator: e.target.value })}
        />
        <input
          type="date"
          className="filter-input"
          value={logFilters.dateFrom}
          onChange={(e) => setLogFilters({ dateFrom: e.target.value })}
        />
        <span className="text-gray-400 text-sm">至</span>
        <input
          type="date"
          className="filter-input"
          value={logFilters.dateTo}
          onChange={(e) => setLogFilters({ dateTo: e.target.value })}
        />
      </div>

      {loading.operationLogs ? (
        <div className="table-container animate-pulse">
          <table><thead><tr>{[1,2,3,4,5,6].map(i=><th key={i}><div className="h-4 bg-gray-200 rounded" /></th>)}</tr></thead></table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>模块</th>
                <th>操作</th>
                <th>操作人</th>
                <th>对象</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">暂无数据</td></tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('zh-CN')}</td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-roast-orange/10 text-roast-orange">
                        {log.module}
                      </span>
                    </td>
                    <td className="font-medium">{log.action}</td>
                    <td>{log.operator}</td>
                    <td className="text-gray-600">{log.target}</td>
                    <td className="text-gray-400 text-xs max-w-[300px] truncate">{log.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
