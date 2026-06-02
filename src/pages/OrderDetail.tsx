import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Car,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { ordersApi, employeesApi, inspectionsApi } from '@/lib/api';
import type { Order, Employee } from '@/types';

const statusLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待分配', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  in_progress: { label: '施工中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: '已完工', color: 'text-green-600', bgColor: 'bg-green-100' },
  rework: { label: '需返工', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<'pass' | 'rework'>('pass');
  const [inspectionReason, setInspectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await ordersApi.get(parseInt(id));
      setOrder(data);
    } catch {
      setError('加载工单失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
    employeesApi.list().then(setEmployees);
  }, [id]);

  const handleAssign = async (employeeId: number) => {
    if (!order) return;
    try {
      await ordersApi.assign(order.id, employeeId);
      setShowAssignModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.message || '分配失败');
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    try {
      await ordersApi.updateStatus(order.id, 'completed');
      loadOrder();
    } catch (err: any) {
      setError(err.message || '操作失败');
    }
  };

  const handleStartWork = async () => {
    if (!order) return;
    try {
      await ordersApi.updateStatus(order.id, 'in_progress');
      loadOrder();
    } catch (err: any) {
      setError(err.message || '操作失败');
    }
  };

  const handleInspection = async () => {
    if (!order) return;
    setSubmitting(true);
    setError('');

    try {
      const inspector = employees.find((e) => e.role === 'inspector');
      if (!inspector) {
        throw new Error('未找到质检员');
      }

      await inspectionsApi.create({
        order_id: order.id,
        inspector_id: inspector.id,
        result: inspectionResult,
        reason: inspectionResult === 'rework' ? inspectionReason : undefined,
      });

      setShowInspectionModal(false);
      loadOrder();
    } catch (err: any) {
      setError(err.message || '质检提交失败');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-444">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-gray-444">
        工单不存在
        <button onClick={() => navigate('/')} className="block mx-auto mt-4 text-blue-500">
          返回列表
        </button>
      </div>
    );
  }

  const statusConfig = statusLabels[order.status] || statusLabels.pending;
  const technicians = employees.filter((e) => e.role === 'technician');

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工单详情</h1>
          <p className="text-sm text-gray-444">工单号：{order.id}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        <button onClick={loadOrder} className="text-gray-400 hover:text-gray-600">
          <RefreshCw size={20} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {order.is_rework ? (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertTriangle size={20} />
          <span className="font-medium">这是返工工单</span>
          {order.original_order_id && (
            <button
              onClick={() => navigate(`/order/${order.original_order_id}`)}
              className="ml-auto text-red-600 underline text-sm"
            >
              查看原工单
            </button>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Car size={20} className="text-blue-500" />
              车辆信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-444">车牌号</div>
                <div className="font-bold text-lg">{order.plate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-444">车型</div>
                <div className="font-medium">
                  {order.brand} {order.model}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-444">颜色</div>
                <div>{order.color}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} className="text-green-500" />
              客户信息
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-lg">{order.customer_name?.[0]}</span>
              </div>
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {order.customer_name}
                  {order.customer_level === 'vip' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">VIP</span>
                  )}
                </div>
                <div className="text-sm text-gray-444">{order.customer_phone}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package size={20} className="text-purple-500" />
              服务项目
            </h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{item.service_type}</span>
                    {item.package_name && (
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                        {item.package_name}
                      </span>
                    )}
                  </div>
                  <span className={item.price === 0 ? 'text-green-600' : 'text-gray-700'}>
                    {item.price === 0 ? '套餐扣次' : `¥${item.price}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-gray-444">共 {order.items?.length || 0} 项服务</span>
              <span className="text-xl font-bold text-gray-800">合计 ¥{order.total_amount}</span>
            </div>
          </div>

          {order.inspections && order.inspections.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-indigo-500" />
                质检记录
              </h2>
              <div className="space-y-3">
                {order.inspections.map((ins) => (
                  <div key={ins.id} className="p-4 rounded-lg border border-gray-444">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {ins.result === 'pass' ? (
                          <CheckCircle className="text-green-500" size={18} />
                        ) : (
                          <AlertTriangle className="text-red-500" size={18} />
                        )}
                        <span className="font-medium">
                          {ins.result === 'pass' ? '质检通过' : '需返工'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-444">{ins.created_at?.slice(0, 16)}</span>
                    </div>
                    {ins.reason && (
                      <div className="text-sm text-gray-444 mt-2">原因：{ins.reason}</div>
                    )}
                    <div className="text-sm text-gray-400 mt-2">质检员：{ins.inspector_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wrench size={20} className="text-orange-500" />
              施工信息
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-444">施工技师</div>
                <div className="font-medium">
                  {order.employee_name || (
                    <span className="text-gray-300">未分配</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-444">创建时间</div>
                <div>{order.created_at?.slice(0, 16)}</div>
              </div>
              {order.completed_at && (
                <div>
                  <div className="text-sm text-gray-444">完成时间</div>
                  <div>{order.completed_at?.slice(0, 16)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-444">
            <h2 className="text-lg font-semibold mb-4">操作</h2>
            <div className="space-y-3">
              {order.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <User size={18} />
                    分配技师
                  </button>
                </>
              )}
              {order.status === 'pending' && order.employee_id && (
                <button
                  onClick={handleStartWork}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Wrench size={18} />
                  开始施工
                </button>
              )}
              {order.status === 'in_progress' && (
                <button
                  onClick={handleComplete}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  施工完成
                </button>
              )}
              {(order.status === 'completed' || order.status === 'rework') && (
                <button
                  onClick={() => {
                    setInspectionResult('pass');
                    setInspectionReason('');
                    setShowInspectionModal(true);
                  }}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <ClipboardCheck size={18} />
                  提交质检
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">分配技师</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {technicians.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => handleAssign(tech.id)}
                  className="w-full p-4 rounded-lg border border-gray-444 hover:bg-blue-50 hover:border-blue-300 text-left transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">{tech.name[0]}</span>
                  </div>
                  <div className="font-medium">{tech.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showInspectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">质检确认</h2>
              <button onClick={() => setShowInspectionModal(false)} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setInspectionResult('pass')}
                  className={`flex-1 py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                    inspectionResult === 'pass'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-444 text-gray-444'
                  }`}
                >
                  <CheckCircle size={24} />
                  <span className="font-medium">通过</span>
                </button>
                <button
                  onClick={() => setInspectionResult('rework')}
                  className={`flex-1 py-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                    inspectionResult === 'rework'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-444 text-gray-444'
                  }`}
                >
                  <AlertTriangle size={24} />
                  <span className="font-medium">返工</span>
                </button>
              </div>

              {inspectionResult === 'rework' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    返工原因
                  </label>
                  <textarea
                    value={inspectionReason}
                    onChange={(e) => setInspectionReason(e.target.value)}
                    placeholder="请描述需要返工的问题..."
                    className="w-full px-3 py-2 border border-gray-444 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowInspectionModal(false)}
                  className="flex-1 py-2.5 border border-gray-444 rounded-lg text-gray-444 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleInspection}
                  disabled={submitting || (inspectionResult === 'rework' && !inspectionReason)}
                  className={`flex-1 py-2.5 rounded-lg text-white disabled:bg-gray-300 disabled:cursor-not-allowed ${
                    inspectionResult === 'pass'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? '提交中...' : '确认提交'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
