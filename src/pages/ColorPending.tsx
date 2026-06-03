import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Palette, 
  Package, 
  Clock, 
  Eye,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, isBefore, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

const ColorPending = () => {
  const { orders } = useOrderStore();
  const { currentUser } = useAuthStore();
  
  const pendingColorOrders = useMemo(() => {
    return orders.filter(o => o.modelReceived && !o.shade);
  }, [orders]);
  
  const isDelayed = (deliveryDate: string) => isBefore(parseISO(deliveryDate), new Date());
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">待色号确认</h1>
        <p className="text-gray-500 mt-1">模型已接收，需要确认色号的订单列表</p>
      </div>
      
      {pendingColorOrders.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-600 text-sm">待确认色号</p>
            <p className="text-3xl font-bold text-amber-700 mt-1">{pendingColorOrders.length}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">已超期</p>
            <p className="text-3xl font-bold text-red-700 mt-1">
              {pendingColorOrders.filter(o => isDelayed(o.deliveryDate)).length}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-purple-600 text-sm">2天内交付</p>
            <p className="text-3xl font-bold text-purple-700 mt-1">
              {pendingColorOrders.filter(o => {
                const daysLeft = Math.ceil((parseISO(o.deliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return daysLeft <= 2 && daysLeft >= 0;
              }).length}
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单信息
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  诊所
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  交付日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  责任人
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingColorOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Palette className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p>所有订单色号已确认</p>
                  </td>
                </tr>
              ) : (
                pendingColorOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNo}</p>
                        <p className="text-sm text-gray-500">{order.patientName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-700">{order.clinic}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className={`text-sm font-medium ${
                          isDelayed(order.deliveryDate) ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {formatDistanceToNow(parseISO(order.deliveryDate), { 
                            addSuffix: true, 
                            locale: zhCN 
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-700">{order.currentHandler}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/order/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          详情
                        </Link>
                        {currentUser?.role === 'designer' && (
                          <Link
                            to={`/order/${order.id}/color`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm transition-colors"
                          >
                            <Palette className="w-4 h-4" />
                            确认色号
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ColorPending;
