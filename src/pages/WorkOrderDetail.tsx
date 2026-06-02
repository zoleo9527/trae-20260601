
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  MapPin,
  AlertCircle,
  Wrench,
  CheckCircle2,
  FileText,
  ChevronRight,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { WorkOrder, Fault, FaultTimeline } from '../../shared/types';
import { useAuthStore } from '../store/authStore';

const statusSteps: { key: WorkOrder['status']; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: '待接单', icon: Clock },
  { key: 'accepted', label: '已接单', icon: User },
  { key: 'arrived', label: '已到达', icon: MapPin },
  { key: 'processing', label: '维修中', icon: Wrench },
  { key: 'completed', label: '已完成', icon: CheckCircle2 },
];

export function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [fault, setFault] = useState<Fault | null>(null);
  const [timeline, setTimeline] = useState<FaultTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [workOrderData] = await Promise.all([
          api.workOrders.get(id),
        ]);
        setWorkOrder(workOrderData);
        
        if (workOrderData.faultId) {
          const [faultData, timelineData] = await Promise.all([
            api.faults.get(workOrderData.faultId),
            api.faults.timeline(workOrderData.faultId),
          ]);
          setFault(faultData);
          setTimeline(timelineData);
        }
      } catch (error) {
        console.error('Failed to fetch work order data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    try {
      const updated = await api.workOrders.updateStatus(id, status);
      setWorkOrder(updated);
    } catch (error) {
      console.error('Failed to update work order status:', error);
    }
  };

  const calculateTimeout = () => {
    if (!workOrder) return null;
    const assignedAt = new Date(workOrder.assignedAt).getTime();
    const expectedDuration = workOrder.expectedDuration * 60 * 1000;
    const deadline = assignedAt + expectedDuration;
    const now = Date.now();
    
    if (now > deadline && workOrder.status !== 'completed') {
      const overtime = now - deadline;
      const hours = Math.floor(overtime / (1000 * 60 * 60));
      const minutes = Math.floor((overtime % (1000 * 60 * 60)) / (1000 * 60));
      return { hours, minutes };
    }
    return null;
  };

  const timeout = calculateTimeout();
  const currentStepIndex = statusSteps.findIndex((s) => s.key === workOrder?.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workOrder) {
    return <div>工单不存在</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/workorders')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回工单列表
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：工单信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 工单基本信息 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  工单详情 - {workOrder.id.toUpperCase()}
                </h1>
                <div className="flex items-center gap-3">
                  <StatusBadge type="workOrder" status={workOrder.status} />
                  {workOrder.priority === 'urgent' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      紧急
                    </span>
                  )}
                  {timeout && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <Timer className="w-3 h-3 mr-1" />
                      已超时 {timeout.hours}小时{timeout.minutes}分钟
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">所属站点</p>
                <Link
                  to={`/stations/${workOrder.stationId}`}
                  className="font-medium text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {workOrder.stationName}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">故障设备</p>
                <p className="font-medium text-gray-900">{workOrder.deviceName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">维修人员</p>
                <p className="font-medium text-gray-900">{workOrder.maintenanceName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">预计维修时长</p>
                <p className="font-medium text-gray-900">{workOrder.expectedDuration} 分钟</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">派单时间</p>
                <p className="font-medium text-gray-900">
                  {new Date(workOrder.assignedAt).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">预计到达时间</p>
                <p className="font-medium text-gray-900">
                  {workOrder.estimatedArrival
                    ? new Date(workOrder.estimatedArrival).toLocaleString('zh-CN')
                    : '-'}
                </p>
              </div>
              {workOrder.arrivedAt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">实际到达时间</p>
                  <p className="font-medium text-gray-900">
                    {new Date(workOrder.arrivedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              )}
              {workOrder.completedAt && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">完成时间</p>
                  <p className="font-medium text-gray-900">
                    {new Date(workOrder.completedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              )}
              {workOrder.actualDuration && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">实际维修时长</p>
                  <p className="font-medium text-gray-900">{workOrder.actualDuration} 分钟</p>
                </div>
              )}
            </div>
          </div>

          {/* 工单进度条 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Timer className="w-5 h-5 mr-2 text-blue-600" />
              工单进度
            </h2>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center relative flex-1 ${
                        index === statusSteps.length - 1 ? 'flex-0' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                          isCompleted
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs mt-2 text-center ${
                          isCompleted ? 'text-blue-600 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`absolute top-5 left-1/2 w-full h-1 -translate-y-1/2 ${
                            index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 关联故障时间线 */}
          {timeline.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                故障处理时间线
              </h2>
              <div className="relative">
                {timeline.map((item, index) => {
                  const isLast = index === timeline.length - 1;
                  return (
                    <div key={item.id} className="flex gap-4 pb-6">
                      <div className="relative flex flex-col items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center z-10">
                          <AlertCircle className="w-5 h-5 text-blue-600" />
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
          )}

          {/* 维修商操作按钮 */}
          {user?.role === 'maintenance' && workOrder.status !== 'completed' && workOrder.status !== 'timeout' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
              <div className="flex gap-3">
                {workOrder.status === 'pending' && (
                  <button
                    onClick={() => updateStatus('accepted')}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    确认接单
                  </button>
                )}
                {workOrder.status === 'accepted' && (
                  <button
                    onClick={() => updateStatus('arrived')}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    已到达现场
                  </button>
                )}
                {workOrder.status === 'arrived' && (
                  <button
                    onClick={() => updateStatus('processing')}
                    className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    开始维修
                  </button>
                )}
                {workOrder.status === 'processing' && (
                  <button
                    onClick={() => updateStatus('completed')}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    完成维修
                  </button>
                )}
              </div>
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

          {/* 超时预警 */}
          {timeout && (
            <div className="bg-red-50 rounded-xl shadow-sm p-5 border border-red-200">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                超时预警
              </h3>
              <p className="text-sm text-red-700 mb-3">
                该工单已超过承诺的 {workOrder.expectedDuration} 分钟维修时长
              </p>
              <div className="bg-white rounded-lg p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">超时时间</span>
                  <span className="font-medium text-red-600">
                    {timeout.hours}小时{timeout.minutes}分钟
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">派单时间</span>
                  <span className="font-medium text-gray-900">
                    {new Date(workOrder.assignedAt).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 快速信息 */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">工单信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  工单编号
                </span>
                <span className="font-mono font-medium text-gray-900">{workOrder.id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  维修人员
                </span>
                <span className="font-medium text-gray-900">{workOrder.maintenanceName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <Timer className="w-4 h-4 mr-2" />
                  预计时长
                </span>
                <span className="font-medium text-gray-900">{workOrder.expectedDuration}分钟</span>
              </div>
              {workOrder.actualDuration && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    实际时长
                  </span>
                  <span className="font-medium text-gray-900">{workOrder.actualDuration}分钟</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
