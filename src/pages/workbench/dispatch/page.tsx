import { useEffect } from 'react';
import { useDispatchStore } from '../../../store/dispatchStore';
import { useTechnicianStore } from '../../../store/technicianStore';
import { useWorkOrderStore } from '../../../store/workOrderStore';
import { Users, Clock, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function DispatchPage() {
  const { loadDispatches, dispatches } = useDispatchStore();
  const { loadTechnicians, technicians, selectTechnician, selectedTechnicianId } = useTechnicianStore();
  const { loadOrders, orders } = useWorkOrderStore();

  useEffect(() => {
    loadDispatches();
    loadTechnicians();
    loadOrders();
  }, [loadDispatches, loadTechnicians, loadOrders]);

  const stats = {
    total: dispatches.length,
    pending: dispatches.filter((d) => d.status === 'pending').length,
    inProgress: dispatches.filter((d) => d.status === 'in_progress').length,
    completed: dispatches.filter((d) => d.status === 'completed').length,
  };

  const getOrderById = (orderId: string) => {
    return orders.find(o => o.id === orderId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#eaeaea]">技师派工管理</h1>
        <div className="text-sm text-[#a0a0a0]">
          共 {dispatches.length} 条派工记录
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0f3460] rounded-lg">
              <TrendingUp size={24} className="text-[#eaeaea]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#eaeaea]">{stats.total}</p>
              <p className="text-sm text-[#a0a0a0]">总派工数</p>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#f39c12]/10 rounded-lg">
              <Clock size={24} className="text-[#f39c12]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f39c12]">{stats.pending}</p>
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
              <p className="text-2xl font-bold text-[#3498db]">{stats.inProgress}</p>
              <p className="text-sm text-[#a0a0a0]">进行中</p>
            </div>
          </div>
        </div>

        <div className="bg-[#16213e] rounded-lg p-4 border border-[#1a1a2e]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#27ae60]/10 rounded-lg">
              <CheckCircle size={24} className="text-[#27ae60]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#27ae60]">{stats.completed}</p>
              <p className="text-sm text-[#a0a0a0]">已完成</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-[#16213e] rounded-lg border border-[#1a1a2e] p-4">
          <h3 className="text-sm font-semibold text-[#eaeaea] mb-4">技师状态</h3>
          <div className="space-y-3">
            {technicians.map((tech) => {
              const techDispatches = dispatches.filter(d => d.technicianId === tech.id);
              const inProgressCount = techDispatches.filter(d => d.status === 'in_progress').length;
              return (
                <div
                  key={tech.id}
                  onClick={() => selectTechnician(tech.id)}
                  className={clsx(
                    'flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg cursor-pointer transition-colors',
                    selectedTechnicianId === tech.id && 'ring-2 ring-[#0f3460]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0f3460] rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#eaeaea]">
                        {tech.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#eaeaea]">{tech.name}</p>
                      <p className="text-xs text-[#a0a0a0]">
                        今日 {tech.stats.todayOrders} 单 · 进行中 {inProgressCount}
                      </p>
                    </div>
                  </div>
                  <span
                    className={clsx(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      {
                        available: 'bg-[#27ae60]/10 text-[#27ae60]',
                        busy: 'bg-[#3498db]/10 text-[#3498db]',
                        offline: 'bg-[#a0a0a0]/10 text-[#a0a0a0]',
                        break: 'bg-[#f39c12]/10 text-[#f39c12]',
                      }[tech.status]
                    )}
                  >
                    {
                      {
                        available: '空闲',
                        busy: '工作中',
                        offline: '离线',
                        break: '休息',
                      }[tech.status]
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 bg-[#16213e] rounded-lg border border-[#1a1a2e] p-4">
          <h3 className="text-sm font-semibold text-[#eaeaea] mb-4">
            派工记录
            {selectedTechnicianId && (
              <span className="ml-2 text-xs text-[#a0a0a0]">
                (筛选: {technicians.find(t => t.id === selectedTechnicianId)?.name})
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {dispatches
              .filter(d => !selectedTechnicianId || d.technicianId === selectedTechnicianId)
              .sort((a, b) => b.dispatchedAt.getTime() - a.dispatchedAt.getTime())
              .map((dispatch) => {
              const tech = technicians.find((t) => t.id === dispatch.technicianId);
              const order = getOrderById(dispatch.workOrderId);
              return (
                <div
                  key={dispatch.id}
                  className="p-4 bg-[#1a1a2e] rounded-lg border-l-4 border-l-[#0f3460]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono text-sm font-semibold text-[#eaeaea]">
                          {dispatch.dispatchNo}
                        </p>
                        <span className="text-xs text-[#a0a0a0]">
                          {dispatch.dispatchType === 'auto' ? '自动派工' : '手动派工'}
                        </span>
                      </div>
                      {order && (
                        <p className="text-xs text-[#a0a0a0] mb-1">
                          {order.vehicle.brand} {order.vehicle.model} · {order.vehicle.plateNo}
                        </p>
                      )}
                      <p className="text-xs text-[#a0a0a0]">
                        派工时间: {format(dispatch.dispatchedAt, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        {
                          pending: 'bg-[#f39c12]/10 text-[#f39c12]',
                          confirmed: 'bg-[#3498db]/10 text-[#3498db]',
                          in_progress: 'bg-[#3498db]/10 text-[#3498db]',
                          completed: 'bg-[#27ae60]/10 text-[#27ae60]',
                          cancelled: 'bg-[#a0a0a0]/10 text-[#a0a0a0]',
                        }[dispatch.status]
                      )}
                    >
                      {
                        {
                          pending: '待确认',
                          confirmed: '已确认',
                          in_progress: '进行中',
                          completed: '已完成',
                          cancelled: '已取消',
                        }[dispatch.status]
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#0f3460] rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#eaeaea]">
                          {tech?.name[0]}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#eaeaea]">{tech?.name}</span>
                        <span className="text-xs text-[#a0a0a0] ml-2">
                          {tech?.role === 'senior_technician' ? '高级技师' : tech?.role === 'foreman' ? '工长' : '技师'}
                        </span>
                      </div>
                    </div>
                    {dispatch.confirmedAt && (
                      <div className="text-xs text-[#a0a0a0]">
                        确认: {format(dispatch.confirmedAt, 'HH:mm', { locale: zhCN })}
                      </div>
                    )}
                    {dispatch.completedAt && (
                      <div className="text-xs text-[#0f3460]">
                        完成: {format(dispatch.completedAt, 'HH:mm', { locale: zhCN })}
                      </div>
                    )}
                  </div>

                  {dispatch.notes && (
                    <div className="mt-2 p-2 bg-[#16213e] rounded text-xs">
                      <span className="text-[#a0a0a0]">备注: </span>
                      <span className="text-[#eaeaea]">{dispatch.notes}</span>
                    </div>
                  )}

                  {dispatch.result && (
                    <div className="mt-2 text-xs">
                      <span className="text-[#a0a0a0]">结果: </span>
                      <span
                        className={clsx(
                          {
                            success: 'text-[#27ae60]',
                            partial: 'text-[#f39c12]',
                            failed: 'text-[#e94560]',
                          }[dispatch.result]
                        )}
                      >
                        {dispatch.result === 'success' ? '成功' : dispatch.result}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
