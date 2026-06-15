import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Wrench,
  CreditCard,
  FileCheck,
  Package,
  CheckCircle,
  Clock,
  Upload,
  Image as ImageIcon,
  Plus,
  X,
  Download,
} from 'lucide-react';
import { formatMoney } from '../utils/format';
import { downloadTextFile, exportNotesToText } from '../utils/export';
import type { ChargeMethod } from '../types/order';

export const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getOrderById,
    currentRole,
    currentUser,
    assignEngineer,
    confirmCharge,
    uploadReceipt,
    confirmReceipt,
    confirmPartReturn,
    completeOrder,
    updateOrderStatus,
  } = useOrderStore();

  const order = getOrderById(id || '');

  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeMethod, setChargeMethod] = useState<ChargeMethod>('微信');
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [hasReturn, setHasReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const engineers = ['李明', '王强', '张伟', '刘洋'];

  const canAssign = currentRole === '客服' && order?.status === 'pending_assign';
  const canStartWork =
    currentRole === '工程师' &&
    order?.status === 'pending_work' &&
    order.assignedTo === currentUser;
  const canFinishWork =
    currentRole === '工程师' &&
    order?.status === 'working' &&
    order.assignedTo === currentUser;
  const canConfirmCharge =
    (currentRole === '工程师' || currentRole === '客服') &&
    order?.status === 'pending_charge';
  const canUploadReceipt =
    currentRole === '工程师' &&
    order?.status === 'pending_receipt' &&
    order?.assignedTo === currentUser;
  const canConfirmReceipt = currentRole === '客服' && order?.status === 'pending_receipt';
  const canHandleReturn =
    (currentRole === '配件管理员' || currentRole === '工程师') &&
    order?.status === 'pending_return';
  const canReview = currentRole === '客服' && order?.status === 'pending_review';

  const handleAssign = () => {
    if (!order || !selectedEngineer) return;
    assignEngineer(order.id, selectedEngineer);
    setShowAssignModal(false);
    setSelectedEngineer('');
  };

  const handleStartWork = () => {
    if (!order) return;
    updateOrderStatus(order.id, 'working');
  };

  const handleFinishWork = () => {
    if (!order) return;
    updateOrderStatus(order.id, 'pending_charge');
  };

  const handleConfirmCharge = () => {
    if (!order || !chargeAmount) return;
    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效金额');
      return;
    }
    confirmCharge(order.id, amount, chargeMethod);
    setShowChargeModal(false);
    setChargeAmount('');
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      uploadReceipt(order.id, base64);
    };
    reader.readAsDataURL(file);
    setShowReceiptModal(false);
  };

  const handleConfirmReceipt = () => {
    if (!order) return;
    confirmReceipt(order.id);
  };

  const handleConfirmReturn = () => {
    if (!order) return;
    if (hasReturn && !returnReason.trim()) {
      alert('请填写退回原因');
      return;
    }
    confirmPartReturn(order.id, hasReturn, returnReason.trim());
    setShowReturnModal(false);
    setHasReturn(false);
    setReturnReason('');
  };

  const handleComplete = () => {
    if (!order) return;
    if (confirm('确认要结案吗？结案后工单将标记为已完成。')) {
      completeOrder(order.id);
    }
  };

  const handleExportNotes = () => {
    if (!order) return;
    downloadTextFile(exportNotesToText(order), `${order.id}_备注记录.txt`);
  };

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500">工单不存在</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
          >
            返回工作台
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
          <div className="h-5 w-px bg-slate-200"></div>
          <h2 className="text-lg font-semibold text-slate-800">{order.id}</h2>
          <StatusBadge status={order.status} />
        </div>
        <button
          onClick={handleExportNotes}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <Download className="w-4 h-4" />
          导出备注
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* 左侧：主要信息 */}
        <div className="col-span-2 space-y-5">
          {/* 基础信息 */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium text-slate-800">工单基础信息</h3>
              {canAssign && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  分配工程师
                </button>
              )}
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400">客户姓名</div>
                    <div className="text-sm text-slate-700 font-medium">
                      {order.customer.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400">联系电话</div>
                    <div className="text-sm text-slate-700">{order.customer.phone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400">地址</div>
                    <div className="text-sm text-slate-700">{order.customer.address}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Wrench className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400">家电信息</div>
                    <div className="text-sm text-slate-700 font-medium">
                      {order.appliance.brand} {order.appliance.type}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      型号：{order.appliance.model}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400">故障描述</div>
                    <div className="text-sm text-slate-700">{order.appliance.fault}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-400">分配工程师</div>
                    <div className="text-sm text-slate-700">
                      {order.assignedTo || (
                        <span className="text-amber-600">未分配</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 配件信息 */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                配件清单
                <span className="text-xs text-slate-400 font-normal">
                  ({order.parts.length}项)
                </span>
              </h3>
            </div>
            {order.parts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">暂无配件记录</div>
            ) : (
              <div className="p-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-100">
                      <th className="text-left py-2 font-medium">配件名称</th>
                      <th className="text-center py-2 font-medium">数量</th>
                      <th className="text-right py-2 font-medium">单价</th>
                      <th className="text-right py-2 font-medium">小计</th>
                      <th className="text-center py-2 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.parts.map((part) => (
                      <tr key={part.id} className="border-b border-slate-50">
                        <td className="py-2.5 text-slate-700">{part.name}</td>
                        <td className="py-2.5 text-center text-slate-600">
                          {part.quantity}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
                          {formatMoney(part.unitPrice)}
                        </td>
                        <td className="py-2.5 text-right text-slate-700 font-medium">
                          {formatMoney(part.quantity * part.unitPrice)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              part.used
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {part.used ? '已使用' : '未使用'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td colSpan={3} className="py-2.5 text-right text-slate-500 text-sm">
                        配件合计
                      </td>
                      <td className="py-2.5 text-right text-slate-800 font-semibold">
                        {formatMoney(
                          order.parts
                            .filter((p) => p.used)
                            .reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)
                        )}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* 配件退回信息 */}
            {order.partReturn.hasReturn || order.status === 'pending_return' ? (
              <div className="px-5 pb-5">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                    <Package className="w-4 h-4" />
                    配件退回
                  </div>
                  <div className="text-xs text-amber-600">
                    状态：
                    {order.partReturn.status === 'pending' && '待退回'}
                    {order.partReturn.status === 'returned' && '已退回'}
                    {order.partReturn.status === 'confirmed' && '已确认'}
                  </div>
                  {order.partReturn.reason && (
                    <div className="text-xs text-amber-600 mt-1">
                      退回原因：{order.partReturn.reason}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* 历史备注 */}
          <Timeline notes={order.notes} orderId={order.id} />
        </div>

        {/* 右侧：操作和状态 */}
        <div className="space-y-5">
          {/* 完工收费 */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-500" />
                完工收费
              </h3>
              {order.charge.confirmedAt ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  已确认
                </span>
              ) : (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  待处理
                </span>
              )}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-slate-500">收费金额</span>
                <span className="text-2xl font-bold text-slate-800">
                  {order.charge.amount > 0
                    ? formatMoney(order.charge.amount)
                    : <span className="text-slate-400 font-normal text-base">-</span>
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">收费方式</span>
                <span className="text-sm text-slate-700">
                  {order.charge.paidAt ? order.charge.method : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">收费时间</span>
                <span className="text-sm text-slate-700">
                  {order.charge.paidAt || '-'}
                </span>
              </div>
              {order.charge.confirmedBy && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">确认人</span>
                  <span className="text-sm text-slate-700">
                    {order.charge.confirmedBy}
                  </span>
                </div>
              )}

              {canConfirmCharge && (
                <button
                  onClick={() => {
                    setChargeAmount(order.charge.amount > 0 ? String(order.charge.amount) : '');
                    setShowChargeModal(true);
                  }}
                  className="w-full mt-2 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {order.charge.amount > 0 ? '确认收费' : '登记收费'}
                </button>
              )}
            </div>
          </div>

          {/* 电子回单 */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium text-slate-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-500" />
                电子回单
              </h3>
              {order.receipt.confirmedAt ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  已确认
                </span>
              ) : order.receipt.images.length > 0 ? (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  待确认
                </span>
              ) : (
                <span className="text-xs text-slate-400">未上传</span>
              )}
            </div>
            <div className="p-5">
              {order.receipt.images.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-md p-6 text-center">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">暂无回单图片</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {order.receipt.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-slate-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                      onClick={() => setPreviewImage(img)}
                    >
                      <img
                        src={img}
                        alt={`回单 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          点击查看
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {order.receipt.uploadedAt && (
                <div className="mt-3 text-xs text-slate-400">
                  上传时间：{order.receipt.uploadedAt}
                </div>
              )}
              {order.receipt.confirmedBy && (
                <div className="text-xs text-slate-400">
                  确认人：{order.receipt.confirmedBy}
                </div>
              )}

              <div className="mt-3 space-y-2">
                {canUploadReceipt && (
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="w-full py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    上传回单
                  </button>
                )}
                {canConfirmReceipt && order.receipt.images.length > 0 && (
                  <button
                    onClick={handleConfirmReceipt}
                    className="w-full py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    确认回单
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 操作区 */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="font-medium text-slate-800">操作</h3>
            </div>
            <div className="p-5 space-y-2">
              {canStartWork && (
                <button
                  onClick={handleStartWork}
                  className="w-full py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  开始施工
                </button>
              )}
              {canFinishWork && (
                <button
                  onClick={handleFinishWork}
                  className="w-full py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  登记完工
                </button>
              )}
              {canHandleReturn && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="w-full py-2 bg-pink-600 text-white text-sm rounded-md hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  配件退回处理
                </button>
              )}
              {canReview && (
                <button
                  onClick={handleComplete}
                  className="w-full py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  审核结案
                </button>
              )}
              {order.status === 'completed' && (
                <div className="text-center py-2 text-sm text-slate-500">
                  工单已结案
                </div>
              )}
              {!canStartWork &&
                !canFinishWork &&
                !canHandleReturn &&
                !canReview &&
                !canConfirmCharge &&
                !canUploadReceipt &&
                !canConfirmReceipt &&
                !canAssign &&
                order.status !== 'completed' && (
                  <div className="text-center py-2 text-sm text-slate-400">
                    当前角色无待操作事项
                  </div>
                )}
            </div>
          </div>

          {/* 流程进度 */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="font-medium text-slate-800">工单进度</h3>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>创建</span>
                <span>派单</span>
                <span>施工</span>
                <span>收费</span>
                <span>回单</span>
                <span>结案</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                  style={{
                    width:
                      order.status === 'pending_assign'
                        ? '10%'
                        : order.status === 'pending_work'
                        ? '25%'
                        : order.status === 'working'
                        ? '40%'
                        : order.status === 'pending_charge'
                        ? '55%'
                        : order.status === 'pending_receipt'
                        ? '70%'
                        : order.status === 'pending_return' || order.status === 'pending_review'
                        ? '85%'
                        : '100%',
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 收费弹窗 */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium text-slate-800">登记收费</h3>
              <button
                onClick={() => setShowChargeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1.5">收费金额（元）</label>
                <input
                  type="number"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  placeholder="请输入收费金额"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1.5">收费方式</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['微信', '支付宝', '现金', '转账'] as ChargeMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setChargeMethod(m)}
                      className={`py-1.5 text-sm rounded-md border transition-colors ${
                        chargeMethod === m
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowChargeModal(false)}
                className="px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleConfirmCharge}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回单上传弹窗 */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium text-slate-800">上传电子回单</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block">
                <div className="border-2 border-dashed border-slate-200 rounded-md p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">点击选择图片</p>
                  <p className="text-xs text-slate-400 mt-1">支持 JPG、PNG 格式</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 分配工程师弹窗 */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium text-slate-800">分配工程师</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm text-slate-600 mb-1.5">选择工程师</label>
              <div className="space-y-2">
                {engineers.map((eng) => (
                  <button
                    key={eng}
                    onClick={() => setSelectedEngineer(eng)}
                    className={`w-full px-3 py-2.5 text-left text-sm rounded-md border transition-colors ${
                      selectedEngineer === eng
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {eng}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedEngineer}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 配件退回弹窗 */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-medium text-slate-800">配件退回处理</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">是否有配件退回？</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setHasReturn(false)}
                    className={`flex-1 py-2 text-sm rounded-md border transition-colors ${
                      !hasReturn
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    无退回
                  </button>
                  <button
                    onClick={() => setHasReturn(true)}
                    className={`flex-1 py-2 text-sm rounded-md border transition-colors ${
                      hasReturn
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    有退回
                  </button>
                </div>
              </div>
              {hasReturn && (
                <div>
                  <label className="block text-sm text-slate-600 mb-1.5">退回原因</label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="请填写退回原因"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览 */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-8"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={previewImage}
            alt="回单预览"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};
