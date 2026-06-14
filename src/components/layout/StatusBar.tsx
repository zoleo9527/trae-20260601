import { useWorkOrderStore } from '../../store/workOrderStore';
import { useTechnicianStore } from '../../store/technicianStore';
import { useExceptionStats } from '../../hooks/useExceptionStats';

export default function StatusBar() {
  const orders = useWorkOrderStore((state) => state.orders);
  const technicians = useTechnicianStore((state) => state.technicians);
  const exceptionStats = useExceptionStats();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter(order => order.createdAt >= today);
  const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'in_progress');
  const onlineTechnicians = technicians.filter(tech => tech.status !== 'offline');

  return (
    <footer className="h-10 bg-[#16213e] border-t border-[#1a1a2e] flex items-center justify-between px-6 text-xs text-[#a0a0a0]">
      <div className="flex items-center gap-4">
        <span>今日工单: {todayOrders.length}</span>
        <span className="text-[#f39c12]">待处理: {pendingOrders.length}</span>
        <span className="text-[#e94560]">异常: {exceptionStats.total}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>在线技师: {onlineTechnicians.length}人</span>
        <span>v1.0.0</span>
      </div>
    </footer>
  );
}
