
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  MapPin,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle,
  FileText,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Order, Fault, Complaint } from '../../shared/types';
import { useAuthStore } from '../store/authStore';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [fault, setFault] = useState<Fault | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const orderData = await api.orders.get(id);
        setOrder(orderData);

        if (orderData.faultId) {
          const [faultData, complaintsData] = await Promise.all([
            api.faults.get(orderData.faultId),
            api.complaints.list(),
          ]);
          setFault(faultData);
          const relatedComplaint = complaintsData.find((c) => c.orderId === id);
          setComplaint(relatedComplaint || null);
        }
      } catch (error) {
        console.error('Failed to fetch order data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleRefund = async () => {
    if (!order || !user) return;
    try {
      const updatedOrder = await api.orders.refund(order.id, refundReason, order.amount, user.name);
      setOrder(updatedOrder);
      setRefundModalOpen(false);
      setRefundReason('');
    } catch (error) {
      console.error('Failed to refund order:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div>订单不存在</div>;
  }

  const canRefund = (user?.role === 'admin' || user?.role === 'service' || user?.role === 'finance') && 
    order.status === 'interrupted';

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回订单列表
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：订单信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 订单基本信息 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  订单详情 - {order.id.toUpperCase()}
                </h1>
                <div className="flex items-center gap-3">
                  <StatusBadge type="order" status={order.status} />
                  {order.faultId && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      受故障影响
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">用户</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">{order.userName}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">充电设备</p>
                <p className="font-medium text-gray-900">{order.deviceName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">所属站点</p>
                <Link
                  to={`/stations/${order.stationId}`}
                  className="font-medium text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {order.stationName}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">充电电量</p>
                <div className="flex items-center">
                  <Zap className="w-4 h-4 mr-1 text-yellow-500" />
                  <span className="font-medium text-gray-900">{order.energy} kWh</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">开始时间</p>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {new Date(order.startTime).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">结束时间</p>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {order.endTime
                      ? new Date(order.endTime).toLocaleString('zh-CN')
                      : '进行中'}
                  </span>
                </div>
              </div>
              {order.duration && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">充电时长</p>
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-1 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {order.duration} 分钟
                    </span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">订单金额</p>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                  <span className="font-bold text-xl text-gray-900">
                    ¥{order.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 退款信息 */}
          {order.status === 'refunded' && (
            <div className="bg-orange-50 rounded-xl shadow-sm p-6 border border-orange-200">
              <h2 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                退款信息
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-orange-600 mb-1">退款金额</p>
                  <p className="font-bold text-xl text-orange-700">
                    ¥{order.refundAmount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-600 mb-1">退款原因</p>
                  <p className="font-medium text-orange-900">
                    {order.refundReason || '未填写'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          {canRefund && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
              <button
                onClick={() => setRefundModalOpen(true)}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-orange-700 transition-colors"
              >
                申请退款
              </button>
            </div>
          )}
        </div>

        {/* 右侧：关联信息 */}
        <div className="space-y-6">
          {/* 关联故障 */}
          {fault && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                关联故障
              </h3>
              <Link
                to={`/faults/${fault.id}`}
                className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{fault.deviceName}</span>
                  <StatusBadge type="fault" status={fault.status} />
                </div>
                <p className="text-sm text-gray-600 mb-2">{fault.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {new Date(fault.detectedAt).toLocaleString('zh-CN')}
                  </span>
                  <span className="text-blue-600 flex items-center">
                    查看详情 <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* 关联投诉 */}
          {complaint && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-500" />
                关联投诉
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{complaint.userName}</span>
                  <StatusBadge type="complaint" status={complaint.status} />
                </div>
                <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                {complaint.handleNotes && (
                  <div className="bg-green-50 rounded p-2 mt-2">
                    <p className="text-xs text-gray-500 mb-1">处理记录：</p>
                    <p className="text-sm text-gray-700">{complaint.handleNotes}</p>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  提交时间：{new Date(complaint.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          )}

          {/* 费用明细 */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">费用明细</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">充电电量</span>
                <span className="font-medium text-gray-900">{order.energy} kWh</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">电价</span>
                <span className="font-medium text-gray-900">¥1.50 / kWh</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">订单金额</span>
                  <span className="font-bold text-lg text-gray-900">¥{order.amount.toFixed(2)}</span>
                </div>
              </div>
              {order.refundAmount && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-medium">已退款</span>
                    <span className="font-bold text-lg text-orange-600">-¥{order.refundAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 订单信息 */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">订单信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  订单编号
                </span>
                <span className="font-mono font-medium text-gray-900">{order.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  用户ID
                </span>
                <span className="font-mono font-medium text-gray-900">{order.userId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  设备ID
                </span>
                <span className="font-mono font-medium text-gray-900">{order.deviceId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 退款弹窗 */}
      {refundModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">申请退款</h3>
            <p className="text-sm text-gray-600 mb-4">
              订单 <span className="font-mono">{order.id}</span> - ¥{order.amount.toFixed(2)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">退款原因</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="请输入退款原因"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRefundModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认退款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
