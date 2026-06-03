import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  Clock, 
  Eye,
  Palette,
  RefreshCw,
  Package,
  Send
} from 'lucide-react';
import { formatDistanceToNow, isBefore, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

const DelayedOrders = () => {
  const { orders, receiveModel } = useOrderStore();
  const { currentUser } = useAuthStore();
  const [remarkOrderId, setRemarkOrderId] = useState<string | null>(null);
  const [actionRemark, setActionRemark] = useState('');
  
  const riskOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const daysLeft = Math.ceil(
        (parseISO(order.deliveryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 2 || !order.modelReceived || order.reworkCount > 0;
    });
  }, [orders]);
  
  const isDelayed = (deliveryDate: string) => {
    return isBefore(parseISO(deliveryDate), new Date());
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
          交付预警
        </h1>
        <p className="text-gray-500 mt-1">存在风险的订单列表（超期、模型漏收、返工）</p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 text-sm">已超期</p>
          <p className="text-3xl font-bold text-red-700 mt-1">
            {orders.filter(o => isDelayed(o.deliveryDate)).length}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-600 text-sm">返工中</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">
            {orders.filter(o => o.status === 'rework').length}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-orange-600 text-sm">模型未接收</p>
          <p className="text-3xl font-bold text-orange-700 mt-1">
            {orders.filter(o => !o.modelReceived).length}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单信息
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  剩余时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  风险类型
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {riskOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNo}</p>
                      <p className="text-sm text-gray-500">{order.patientName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className={`text-sm font-medium ${
                      isDelayed(order.deliveryDate) ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {formatDistanceToNow(parseISO(order.deliveryDate), { 
                        addSuffix: true, 
                        locale: zhCN 
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {isDelayed(order.deliveryDate) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          <Clock className="w-3 h-3" />
                          已超期
                        </span>
                      )}
                      {!order.modelReceived && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                          <Package className="w-3 h-3" />
                          模型漏收
                        </span>
                      )}
                      {order.reworkCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                          <RefreshCw className="w-3 h-3" />
                          返工{order.reworkCount}次
                        </span>
                      )}
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
                      
                      {currentUser?.role === 'designer' && !order.modelReceived && (
                        <div className="relative">
                          <button
                            onClick={() => {
                              if (remarkOrderId === order.id && actionRemark.trim()) {
                                receiveModel(order.id, actionRemark);
                                setRemarkOrderId(null);
                                setActionRemark('');
                              } else if (remarkOrderId === order.id) {
                                receiveModel(order.id);
                                setRemarkOrderId(null);
                              } else {
                                setRemarkOrderId(order.id);
                                setActionRemark('');
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-sm transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            {remarkOrderId === order.id ? '确认' : '接收'}
                          </button>
                          {remarkOrderId === order.id && (
                            <div className="absolute right-0 top-full mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg w-72 z-10">
                              <p className="text-sm text-gray-600 mb-2">添加备注（可选）：</p>
                              <textarea
                                value={actionRemark}
                                onChange={(e) => setActionRemark(e.target.value)}
                                placeholder="口扫文件检查情况..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => { setRemarkOrderId(null); setActionRemark(''); }}
                                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => {
                                    receiveModel(order.id, actionRemark);
                                    setRemarkOrderId(null);
                                    setActionRemark('');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1 bg-sky-600 text-white text-sm rounded hover:bg-sky-700"
                                >
                                  <Send className="w-3 h-3" />
                                  确认
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {currentUser?.role === 'designer' && order.modelReceived && !order.shade && (
                        <Link
                          to={`/order/${order.id}/color`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm transition-colors"
                        >
                          <Palette className="w-4 h-4" />
                          确认色号
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DelayedOrders;
