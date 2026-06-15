import { useParams } from 'react-router-dom';
import { Clock, CheckCircle, Wrench, AlertCircle, User, Phone, Calendar, FileText } from 'lucide-react';
import { useStore } from '../store';

const statusConfig = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  installing: { label: '待装机', color: 'bg-blue-100 text-blue-800', icon: Wrench },
  delivered: { label: '已交付', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  repairing: { label: '返修中', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { getOrderById } = useStore();
  const order = getOrderById(id || '');

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status].icon;
  const statusColor = statusConfig[order.status].color;
  const statusLabel = statusConfig[order.status].label;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{order.id}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusLabel}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">创建时间：{order.created_at}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 p-6">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <User className="w-5 h-5 text-blue-600" />
              客户信息
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-16">姓名：</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-16">电话：</span>
                <span className="font-medium">{order.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-16">下单日期：</span>
                <span className="font-medium">{order.order_date}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-16">创建人：</span>
                <span className="font-medium">{order.created_by}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Calendar className="w-5 h-5 text-green-600" />
              价格信息
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">订单总金额</span>
                <span className="text-lg font-bold text-gray-900">¥{order.total_price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">已付金额</span>
                <span className="text-lg font-bold text-green-600">¥{order.paid_amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-600">待补金额</span>
                <span className="text-lg font-bold text-orange-600">
                  ¥{(order.total_price - order.paid_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <FileText className="w-5 h-5 text-purple-600" />
              订单统计
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">配件种类</span>
                <span className="font-medium">{order.config_items.length} 种</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">改配记录</span>
                <span className="font-medium">{order.modify_records.length} 条</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-500">交付记录</span>
                <span className="font-medium">{order.delivery_records.length} 条</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">配置清单</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  配件名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  规格型号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  单价
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  小计
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.config_items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{item.part_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.spec}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ¥{item.unit_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ¥{item.total_price.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
