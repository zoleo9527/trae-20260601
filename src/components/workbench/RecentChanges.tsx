import { useWorkOrderStore } from '../../store/workOrderStore';
import { useDispatchStore } from '../../store/dispatchStore';
import { useTechnicianStore } from '../../store/technicianStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Activity, User, AlertTriangle, FileText } from 'lucide-react';
import { clsx } from 'clsx';

export default function RecentChanges() {
  const { orders, selectOrder } = useWorkOrderStore();
  const { dispatches } = useDispatchStore();
  const { getTechnicianById } = useTechnicianStore();

  const recentLogs = orders
    .flatMap((order) =>
      order.logs.map((log) => ({
        ...log,
        orderNo: order.orderNo,
        orderId: order.id,
      }))
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 6);

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'work_order':
        return <FileText size={14} className="text-[#0f3460]" />;
      case 'dispatch':
        return <User size={14} className="text-[#3498db]" />;
      case 'exception':
        return <AlertTriangle size={14} className="text-[#e94560]" />;
      default:
        return <Activity size={14} className="text-[#a0a0a0]" />;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'work_order':
        return 'bg-[#0f3460]';
      case 'dispatch':
        return 'bg-[#3498db]';
      case 'exception':
        return 'bg-[#e94560]';
      default:
        return 'bg-[#a0a0a0]';
    }
  };

  return (
    <div className="p-4 bg-[#16213e] rounded-lg border border-[#1a1a2e]">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={18} className="text-[#0f3460]" />
        <h3 className="text-sm font-semibold text-[#eaeaea]">最近变更</h3>
        <span className="ml-auto px-2 py-0.5 bg-[#0f3460]/10 text-[#0f3460] text-xs rounded-full">
          {recentLogs.length} 条
        </span>
      </div>

      <div className="space-y-3">
        {recentLogs.map((log, index) => {
          const tech = getTechnicianById(log.operator.id);
          return (
            <div
              key={log.id}
              className="flex gap-3 cursor-pointer hover:bg-[#1a1a2e] p-2 rounded transition-colors"
              onClick={() => selectOrder(log.orderId)}
            >
              <div className="relative flex-shrink-0">
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full mt-2',
                    getEntityColor(log.entityType)
                  )}
                />
                {index < recentLogs.length - 1 && (
                  <div className="absolute top-4 left-1 w-px h-full bg-[#1a1a2e] -translate-x-1/2" />
                )}
              </div>

              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#0f3460]">
                    {log.orderNo}
                  </span>
                  <span className="text-xs text-[#a0a0a0]">
                    {format(log.timestamp, 'HH:mm', { locale: zhCN })}
                  </span>
                  <div className="ml-auto">
                    {getEntityIcon(log.entityType)}
                  </div>
                </div>

                <p className="text-sm text-[#eaeaea] mb-1">{log.action}</p>

                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 bg-[#0f3460] rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-[#eaeaea]">
                      {log.operator.name[0]}
                    </span>
                  </div>
                  <span className="text-xs text-[#a0a0a0]">
                    {log.operator.name}
                  </span>
                  <span className="text-xs text-[#a0a0a0]">·</span>
                  <span className="text-xs text-[#a0a0a0]">
                    {log.operator.role}
                  </span>
                </div>

                {log.changes && log.changes.length > 0 && (
                  <div className="mt-2 p-2 bg-[#1a1a2e] rounded text-xs">
                    {log.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="space-y-1">
                        <div className="text-[#a0a0a0]">
                          {change.field}:
                        </div>
                        {change.before && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#e94560] line-through">
                              {String(change.before)}
                            </span>
                            <span className="text-[#a0a0a0]">→</span>
                            <span className="text-[#27ae60]">
                              {String(change.after)}
                            </span>
                          </div>
                        )}
                        {!change.before && (
                          <div className="text-[#27ae60]">
                            {String(change.after)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
