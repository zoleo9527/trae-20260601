import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  Palette, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Package,
  Clock,
  Send
} from 'lucide-react';
import { formatDistanceToNow, isBefore, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { STATUS_LABELS, STATUS_COLORS, OrderStatus } from '@/types';

const OrderTable = ({ filterStatus }: { filterStatus?: OrderStatus[] }) => {
  const { orders, receiveModel } = useOrderStore();
  const { currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [remarkOrderId, setRemarkOrderId] = useState<string | null>(null);
  const [actionRemark, setActionRemark] = useState('');
  
  const filteredOrders = useMemo(() => {
    let result = orders;
    
    if (filterStatus) {
      result = result.filter(o => filterStatus.includes(o.status));
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.orderNo.toLowerCase().includes(term) ||
        o.patientName.toLowerCase().includes(term) ||
        o.clinic.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [orders, searchTerm, statusFilter, filterStatus]);
  
  const isDelayed = (deliveryDate: string) => {
    return isBefore(parseISO(deliveryDate), new Date());
  };
  
  const isUrgent = (deliveryDate: string) => {
    const daysLeft = Math.ceil(
      (parseISO(deliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 2 && daysLeft >= 0;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、患者、诊所..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>共 {filteredOrders.length} 条记录</span>
        </div>
      </div>
      
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
                色号
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                预警
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
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
                  {order.shade ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-sm font-medium">
                      <Palette className="w-3 h-3 mr-1" />
                      {order.shade}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">待确认</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className={`text-sm font-medium ${
                        isDelayed(order.deliveryDate) 
                          ? 'text-red-600' 
                          : isUrgent(order.deliveryDate)
                            ? 'text-amber-600'
                            : 'text-gray-700'
                      }`}>
                        {formatDistanceToNow(parseISO(order.deliveryDate), { 
                          addSuffix: true, 
                          locale: zhCN 
                        })}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-700">{order.currentHandler}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    {!order.modelReceived && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        <Package className="w-3 h-3" />
                        模型漏收
                      </span>
                    )}
                    {order.reworkCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                        <RefreshCw className="w-3 h-3" />
                        返工{order.reworkCount}次
                      </span>
                    )}
                    {isDelayed(order.deliveryDate) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        已超期
                      </span>
                    )}
                    {order.modelReceived && order.reworkCount === 0 && !isDelayed(order.deliveryDate) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        正常
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
                          {remarkOrderId === order.id ? '确认接收' : '接收模型'}
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
                    
                    {currentUser?.role === 'inspector' && order.status === 'quality_check' && (
                      <Link
                        to={`/order/${order.id}/rework`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        质检处理
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
  );
};

export default OrderTable;
