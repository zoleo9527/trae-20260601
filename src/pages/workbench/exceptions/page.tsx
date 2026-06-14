import { useEffect } from 'react';
import { useExceptionStore } from '../../../store/exceptionStore';
import { useWorkOrderStore } from '../../../store/workOrderStore';
import { useTechnicianStore } from '../../../store/technicianStore';
import { AlertTriangle, Clock, User, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const typeLabels = {
  all: '全部',
  wrong_model: '型号错误',
  warranty_dispute: '补胎争议',
  inventory_issue: '库存问题',
  other: '其他',
};

const statusLabels = {
  open: '待处理',
  analyzing: '分析中',
  handling: '处理中',
  resolved: '已解决',
  escalated: '已升级',
  closed: '已关闭',
};

const typeColors = {
  wrong_model: 'bg-[#e94560]/10 text-[#e94560]',
  warranty_dispute: 'bg-[#f39c12]/10 text-[#f39c12]',
  inventory_issue: 'bg-[#3498db]/10 text-[#3498db]',
  other: 'bg-[#a0a0a0]/10 text-[#a0a0a0]',
};

const statusColors = {
  open: 'bg-[#f39c12]/10 text-[#f39c12]',
  analyzing: 'bg-[#3498db]/10 text-[#3498db]',
  handling: 'bg-[#3498db]/10 text-[#3498db]',
  resolved: 'bg-[#27ae60]/10 text-[#27ae60]',
  escalated: 'bg-[#e94560]/10 text-[#e94560]',
  closed: 'bg-[#a0a0a0]/10 text-[#a0a0a0]',
};

export default function ExceptionsPage() {
  const { loadExceptions, exceptions, filterType, setFilterType } = useExceptionStore();
  const { loadOrders, orders, selectOrder, getOrderById } = useWorkOrderStore();
  const { loadTechnicians, getTechnicianById } = useTechnicianStore();

  useEffect(() => {
    loadExceptions();
    loadOrders();
    loadTechnicians();
  }, [loadExceptions, loadOrders, loadTechnicians]);

  const allExceptions = [
    ...exceptions,
    ...orders.flatMap(order =>
      order.exceptions.filter(
        exc => !exceptions.find(e => e.id === exc.id)
      )
    ),
  ];

  const filteredExceptions = filterType === 'all'
    ? allExceptions
    : allExceptions.filter(e => e.type === filterType);

  const stats = {
    total: allExceptions.length,
    open: allExceptions.filter(e => e.status === 'open').length,
    analyzing: allExceptions.filter(e => e.status === 'analyzing').length,
    handling: allExceptions.filter(e => e.status === 'handling').length,
    resolved: allExceptions.filter(e => e.status === 'resolved').length,
  };

  const handleExceptionClick = (exception: any) => {
    selectOrder(exception.workOrderId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#eaeaea]">异常处理中心</h1>
        <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
          <AlertTriangle size={16} />
          <span>共 {exceptions.length} 个异常</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#e94560]/10 rounded-lg">
              <AlertCircle size={24} className="text-[#e94560]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#eaeaea]">{stats.total}</p>
              <p className="text-sm text-[#a0a0a0]">异常总数</p>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#f39c12]/10 rounded-lg">
              <Clock size={24} className="text-[#f39c12]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f39c12]">{stats.open}</p>
              <p className="text-sm text-[#a0a0a0]">待处理</p>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#3498db]/10 rounded-lg">
              <Clock size={24} className="text-[#3498db]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#3498db]">{stats.analyzing}</p>
              <p className="text-sm text-[#a0a0a0]">分析中</p>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#3498db]/10 rounded-lg">
              <AlertTriangle size={24} className="text-[#3498db]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#3498db]">{stats.handling}</p>
              <p className="text-sm text-[#a0a0a0]">处理中</p>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#27ae60]/10 rounded-lg">
              <AlertTriangle size={24} className="text-[#27ae60]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#27ae60]">{stats.resolved}</p>
              <p className="text-sm text-[#a0a0a0]">已解决</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#16213e] rounded-lg border border-[#1a1a2e]">
        <div className="p-4 border-b border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-[#a0a0a0]" />
            <div className="flex gap-2">
              {Object.entries(typeLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key as any)}
                  className={clsx(
                    'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                    filterType === key
                      ? 'bg-[#e94560] text-white'
                      : 'bg-[#1a1a2e] text-[#a0a0a0] hover:bg-[#0f3460]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            {filteredExceptions.map((exc) => {
              const order = getOrderById(exc.workOrderId);
              const discoverer = getTechnicianById(exc.discoveredBy);
              return (
                <div
                  key={exc.id}
                  onClick={() => handleExceptionClick(exc)}
                  className="p-4 bg-[#1a1a2e] rounded-lg border-l-4 border-l-[#e94560] cursor-pointer hover:bg-[#0f3460] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded',
                          typeColors[exc.type]
                        )}
                      >
                        {typeLabels[exc.type]}
                      </span>
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded',
                          statusColors[exc.status]
                        )}
                      >
                        {statusLabels[exc.status]}
                      </span>
                      {exc.severity === 'high' && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-[#e94560]/10 text-[#e94560]">
                          高优先级
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#a0a0a0]">
                      {format(exc.discoveredAt, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                    </span>
                  </div>

                  <p className="text-sm text-[#eaeaea] mb-3">{exc.description}</p>

                  {order && (
                    <div className="mb-3 p-2 bg-[#16213e] rounded text-xs">
                      <span className="text-[#a0a0a0]">关联工单: </span>
                      <span className="text-[#0f3460] font-mono">{order.orderNo}</span>
                      <span className="text-[#a0a0a0] mx-2">·</span>
                      <span className="text-[#eaeaea]">
                        {order.vehicle.brand} {order.vehicle.model}
                      </span>
                      <span className="text-[#a0a0a0] mx-2">·</span>
                      <span className="text-[#eaeaea] font-mono">
                        {order.vehicle.plateNo}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2 text-xs mb-3">
                    {exc.details.expected && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#a0a0a0]">期望:</span>
                        <span className="text-[#eaeaea]">{exc.details.expected}</span>
                      </div>
                    )}
                    {exc.details.actual && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#a0a0a0]">实际:</span>
                        <span className="text-[#eaeaea]">{exc.details.actual}</span>
                      </div>
                    )}

                    {exc.analysis && (
                      <div className="mt-3 pt-3 border-t border-[#16213e] space-y-2">
                        {exc.analysis.reason ? (
                          <div className="flex items-start gap-2">
                            <ChevronRight size={12} className="text-[#a0a0a0] mt-0.5" />
                            <div>
                              <span className="text-[#a0a0a0]">原因分析: </span>
                              <span className="text-[#eaeaea]">{exc.analysis.reason}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <ChevronRight size={12} className="text-[#a0a0a0] mt-0.5" />
                            <span className="text-[#f39c12]">原因分析: 待补充</span>
                          </div>
                        )}
                        {exc.analysis.measures && (
                          <div className="flex items-start gap-2">
                            <ChevronRight size={12} className="text-[#a0a0a0] mt-0.5" />
                            <div>
                              <span className="text-[#a0a0a0]">处理措施: </span>
                              <span className="text-[#eaeaea]">{exc.analysis.measures}</span>
                            </div>
                          </div>
                        )}
                        {exc.analysis.handledBy && (
                          <div className="flex items-start gap-2">
                            <ChevronRight size={12} className="text-[#a0a0a0] mt-0.5" />
                            <div>
                              <span className="text-[#a0a0a0]">处理人: </span>
                              <span className="text-[#eaeaea]">{exc.analysis.handledBy}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#16213e]">
                    <div className="w-6 h-6 bg-[#0f3460] rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-[#eaeaea]">
                        {discoverer?.name[0] || '?'}
                      </span>
                    </div>
                    <span className="text-xs text-[#a0a0a0]">
                      发现人: {discoverer?.name || exc.discoveredBy}
                    </span>
                    <span className="text-xs text-[#a0a0a0]">|</span>
                    <span className="text-xs text-[#0f3460] font-mono">
                      {exc.workOrderId}
                    </span>
                    <span className="ml-auto text-xs text-[#a0a0a0]">
                      点击查看详情 →
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredExceptions.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle size={48} className="text-[#a0a0a0] mx-auto mb-4" />
                <p className="text-[#a0a0a0]">暂无异常记录</p>
                <p className="text-xs text-[#a0a0a0] mt-2">
                  选择其他筛选条件或处理现有工单
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
