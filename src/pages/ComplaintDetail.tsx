
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  MessageSquare,
  FileText,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Complaint, Order, Fault } from '../../shared/types';
import { useAuthStore } from '../store/authStore';

const complaintTypeLabels: Record<string, string> = {
  device: '设备故障',
  interrupt: '充电中断',
  charge: '费用异议',
  other: '其他问题',
};

export function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [fault, setFault] = useState<Fault | null>(null);
  const [loading, setLoading] = useState(true);
  const [handleModalOpen, setHandleModalOpen] = useState(false);
  const [handleNotes, setHandleNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const complaintData = await api.complaints.get(id);
        setComplaint(complaintData);

        const promises: Promise<any>[] = [];
        if (complaintData.orderId) {
          promises.push(api.orders.get(complaintData.orderId));
        }
        if (complaintData.faultId) {
          promises.push(api.faults.get(complaintData.faultId));
        }

        const results = await Promise.all(promises);
        if (complaintData.orderId) {
          setOrder(results.shift() as Order);
        }
        if (complaintData.faultId) {
          setFault(results.shift() as Fault);
        }
      } catch (error) {
        console.error('Failed to fetch complaint data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleProcess = async (status: string) => {
    if (!complaint || !user) return;
    try {
      await api.complaints.update(complaint.id, {
        status: status as Complaint['status'],
        handler: user.name,
        handleNotes,
      });
      setComplaint({
        ...complaint,
        status: status as Complaint['status'],
        handler: user.name,
        handleNotes,
        handledAt: new Date().toISOString(),
      });
      setHandleModalOpen(false);
      setHandleNotes('');
    } catch (error) {
      console.error('Failed to update complaint:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!complaint) {
    return <div>投诉不存在</div>;
  }

  const canHandle = (user?.role === 'admin' || user?.role === 'service') && 
    (complaint.status === 'pending' || complaint.status === 'processing');

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/complaints')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回投诉列表
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：投诉信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 投诉基本信息 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  投诉详情 - {complaint.id.toUpperCase()}
                </h1>
                <div className="flex items-center gap-3">
                  <StatusBadge type="complaint" status={complaint.status} />
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {complaintTypeLabels[complaint.type]}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">用户</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">{complaint.userName}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">联系电话</p>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium text-gray-900">{complaint.userPhone}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">提交时间</p>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {new Date(complaint.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
              {complaint.handledAt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">处理时间</p>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    <span className="font-medium text-gray-900">
                      {new Date(complaint.handledAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              )}
              {complaint.handler && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">处理人</p>
                  <span className="font-medium text-gray-900">{complaint.handler}</span>
                </div>
              )}
            </div>
          </div>

          {/* 投诉内容 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
              投诉内容
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
            </div>
          </div>

          {/* 处理记录 */}
          {complaint.handleNotes && (
            <div className="bg-green-50 rounded-xl shadow-sm p-6 border border-green-200">
              <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                处理记录
              </h2>
              <div className="bg-white rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{complaint.handleNotes}</p>
                {complaint.handler && (
                  <p className="text-sm text-gray-500 mt-3">处理人：{complaint.handler}</p>
                )}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          {canHandle && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
              <div className="flex gap-3">
                {complaint.status === 'pending' && (
                  <button
                    onClick={() => {
                      setHandleNotes('');
                      setHandleModalOpen(true);
                    }}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    受理投诉
                  </button>
                )}
                {(complaint.status === 'pending' || complaint.status === 'processing') && (
                  <button
                    onClick={() => {
                      setHandleNotes('');
                      setHandleModalOpen(true);
                    }}
                    className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    标记已解决
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：关联信息 */}
        <div className="space-y-6">
          {/* 关联订单 */}
          {order && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                关联订单
              </h3>
              <Link
                to={`/orders/${order.id}`}
                className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-gray-900">{order.id}</span>
                  <StatusBadge type="order" status={order.status} />
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">{order.deviceName}</span>
                  <span className="font-medium text-gray-900">¥{order.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {new Date(order.startTime).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-blue-600 flex items-center">
                    查看详情 <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </div>
          )}

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
                    {new Date(fault.detectedAt).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="text-blue-600 flex items-center">
                    查看详情 <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* 投诉信息 */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">投诉信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  投诉编号
                </span>
                <span className="font-mono font-medium text-gray-900">{complaint.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  投诉类型
                </span>
                <span className="font-medium text-gray-900">
                  {complaintTypeLabels[complaint.type]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  提交时间
                </span>
                <span className="font-medium text-gray-900">
                  {new Date(complaint.createdAt).toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 处理弹窗 */}
      {handleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">处理投诉</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">投诉内容：</p>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{complaint.description}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">处理备注</label>
              <textarea
                value={handleNotes}
                onChange={(e) => setHandleNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder="请输入处理备注"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setHandleModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              {complaint.status === 'pending' && (
                <button
                  onClick={() => handleProcess('processing')}
                  disabled={!handleNotes.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  标记处理中
                </button>
              )}
              <button
                onClick={() => handleProcess('resolved')}
                disabled={!handleNotes.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                标记已解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
