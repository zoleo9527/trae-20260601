import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  RefreshCw, 
  Clock, 
  Eye,
  AlertTriangle,
  User,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow, isBefore, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

const ReworkList = () => {
  const { orders, getReworksByOrderId } = useOrderStore();
  const { currentUser } = useAuthStore();
  
  const reworkOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'rework') return true;
      if (o.reworkCount > 0) return true;
      const reworks = getReworksByOrderId(o.id);
      return reworks.length > 0;
    }).sort((a, b) => {
      if (a.status === 'rework' && b.status !== 'rework') return -1;
      if (b.status === 'rework' && a.status !== 'rework') return 1;
      return b.reworkCount - a.reworkCount;
    });
  }, [orders, getReworksByOrderId]);
  
  const isDelayed = (deliveryDate: string) => isBefore(parseISO(deliveryDate), new Date());
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">返工管理</h1>
        <p className="text-gray-500 mt-1">返工链路订单追踪，包含处理中、已完成的返工记录</p>
      </div>
      
      {reworkOrders.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-orange-600 text-sm">返工处理中</p>
            <p className="text-3xl font-bold text-orange-700 mt-1">
              {reworkOrders.filter(o => o.status === 'rework').length}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-600 text-sm">有返工记录</p>
            <p className="text-3xl font-bold text-amber-700 mt-1">
              {reworkOrders.filter(o => o.reworkCount > 0 && o.status !== 'rework').length}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">已超期</p>
            <p className="text-3xl font-bold text-red-700 mt-1">
              {reworkOrders.filter(o => isDelayed(o.deliveryDate)).length}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-purple-600 text-sm">累计返工次数</p>
            <p className="text-3xl font-bold text-purple-700 mt-1">
              {reworkOrders.reduce((sum, o) => sum + o.reworkCount, 0)}
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
                  返工状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  返工次数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  责任人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  交付日期
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reworkOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p>暂无返工订单</p>
                  </td>
                </tr>
              ) : (
                reworkOrders.map((order) => {
                  const reworks = getReworksByOrderId(order.id);
                  const hasProcessingRework = reworks.some(r => r.status === 'processing');
                  
                  return (
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
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                          {hasProcessingRework && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                              <RefreshCw className="w-3 h-3" />
                              处理中
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${order.reworkCount > 1 ? 'text-red-600' : 'text-orange-600'}`}>
                          {order.reworkCount} 次
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-700">{order.currentHandler}</span>
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
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/order/${order.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            详情
                          </Link>
                          {(order.status === 'rework' || order.status === 'quality_check') && 
                           (currentUser?.role === 'designer' || currentUser?.role === 'inspector') && (
                            <Link
                              to={`/order/${order.id}/rework`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                              处理
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReworkList;
