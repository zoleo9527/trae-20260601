import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { OrderStatus } from '../types';
import { ArrowLeft, MapPin, Clock, Truck, Plus, AlertTriangle, CheckCircle, X, Camera, History, FileText, AlertCircle } from 'lucide-react';

const addonTypes = [
  { type: '搬运钢琴', price: 300 },
  { type: '搬运冰箱', price: 150 },
  { type: '搬运洗衣机', price: 100 },
  { type: '爬楼费', price: 50 },
  { type: '超时费', price: 100 },
  { type: '其他', price: 0 },
];

const responsibilityOptions = ['我方责任', '客户责任', '双方责任'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loadOrderDetails = useAppStore((state) => state.loadOrderDetails);
  const updateOrderStatus = useAppStore((state) => state.updateOrderStatus);
  const assignVehicle = useAppStore((state) => state.assignVehicle);
  const addAddon = useAppStore((state) => state.addAddon);
  const addDamage = useAppStore((state) => state.addDamage);
  const updateExpenses = useAppStore((state) => state.updateExpenses);
  const reportException = useAppStore((state) => state.reportException);
  const currentOrder = useAppStore((state) => state.currentOrder);
  const addons = useAppStore((state) => state.addons);
  const damages = useAppStore((state) => state.damages);
  const expenses = useAppStore((state) => state.expenses);
  const logs = useAppStore((state) => state.logs);
  const user = useAppStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('info');
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [addonForm, setAddonForm] = useState({ type: '', quantity: 1, unitPrice: 0, description: '' });
  const [damageForm, setDamageForm] = useState({ description: '', value: 0, responsibility: '我方责任', photos: [] as string[] });
  const [assignForm, setAssignForm] = useState({ vehicleId: '', driverName: '' });
  const [exceptionForm, setExceptionForm] = useState({ type: 'late' as 'late' | 'damage' | 'dispute' | 'unconfirmed', message: '', severity: 'warning' as 'warning' | 'error' | 'critical' });

  useEffect(() => {
    if (id) {
      loadOrderDetails(id);
    }
  }, [id, loadOrderDetails]);

  if (!currentOrder) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-400">订单加载中...</div>
        </div>
      </div>
    );
  }

  const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
    reserved: { label: '已预约', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    transporting: { label: '运输中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    serving: { label: '服务中', color: 'text-green-600', bgColor: 'bg-green-100' },
    pending: { label: '待确认', color: 'text-orange-600', bgColor: 'bg-orange-100' },
    settling: { label: '待结算', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    completed: { label: '已完成', color: 'text-gray-500', bgColor: 'bg-gray-50' },
    dispute: { label: '纠纷处理', color: 'text-red-600', bgColor: 'bg-red-100' },
  };

  const status = statusConfig[currentOrder.status];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusActions = () => {
    const actions: { label: string; status: OrderStatus; color: string }[] = [];
    
    switch (currentOrder.status) {
      case 'reserved':
        actions.push({ label: '派车', status: 'transporting', color: 'bg-blue-600' });
        break;
      case 'transporting':
        actions.push({ label: '到达现场', status: 'serving', color: 'bg-green-600' });
        break;
      case 'serving':
        actions.push({ label: '提交加项', status: 'pending', color: 'bg-orange-600' });
        actions.push({ label: '完成服务', status: 'settling', color: 'bg-purple-600' });
        break;
      case 'pending':
        actions.push({ label: '审核通过', status: 'settling', color: 'bg-green-600' });
        actions.push({ label: '退回修改', status: 'serving', color: 'bg-red-600' });
        break;
      case 'settling':
        actions.push({ label: '客户确认', status: 'completed', color: 'bg-blue-600' });
        actions.push({ label: '客户拒付', status: 'dispute', color: 'bg-red-600' });
        break;
      default:
        break;
    }
    
    return actions;
  };

  const canAssignVehicle = user?.role === 'dispatcher' && currentOrder.status === 'reserved';
  const canAddAddon = user?.role === 'teamLead' && ['serving', 'pending'].includes(currentOrder.status);
  const canAddDamage = user?.role === 'teamLead' && ['serving', 'pending', 'settling'].includes(currentOrder.status);
  const canConfirmExpense = user?.role === 'customerService' && currentOrder.status === 'pending';

  const handleAddonSubmit = async () => {
    if (!addonForm.type) return;
    const price = addonForm.type === '其他' ? addonForm.unitPrice : addonTypes.find(a => a.type === addonForm.type)?.price || 0;
    await addAddon(id!, { type: addonForm.type, quantity: addonForm.quantity, unitPrice: price, description: addonForm.description, operatorId: user?.id || '' });
    setShowAddonModal(false);
    setAddonForm({ type: '', quantity: 1, unitPrice: 0, description: '' });
  };

  const handleDamageSubmit = async () => {
    if (!damageForm.description || damageForm.value <= 0) return;
    await addDamage(id!, { description: damageForm.description, value: damageForm.value, responsibility: damageForm.responsibility, photos: damageForm.photos });
    setShowDamageModal(false);
    setDamageForm({ description: '', value: 0, responsibility: '我方责任', photos: [] });
  };

  const handleAssignVehicle = async () => {
    if (!assignForm.vehicleId || !assignForm.driverName) return;
    await assignVehicle(id!, assignForm.vehicleId, assignForm.driverName);
    setShowAssignModal(false);
    setAssignForm({ vehicleId: '', driverName: '' });
  };

  const handleConfirmExpense = async () => {
    if (expenses) {
      await updateExpenses(id!, { ...expenses, status: 'approved' as const, confirmedAt: new Date().toISOString() });
      await updateOrderStatus(id!, 'settling');
      setShowConfirmModal(false);
    }
  };

  const handleReportException = async () => {
    if (!exceptionForm.message.trim()) return;
    await reportException({ orderId: id!, type: exceptionForm.type, message: exceptionForm.message, severity: exceptionForm.severity });
    setShowExceptionModal(false);
    setExceptionForm({ type: 'late', message: '', severity: 'warning' });
  };

  const addonTotal = addons.reduce((sum, a) => sum + a.unitPrice * a.quantity, 0);
  const damageTotal = damages.reduce((sum, d) => sum + d.value, 0);
  const totalFee = currentOrder.baseFee + addonTotal - damageTotal;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">订单详情</h2>
            <p className="text-sm text-gray-500">订单号: {currentOrder.id}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        {getStatusActions().map((action) => (
          <button
            key={action.status}
            onClick={() => updateOrderStatus(id!, action.status)}
            className={`${action.color} hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-colors`}
          >
            {action.label}
          </button>
        ))}
        {canAssignVehicle && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>分配车辆</span>
          </button>
        )}
        {canAddAddon && (
          <button
            onClick={() => setShowAddonModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加加项</span>
          </button>
        )}
        {canAddDamage && (
          <button
            onClick={() => setShowDamageModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>申报物损</span>
          </button>
        )}
        {canConfirmExpense && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>确认费用</span>
          </button>
        )}
        <button
          onClick={() => setShowExceptionModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          <span>上报异常</span>
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            基本信息
          </span>
        </button>
        <button
          onClick={() => setActiveTab('addons')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === 'addons' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            现场加项 ({addons.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('damages')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === 'damages' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            物损记录 ({damages.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === 'expenses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            费用明细
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4" />
            操作历史 ({logs.length})
          </span>
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">客户信息</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-20">姓名</span>
                <span className="font-medium">{currentOrder.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-20">电话</span>
                <span>{currentOrder.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-500 w-20">出发地</span>
                <div className="flex-1">
                  <MapPin className="w-4 h-4 text-gray-400 inline" />
                  <span className="ml-1">{currentOrder.addressFrom}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-500 w-20">目的地</span>
                <div className="flex-1">
                  <MapPin className="w-4 h-4 text-blue-500 inline" />
                  <span className="ml-1">{currentOrder.addressTo}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">订单信息</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-24">预约时间</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(currentOrder.scheduledTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-24">车辆信息</span>
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span>{currentOrder.driverName || '未分配'} · {currentOrder.vehicleId || '-'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-24">基础费用</span>
                <span className="text-lg font-bold text-blue-600">¥{currentOrder.baseFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-24">创建时间</span>
                <span className="text-sm text-gray-500">{formatDate(currentOrder.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'addons' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {addons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400">暂无加项记录</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">加项类型</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">数量</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">单价</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">金额</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">描述</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {addons.map((addon) => (
                    <tr key={addon.id} className="border-t border-gray-100">
                      <td className="px-6 py-4 font-medium">{addon.type}</td>
                      <td className="px-6 py-4 text-center">{addon.quantity}</td>
                      <td className="px-6 py-4 text-right">¥{addon.unitPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-semibold">¥{(addon.unitPrice * addon.quantity).toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-500">{addon.description || '-'}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{formatDate(addon.createdAt)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4" colSpan={3}>合计</td>
                    <td className="px-6 py-4 text-right text-blue-600">¥{addonTotal.toFixed(2)}</td>
                    <td className="px-6 py-4" colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'damages' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {damages.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400">暂无物损记录</div>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {damages.map((damage) => (
                <div key={damage.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{damage.description}</div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">责任认定: {damage.responsibility}</span>
                        <span className="text-lg font-bold text-red-600">¥{damage.value.toFixed(2)}</span>
                      </div>
                      {damage.photos.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {damage.photos.map((_, idx) => (
                            <div key={idx} className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{formatDate(damage.createdAt)}</span>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-end">
                  <span className="text-gray-500 mr-4">物损总计</span>
                  <span className="text-xl font-bold text-red-600">-¥{damageTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">基础费用</span>
                <span className="font-semibold">¥{currentOrder.baseFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">加项费用</span>
                <span className="font-semibold text-orange-600">+¥{addonTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">物损减免</span>
                <span className="font-semibold text-red-600">-¥{damageTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-800">应付总额</span>
                  <span className="text-2xl font-bold text-blue-600">¥{totalFee.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">费用状态</h4>
              <div className={`px-3 py-2 rounded-full text-sm font-medium inline-block ${expenses?.status === 'approved' ? 'bg-green-100 text-green-600' : expenses?.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                {expenses?.status === 'approved' ? '已确认' : expenses?.status === 'rejected' ? '已退回' : '待确认'}
              </div>
              {expenses?.confirmedAt && (
                <div className="mt-3 text-sm text-gray-500">
                  确认时间: {formatDate(expenses.confirmedAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400">暂无操作记录</div>
            </div>
          ) : (
            <div className="p-6">
              <div className="relative">
                {logs.map((log, index) => (
                  <div key={log.id} className="flex gap-4 mb-6 last:mb-0">
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      {index !== logs.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="font-medium text-gray-800">{log.action}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {log.operator} · {formatDate(log.timestamp)}
                      </div>
                      {log.details && (
                        <div className="text-sm text-gray-600 mt-2">{log.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">添加现场加项</h2>
              <button onClick={() => setShowAddonModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">加项类型</label>
                <select
                  value={addonForm.type}
                  onChange={(e) => {
                    setAddonForm({ ...addonForm, type: e.target.value, unitPrice: addonTypes.find(a => a.type === e.target.value)?.price || 0 });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">请选择加项类型</option>
                  {addonTypes.map((a) => (
                    <option key={a.type} value={a.type}>{a.type} (¥{a.price})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                <input
                  type="number"
                  value={addonForm.quantity}
                  onChange={(e) => setAddonForm({ ...addonForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min={1}
                />
              </div>
              {addonForm.type === '其他' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单价</label>
                  <input
                    type="number"
                    value={addonForm.unitPrice}
                    onChange={(e) => setAddonForm({ ...addonForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    min={0}
                    step={0.01}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
                <textarea
                  value={addonForm.description}
                  onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={2}
                  placeholder="请输入备注说明"
                />
              </div>
              <button
                onClick={handleAddonSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                添加加项
              </button>
            </div>
          </div>
        </div>
      )}

      {showDamageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">申报物损</h2>
              <button onClick={() => setShowDamageModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物损描述</label>
                <textarea
                  value={damageForm.description}
                  onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="请详细描述物品损坏情况"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品价值 (元)</label>
                <input
                  type="number"
                  value={damageForm.value}
                  onChange={(e) => setDamageForm({ ...damageForm, value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">责任认定</label>
                <select
                  value={damageForm.responsibility}
                  onChange={(e) => setDamageForm({ ...damageForm, responsibility: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {responsibilityOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">上传照片</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <Camera className="w-10 h-10 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">点击或拖拽上传照片</p>
                </div>
              </div>
              <button
                onClick={handleDamageSubmit}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                申报物损
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">分配车辆</h2>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">车辆编号</label>
                <input
                  type="text"
                  value={assignForm.vehicleId}
                  onChange={(e) => setAssignForm({ ...assignForm, vehicleId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="如: V001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">司机姓名</label>
                <input
                  type="text"
                  value={assignForm.driverName}
                  onChange={(e) => setAssignForm({ ...assignForm, driverName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请输入司机姓名"
                />
              </div>
              <button
                onClick={handleAssignVehicle}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">确认费用</h2>
                <p className="text-gray-500 mt-2">确认后订单将进入待结算状态</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">基础费用</span>
                  <span>¥{currentOrder.baseFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">加项费用</span>
                  <span className="text-orange-600">+¥{addonTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">物损减免</span>
                  <span className="text-red-600">-¥{damageTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">应付总额</span>
                    <span className="text-lg font-bold text-blue-600">¥{totalFee.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmExpense}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  确认费用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExceptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">上报异常</h2>
              <button onClick={() => setShowExceptionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
                <select
                  value={exceptionForm.type}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value as 'late' | 'damage' | 'dispute' | 'unconfirmed' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="late">车辆迟到</option>
                  <option value="damage">物品破损</option>
                  <option value="dispute">客户纠纷</option>
                  <option value="unconfirmed">费用待确认</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                <select
                  value={exceptionForm.severity}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, severity: e.target.value as 'warning' | 'error' | 'critical' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="warning">警告</option>
                  <option value="error">错误</option>
                  <option value="critical">紧急</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">异常描述</label>
                <textarea
                  value={exceptionForm.message}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="请详细描述异常情况..."
                />
              </div>
              <button
                onClick={handleReportException}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                确认上报
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
