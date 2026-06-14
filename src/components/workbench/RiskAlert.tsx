import { AlertTriangle, Package, Clock } from 'lucide-react';
import { useWorkOrderStore } from '../../store/workOrderStore';
import { clsx } from 'clsx';

export default function RiskAlert() {
  const { orders, selectOrder } = useWorkOrderStore();

  const overdueOrders = orders.filter(
    (order) =>
      order.status === 'pending' &&
      new Date().getTime() - order.createdAt.getTime() > 4 * 60 * 60 * 1000
  );

  const exceptionOrders = orders.filter(
    (order) => order.exceptions.length > 0
  );

  const inventoryAlerts = [
    {
      type: 'low_stock',
      message: '米其林 Primacy 4 库存不足',
      count: 2,
    },
  ];

  if (
    overdueOrders.length === 0 &&
    exceptionOrders.length === 0 &&
    inventoryAlerts.length === 0
  ) {
    return (
      <div className="p-4 bg-[#16213e] rounded-lg border border-[#1a1a2e]">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-[#27ae60]" />
          <h3 className="text-sm font-semibold text-[#eaeaea]">风险预警</h3>
        </div>
        <p className="text-sm text-[#a0a0a0] text-center py-4">
          当前无风险项 ✓
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#16213e] rounded-lg border border-[#e94560]/30">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={18} className="text-[#e94560]" />
        <h3 className="text-sm font-semibold text-[#eaeaea]">风险预警</h3>
        <span className="ml-auto px-2 py-0.5 bg-[#e94560]/10 text-[#e94560] text-xs rounded-full">
          {overdueOrders.length + exceptionOrders.length + inventoryAlerts.length}
        </span>
      </div>

      <div className="space-y-2">
        {exceptionOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => selectOrder(order.id)}
            className={clsx(
              'p-3 bg-[#1a1a2e] rounded-lg border-l-4 border-l-[#e94560]',
              'cursor-pointer hover:bg-[#0f3460] transition-colors'
            )}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-[#e94560] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#eaeaea] mb-1">
                  {order.orderNo}
                </p>
                <p className="text-xs text-[#a0a0a0]">
                  {order.exceptions[0]?.description}
                </p>
              </div>
            </div>
          </div>
        ))}

        {overdueOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => selectOrder(order.id)}
            className={clsx(
              'p-3 bg-[#1a1a2e] rounded-lg border-l-4 border-l-[#f39c12]',
              'cursor-pointer hover:bg-[#0f3460] transition-colors'
            )}
          >
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-[#f39c12] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#eaeaea] mb-1">
                  {order.orderNo} - 已超时
                </p>
                <p className="text-xs text-[#a0a0a0]">
                  {order.vehicle.plateNo} {order.vehicle.model}
                </p>
              </div>
            </div>
          </div>
        ))}

        {inventoryAlerts.map((alert, index) => (
          <div
            key={index}
            className={clsx(
              'p-3 bg-[#1a1a2e] rounded-lg border-l-4 border-l-[#f39c12]'
            )}
          >
            <div className="flex items-start gap-2">
              <Package size={16} className="text-[#f39c12] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#eaeaea] mb-1">
                  库存不足
                </p>
                <p className="text-xs text-[#a0a0a0]">{alert.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
