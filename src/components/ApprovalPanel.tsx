import { useState } from 'react';
import { CheckCircle, XCircle, Package, RotateCcw, FileText, User, Phone, MapPin } from 'lucide-react';
import type { Machine } from '@/types';
import { approvalStatusLabels, approvalStatusColors, statusLabels, statusColors } from '@/utils/helpers';

interface ApprovalPanelProps {
  machine: Machine;
  onApprove: (machineId: string, approver: string, comments: string) => void;
  onReject: (machineId: string, approver: string, comments: string) => void;
  onCompleteDelivery: (machineId: string, delivery: Omit<Machine['delivery'], 'id' | 'createdAt'>) => void;
  onReturnToTesting: (machineId: string, operator: string, reason: string) => void;
}

export function ApprovalPanel({ machine, onApprove, onReject, onCompleteDelivery, onReturnToTesting }: ApprovalPanelProps) {
  const [approver, setApprover] = useState('');
  const [comments, setComments] = useState('');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnOperator, setReturnOperator] = useState('');
  const [deliveryData, setDeliveryData] = useState({
    customerName: machine.customerName,
    customerPhone: machine.customerPhone,
    deliveryDate: new Date().toLocaleDateString('zh-CN'),
    address: '',
    accessories: ['电源线', '鼠标', '键盘', '说明书'],
    warrantyCard: true,
    invoice: true,
    signer: '',
  });

  const handleApprove = () => {
    if (approver.trim()) {
      onApprove(machine.id, approver.trim(), comments);
    }
  };

  const handleReject = () => {
    if (approver.trim()) {
      onReject(machine.id, approver.trim(), comments);
    }
  };

  const handleDelivery = () => {
    if (deliveryData.signer.trim() && deliveryData.address.trim()) {
      onCompleteDelivery(machine.id, deliveryData);
      setShowDeliveryForm(false);
    }
  };

  const handleReturn = () => {
    if (returnReason.trim() && returnOperator.trim()) {
      onReturnToTesting(machine.id, returnOperator.trim(), returnReason.trim());
      setShowReturnModal(false);
      setReturnReason('');
      setReturnOperator('');
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">交付验收 - {machine.orderNo}</h2>
          <p className="text-sm text-gray-500">客户: {machine.customerName}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[machine.status]}`}>
          {statusLabels[machine.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">客户信息</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{machine.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{machine.customerPhone}</span>
              </div>
              {machine.oldLedgerNo && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">旧台账号: {machine.oldLedgerNo}</span>
                </div>
              )}
              {machine.siteRecord && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-500">现场记录: {machine.siteRecord}</p>
                </div>
              )}
            </div>
          </div>

          {machine.burnInTest && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">烤机测试结果</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">测试状态</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    machine.burnInTest.overallStatus === 'passed' ? 'bg-green-100 text-green-700' :
                    machine.burnInTest.overallStatus === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {machine.burnInTest.overallStatus === 'passed' ? '通过' :
                     machine.burnInTest.overallStatus === 'failed' ? '失败' : '进行中'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">测试时间</span>
                  <span className="text-gray-700">{machine.burnInTest.startTime}</span>
                </div>
                {machine.burnInTest.duration && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">测试时长</span>
                    <span className="text-gray-700">{machine.burnInTest.duration}分钟</span>
                  </div>
                )}
                {machine.burnInTest.remarks && (
                  <p className="text-sm text-gray-600 mt-2">备注: {machine.burnInTest.remarks}</p>
                )}
              </div>
            </div>
          )}

          {machine.approval && (
            <div className={`rounded-xl p-4 ${
              machine.approval.status === 'approved' ? 'bg-green-50' :
              machine.approval.status === 'rejected' ? 'bg-red-50' : 'bg-yellow-50'
            }`}>
              <h3 className="font-semibold text-gray-900 mb-3">验收记录</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">验收状态</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${approvalStatusColors[machine.approval.status]}`}>
                    {approvalStatusLabels[machine.approval.status]}
                  </span>
                </div>
                {machine.approval.approver && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">验收人</span>
                    <span className="text-gray-700">{machine.approval.approver}</span>
                  </div>
                )}
                {machine.approval.approvedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">验收时间</span>
                    <span className="text-gray-700">{machine.approval.approvedAt}</span>
                  </div>
                )}
                {machine.approval.comments && (
                  <p className="text-sm text-gray-600 mt-2">验收意见: {machine.approval.comments}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {machine.status === 'pending_approval' && (
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">验收操作</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">验收人</label>
                  <input
                    type="text"
                    value={approver}
                    onChange={(e) => setApprover(e.target.value)}
                    placeholder="请输入验收人姓名"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">验收意见</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="请输入验收意见..."
                    className="text-area h-24"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={!approver.trim()}
                    className="btn btn-danger flex-1 flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    驳回
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={!approver.trim()}
                    className="btn btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    通过验收
                  </button>
                </div>
              </div>
            </div>
          )}

          {machine.status === 'approved' && !machine.delivery && (
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">交付操作</h3>
              <button
                onClick={() => setShowDeliveryForm(true)}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Package className="h-4 w-4" />
                完成交付
              </button>
            </div>
          )}

          {machine.delivery && (
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">交付记录</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">交付日期</span>
                  <span className="text-gray-700">{machine.delivery.deliveryDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{machine.delivery.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">签收人</span>
                  <span className="text-gray-700">{machine.delivery.signer}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">保修卡</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    machine.delivery.warrantyCard ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {machine.delivery.warrantyCard ? '已提供' : '未提供'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">发票</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    machine.delivery.invoice ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {machine.delivery.invoice ? '已提供' : '未提供'}
                  </span>
                </div>
                {machine.delivery.accessories.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">配件清单:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {machine.delivery.accessories.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-white rounded text-xs text-gray-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {machine.status === 'rejected' && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">验收驳回</h3>
              <p className="text-sm text-gray-600 mb-4">此订单已被驳回，需要退回重新测试或调整配置。</p>
              {machine.approval && machine.approval.comments && (
                <p className="text-sm text-red-600 mb-4"><strong>驳回原因:</strong> {machine.approval.comments}</p>
              )}
              <button
                onClick={() => setShowReturnModal(true)}
                className="btn btn-warning w-full flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                退回处理
              </button>
            </div>
          )}
        </div>
      </div>

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退回处理</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">操作人员</label>
                <input
                  type="text"
                  value={returnOperator}
                  onChange={(e) => setReturnOperator(e.target.value)}
                  placeholder="请输入操作人员姓名"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退回原因</label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="请输入退回原因..."
                  className="text-area h-24"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleReturn}
                  disabled={!returnReason.trim() || !returnOperator.trim()}
                  className="btn btn-warning flex-1"
                >
                  确认退回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeliveryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">完成交付</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名</label>
                <input
                  type="text"
                  value={deliveryData.customerName}
                  onChange={(e) => setDeliveryData({ ...deliveryData, customerName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="text"
                  value={deliveryData.customerPhone}
                  onChange={(e) => setDeliveryData({ ...deliveryData, customerPhone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交付地址</label>
                <textarea
                  value={deliveryData.address}
                  onChange={(e) => setDeliveryData({ ...deliveryData, address: e.target.value })}
                  placeholder="请输入交付地址"
                  className="text-area h-16"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交付日期</label>
                <input
                  type="date"
                  value={deliveryData.deliveryDate}
                  onChange={(e) => setDeliveryData({ ...deliveryData, deliveryDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配件清单</label>
                <div className="flex flex-wrap gap-2">
                  {['电源线', '鼠标', '键盘', '说明书', '驱动光盘', '包装盒'].map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deliveryData.accessories.includes(item)}
                        onChange={(e) => {
                          const accessories = e.target.checked 
                            ? [...deliveryData.accessories, item]
                            : deliveryData.accessories.filter(a => a !== item);
                          setDeliveryData({ ...deliveryData, accessories });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryData.warrantyCard}
                    onChange={(e) => setDeliveryData({ ...deliveryData, warrantyCard: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">保修卡</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryData.invoice}
                    onChange={(e) => setDeliveryData({ ...deliveryData, invoice: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">发票</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">签收人</label>
                <input
                  type="text"
                  value={deliveryData.signer}
                  onChange={(e) => setDeliveryData({ ...deliveryData, signer: e.target.value })}
                  placeholder="请输入签收人姓名"
                  className="input"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeliveryForm(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleDelivery}
                  disabled={!deliveryData.signer.trim() || !deliveryData.address.trim()}
                  className="btn btn-success flex-1"
                >
                  确认交付
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
