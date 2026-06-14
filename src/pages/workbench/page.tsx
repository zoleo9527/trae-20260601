import { useEffect } from 'react';
import { useWorkOrderStore } from '../../store/workOrderStore';
import { useTechnicianStore } from '../../store/technicianStore';
import { useDispatchStore } from '../../store/dispatchStore';
import { useExceptionStore } from '../../store/exceptionStore';
import WorkOrderList from '../../components/workbench/WorkOrderList';
import RiskAlert from '../../components/workbench/RiskAlert';
import RecentChanges from '../../components/workbench/RecentChanges';
import OrderDetail from '../../components/order/OrderDetail';
import { AlertCircle } from 'lucide-react';

export default function WorkbenchPage() {
  const { selectedOrderId, getSelectedOrder, loadOrders, setFilters } = useWorkOrderStore();
  const { loadTechnicians } = useTechnicianStore();
  const { loadDispatches } = useDispatchStore();
  const { loadExceptions } = useExceptionStore();

  useEffect(() => {
    setFilters({ status: 'pending' });
  }, [setFilters]);

  useEffect(() => {
    loadOrders();
    loadTechnicians();
    loadDispatches();
    loadExceptions();
  }, [loadOrders, loadTechnicians, loadDispatches, loadExceptions]);

  const selectedOrder = getSelectedOrder();

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-96 border-r border-[#1a1a2e] flex flex-col">
        <WorkOrderList />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          {selectedOrder ? (
            <OrderDetail order={selectedOrder} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <AlertCircle size={48} className="text-[#a0a0a0] mb-4" />
              <h3 className="text-lg font-semibold text-[#eaeaea] mb-2">
                选择工单查看详情
              </h3>
              <p className="text-sm text-[#a0a0a0] max-w-md">
                点击左侧工单列表中的工单卡片，查看完整的工单信息、安装记录、异常历史和操作日志。
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-[#1a1a2e] p-4 space-y-4 bg-[#16213e]">
          <RiskAlert />
          <RecentChanges />
        </div>
      </div>
    </div>
  );
}
