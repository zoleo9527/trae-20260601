import { type StatusLog } from '@/types';
import { formatDateTime } from '@/utils/format';
import { History } from 'lucide-react';

interface ActionHistoryProps {
  logs: StatusLog[];
}

export default function ActionHistory({ logs }: ActionHistoryProps) {
  const sortedLogs = [...logs].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-champagne-600" />
        <h3 className="font-display text-lg font-semibold text-luxury-800">操作历史</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ivory-200">
              <th className="text-left py-3 px-4 font-medium text-charcoal-600">时间</th>
              <th className="text-left py-3 px-4 font-medium text-charcoal-600">操作人</th>
              <th className="text-left py-3 px-4 font-medium text-charcoal-600">状态</th>
              <th className="text-left py-3 px-4 font-medium text-charcoal-600">操作内容</th>
              <th className="text-left py-3 px-4 font-medium text-charcoal-600">客户可见</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log) => (
              <tr key={log.id} className="border-b border-ivory-100 hover:bg-ivory-50 transition-colors">
                <td className="py-3 px-4 text-charcoal-600 whitespace-nowrap">
                  {formatDateTime(log.timestamp)}
                </td>
                <td className="py-3 px-4 text-charcoal-800">{log.operator}</td>
                <td className="py-3 px-4">
                  <span className={`status-badge ${
                    log.visibleToCustomer ? 'bg-jade-100 text-jade-700' : 'bg-charcoal-100 text-charcoal-700'
                  }`}>
                    {log.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-charcoal-700">{log.description}</td>
                <td className="py-3 px-4">
                  {log.visibleToCustomer ? (
                    <span className="text-jade-600 text-xs">是</span>
                  ) : (
                    <span className="text-charcoal-500 text-xs">否（内部）</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
