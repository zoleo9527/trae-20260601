
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Wrench,
  MapPin,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Fault, FaultTimeline, Order } from '../../shared/types';

const timelineIcons: Record<string, typeof AlertCircle> = {
  detected: AlertCircle,
  assigned: User,
  arrived: MapPin,
  repaired: Wrench,
  verified: CheckCircle2,
  closed: CheckCircle2,
};

export function FaultDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fault, setFault] = useState<Fault | null>(null);
  const [timeline, setTimeline] = useState<FaultTimeline[]>([]);
  const [affectedOrders, setAffectedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [faultData, timelineData, ordersData] = await Promise.all([
          api.faults.get(id),
          api.faults.timeline(id),
          api.faults.orders(id),
        ]);
        setFault(faultData);
        setTimeline(timelineData);
        setAffectedOrders(ordersData);
      } catch (error) {
        console.error('Failed to fetch fault data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!fault) {
    return <div>故障不存在</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/faults')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回故障列表
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：故障信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 故障基本信息 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {fault.deviceName} - 故障详情
                </h1>
                <div className="flex items-center gap-3">
                  <StatusBadge type="fault" status={fault.status} />
                  <StatusBadge type="faultSeverity" status={fault.severity} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">所属站点</p>
                <p className="font-medium text-gray-900">{fault.stationName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">故障类型</p>
                <p className="font-medium text-gray-900">
                  {fault.type === 'offline' && '设备离线'}
                  {fault.type === 'interrupt' && '充电中断'}
                  {fault.type === 'hardware' && '硬件故障'}
                  {fault.type === 'network' && '网络故障'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">检测时间</p>
                <p className="font-medium text-gray-900">
                  {new Date(fault.detectedAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">故障描述</p>
                <p className="font-medium text-gray-900">{fault.description}</p>
              </div>
            </div>
          </div>

          {/* 故障时间线 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              故障时间线
            </h2>
            <div className="relative">
              {timeline.map((item, index) => {
                const Icon = timelineIcons[item.type] || Clock;
                const isLast = index === timeline.length - 1;
                return (
                  <div key={item.id} className="flex gap-4 pb-6">
                    <div className="relative flex flex-col items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center z-10">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      {!isLast && (
                        <div className="absolute top-10 w-0.5 h-full bg-gray-200"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-gray-600">{item.description}</p>
                      {item.operator && (
                        <p className="text-sm text-gray-500 mt-1">操作人：{item.operator}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 受影响订单 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-600" />
              受影响订单
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-sm">
                {affectedOrders.length} 笔
              </span>
            </h2>
            {affectedOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">电量</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {affectedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm text-gray-900">{order.id}</td>
                        <td className="px-4 py-3 text-gray-600">{order.userName}</td>
                        <td className="px-4 py-3 text-gray-600">{order.energy}kWh</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">¥{order.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge type="order" status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无受影响订单</p>
            )}
          </div>
        </div>

        {/* 右侧：快捷信息 */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">相关工单</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">工单状态</p>
              <StatusBadge type="workOrder" status="processing" />
              <p className="text-sm text-gray-500 mt-3 mb-2">维修人员</p>
              <p className="font-medium text-gray-900">王维修</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">退款统计</h3>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-red-600">
                ¥{affectedOrders.filter(o => o.status === 'refunded').reduce((sum, o) => sum + (o.refundAmount || 0), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">累计退款金额</p>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">退款订单数</span>
                <span className="font-medium text-gray-900">{affectedOrders.filter(o => o.status === 'refunded').length} 笔</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">中断订单数</span>
                <span className="font-medium text-gray-900">{affectedOrders.filter(o => o.status === 'interrupted').length} 笔</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
