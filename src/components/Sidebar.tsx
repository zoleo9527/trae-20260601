import { X, FileText, Truck, Camera, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { useClaimStore } from '../store/claimStore';

export function Sidebar() {
  const { selectedClaimId, sidebarOpen, selectClaim, getClaimById, getOrderById, getVehicleById, getPaymentByClaimId } = useClaimStore();

  const claim = selectedClaimId ? getClaimById(selectedClaimId) : null;
  const order = claim ? getOrderById(claim.orderId) : null;
  const vehicle = claim ? getVehicleById(claim.vehicleId) : null;
  const payment = claim ? getPaymentByClaimId(claim.id) : null;

  if (!sidebarOpen || !claim) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    review: '审核中',
    approved: '已批准',
    paid: '已赔付',
    archived: '已归档',
    exception: '异常',
  };

  const responsibilityLabels: Record<string, string> = {
    company: '我方责任',
    customer: '客户责任',
    third_party: '第三方责任',
    undetermined: '责任待定',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    approved: 'bg-green-100 text-green-800',
    paid: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-gray-100 text-gray-600',
    exception: 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-semibold text-gray-800">申诉详情</h2>
        <button
          onClick={() => selectClaim(null)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">工单编号</span>
          <span className="font-mono text-sm text-primary-600">{claim.id}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[claim.status]}`}>
            {statusLabels[claim.status]}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${claim.status === 'exception' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
            {responsibilityLabels[claim.responsibility]}
          </span>
        </div>

        {claim.status === 'exception' && claim.exceptionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-red-800">当前异常</span>
                <p className="text-sm text-red-700 mt-1">{claim.exceptionReason}</p>
              </div>
            </div>
          </div>
        )}

        {claim.exceptionHistory.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              异常历史记录
            </h3>
            <div className="space-y-3">
              {claim.exceptionHistory.map((record) => (
                <div key={record.id} className="text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-orange-700">{record.reason}</span>
                    {record.resolved && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">已解决</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-orange-500">
                    <span>创建于 {formatDate(record.createdAt)} by {record.createdBy}</span>
                    {record.resolved && record.resolvedBy && (
                      <span>解决于 {formatDate(record.resolvedAt!)} by {record.resolvedBy}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            预约单信息
          </h3>
          {order ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">客户</span>
                <span className="text-sm font-medium">{order.customerName} {order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">出发地</span>
                <span className="text-sm">{order.addressFrom}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">目的地</span>
                <span className="text-sm">{order.addressTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">预约时间</span>
                <span className="text-sm">{formatDate(order.scheduledDate)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">未关联预约单</p>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary-600" />
            车辆排班
          </h3>
          {vehicle ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">车牌号</span>
                <span className="text-sm font-medium">{vehicle.plateNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">司机</span>
                <span className="text-sm">{vehicle.driverName} {vehicle.driverPhone}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">未关联车辆</p>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary-600" />
            物损照片
          </h3>
          {claim.damagePhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {claim.damagePhotos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={photo}
                    alt={`物损照片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">暂无照片</p>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-4">物损描述</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{claim.damageDescription}</p>
        </div>

        {payment && (
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-4">赔付信息</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">赔付金额</span>
                <span className="text-sm font-medium text-accent-600">¥{payment.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">支付方式</span>
                <span className="text-sm">
                  {payment.method === 'bank' ? '银行转账' : payment.method === 'wechat' ? '微信' : '支付宝'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">状态</span>
                <span className={`text-sm font-medium ${
                  payment.status === 'paid' ? 'text-green-600' :
                  payment.status === 'approved' ? 'text-blue-600' :
                  payment.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {payment.status === 'pending' ? '待审核' :
                   payment.status === 'approved' ? '已批准' :
                   payment.status === 'paid' ? '已打款' : '已拒绝'}
                </span>
              </div>
              {payment.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">审核时间</span>
                  <span className="text-sm">{formatDate(payment.approvedAt)}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">打款时间</span>
                  <span className="text-sm">{formatDate(payment.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary-600" />
            处理备注
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {claim.remarks.length > 0 ? (
              claim.remarks.map((remark) => (
                <div key={remark.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{remark.userName}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(remark.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{remark.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">暂无备注</p>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              创建时间
            </span>
            <span>{formatDate(claim.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              更新时间
            </span>
            <span>{formatDate(claim.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
