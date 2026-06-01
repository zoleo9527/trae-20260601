import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  AlertTriangle,
  MessageSquare,
  Clock,
  DollarSign,
  UserCheck,
  CheckCircle,
  XCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Room } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { PhotoGrid } from '../components/PhotoGrid';
import { Timeline } from '../components/Timeline';
import { Modal } from '../components/Modal';

interface InventoryDetailProps {
  room: Room;
  onBack: () => void;
}

export const InventoryDetail: React.FC<InventoryDetailProps> = ({ room, onBack }) => {
  const {
    assignCleaning,
    submitReinspection,
    initiateDeduction,
    cancelDeduction,
    recordNegotiation,
  } = useInventory();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  const [cleanerName, setCleanerName] = useState('');
  const [deductionAmount, setDeductionAmount] = useState(
    room.deductionAmount > 0
      ? room.deductionAmount
      : room.issues.reduce((sum, issue) => sum + issue.estimatedCost, 0)
  );
  const [deductionRemark, setDeductionRemark] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [negotiationResult, setNegotiationResult] = useState('');
  const [negotiationAdjustedAmount, setNegotiationAdjustedAmount] = useState<number>(
    room.deductionAmount
  );
  const [negotiationResolution, setNegotiationResolution] = useState('');

  const totalEstimatedCost = room.issues.reduce((sum, issue) => sum + issue.estimatedCost, 0);
  const effectiveDeduction = room.deductionAmount;
  const refundAmount = room.depositAmount - effectiveDeduction;

  const handleAssignCleaning = () => {
    if (cleanerName) {
      assignCleaning(room.id, cleanerName);
      setShowAssignModal(false);
      setCleanerName('');
    }
  };

  const handleInitiateDeduction = () => {
    if (deductionAmount > 0) {
      initiateDeduction(room.id, deductionAmount, deductionRemark || '验房扣款');
      setShowDeductionModal(false);
      setDeductionRemark('');
    }
  };

  const handleCancelDeduction = () => {
    if (cancelReason) {
      cancelDeduction(room.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
    }
  };

  const handleRecordNegotiation = () => {
    if (selectedDisputeId && negotiationResult) {
      recordNegotiation(
        room.id,
        selectedDisputeId,
        negotiationResult,
        negotiationAdjustedAmount !== room.deductionAmount ? negotiationAdjustedAmount : undefined,
        negotiationResolution || undefined
      );
      setShowNegotiationModal(false);
      setNegotiationResult('');
      setNegotiationResolution('');
      setSelectedDisputeId(null);
    }
  };

  const openNegotiationModal = (disputeId: string) => {
    setSelectedDisputeId(disputeId);
    setNegotiationAdjustedAmount(room.deductionAmount);
    setShowNegotiationModal(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              {room.building} {room.roomNumber} - 验房详情
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={room.status} />
              <span className="text-[11px] text-gray-500">
                客人: {room.guestName} ({room.guestPhone})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {room.status === 'CHECKED_OUT_TODAY' && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              指派保洁
            </button>
          )}
          {room.status === 'PENDING_CLEANING' && (
            <button
              onClick={() => submitReinspection(room.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition-colors"
            >
              <CheckCircle className="w-3 h-3" />
              提交复检
            </button>
          )}
          {(room.status === 'PENDING_REINSPECTION' || room.status === 'PENDING_CLEANING') &&
            room.issues.length > 0 && (
              <button
                onClick={() => setShowDeductionModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-sm transition-colors"
              >
                <DollarSign className="w-3 h-3" />
                发起扣款
              </button>
            )}
          {room.status === 'DEPOSIT_PENDING' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors"
            >
              <XCircle className="w-3 h-3" />
              撤回扣款
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-3">
          <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-gray-500" />
              <h3 className="text-[13px] font-medium text-gray-800">退房照片</h3>
              <span className="text-[11px] text-gray-400">({room.photos.length} 张)</span>
            </div>
            <div className="p-3">
              <PhotoGrid photos={room.photos} />
            </div>
          </div>

          <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              <h3 className="text-[13px] font-medium text-gray-800">保洁问题</h3>
              <span className="text-[11px] text-gray-400">({room.issues.length} 项)</span>
              {totalEstimatedCost > 0 && (
                <span className="ml-auto text-[11px] font-medium text-orange-600">
                  预估: ¥{totalEstimatedCost}
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {room.issues.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-[13px]">暂无问题记录</div>
              ) : (
                room.issues.map((issue) => (
                  <div key={issue.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
                            {issue.category}
                          </span>
                          <SeverityBadge severity={issue.severity} />
                        </div>
                        <p className="text-[13px] text-gray-700 mt-1.5">{issue.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                          <span>{issue.reporter}</span>
                          <span>{issue.reportTime}</span>
                        </div>
                      </div>
                      {issue.estimatedCost > 0 && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-semibold text-orange-600">
                            ¥{issue.estimatedCost}
                          </div>
                          <div className="text-[10px] text-gray-400">预估费用</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-red-500" />
              <h3 className="text-[13px] font-medium text-gray-800">客人异议</h3>
              <span className="text-[11px] text-gray-400">({room.disputes.length} 条)</span>
            </div>
            <div className="divide-y divide-gray-100">
              {room.disputes.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-[13px]">暂无异议</div>
              ) : (
                room.disputes.map((dispute) => (
                  <div key={dispute.id} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className={`text-[11px] font-medium px-1.5 py-0.5 rounded-sm ${
                              dispute.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : dispute.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-700'
                                : dispute.status === 'RESOLVED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {dispute.status === 'PENDING'
                              ? '待处理'
                              : dispute.status === 'IN_PROGRESS'
                              ? '处理中'
                              : dispute.status === 'RESOLVED'
                              ? '已解决'
                              : '已拒绝'}
                          </span>
                          <span className="text-[11px] text-gray-400">{dispute.submitTime}</span>
                        </div>
                        <p className="text-[13px] text-gray-700 bg-red-50 p-2 rounded-sm border border-red-100">
                          {dispute.content}
                        </p>
                        {dispute.resolution && (
                          <div className="mt-1.5 p-2 bg-green-50 rounded-sm border border-green-100">
                            <p className="text-[11px] font-medium text-green-700 mb-0.5">处理结果:</p>
                            <p className="text-[13px] text-gray-700">{dispute.resolution}</p>
                            {dispute.resolver && (
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {dispute.resolver} · {dispute.resolveTime}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {(dispute.status === 'PENDING' || dispute.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => openNegotiationModal(dispute.id)}
                          className="ml-3 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded-sm transition-colors flex-shrink-0"
                        >
                          <FileText className="w-3 h-3" />
                          记录协商
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-[13px] font-medium text-gray-800">押金与扣款</h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">押金金额</span>
                <span className="font-medium text-gray-800">¥{room.depositAmount}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">入住</span>
                <span className="text-gray-800">{room.checkInDate}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">退房</span>
                <span className="text-gray-800">{room.checkOutDate}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">问题预估</span>
                <span className={totalEstimatedCost > 0 ? 'text-orange-600' : 'text-green-600'}>
                  ¥{totalEstimatedCost}
                </span>
              </div>
              <div className="flex justify-between text-[13px] pt-1 border-t border-gray-100">
                <span className="text-gray-500">扣款金额</span>
                {room.deductionStatus === 'CANCELLED' ? (
                  <span className="font-medium text-gray-500">
                    ¥0 <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded-sm ml-1">已撤回</span>
                  </span>
                ) : room.deductionStatus === 'CONFIRMED' ? (
                  <span className="font-medium text-red-600">
                    ¥{effectiveDeduction} <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded-sm ml-1">已确认</span>
                  </span>
                ) : effectiveDeduction > 0 ? (
                  <span className="font-medium text-red-600">¥{effectiveDeduction}</span>
                ) : (
                  <span className="text-gray-500">未扣款</span>
                )}
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">扣款状态</span>
                <span
                  className={`font-medium px-1.5 py-0.5 rounded-sm text-[11px] ${
                    room.deductionStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : room.deductionStatus === 'CANCELLED'
                      ? 'bg-gray-100 text-gray-600'
                      : room.deductionStatus === 'CONFIRMED'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500'
                  }`}
                >
                  {room.deductionStatus === 'PENDING'
                    ? '待确认'
                    : room.deductionStatus === 'CANCELLED'
                    ? '已撤回'
                    : room.deductionStatus === 'CONFIRMED'
                    ? '已确认'
                    : '未发起'}
                </span>
              </div>
              {room.deductionRemark && (
                <div className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-sm">
                  {room.deductionRemark}
                </div>
              )}
              <div className="flex justify-between text-[13px] pt-1 border-t border-gray-100">
                <span className="text-gray-500">应退押金</span>
                <span className={`font-semibold ${refundAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{refundAmount}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm border border-gray-200 shadow-sm">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <h3 className="text-[13px] font-medium text-gray-800">操作记录</h3>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto">
              <Timeline logs={room.operationLogs} />
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="指派保洁">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">保洁人员</label>
            <select
              value={cleanerName}
              onChange={(e) => setCleanerName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择保洁人员</option>
              <option value="保洁-李阿姨">保洁-李阿姨</option>
              <option value="保洁-王阿姨">保洁-王阿姨</option>
              <option value="保洁-张阿姨">保洁-张阿姨</option>
              <option value="保洁-刘阿姨">保洁-刘阿姨</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAssignCleaning}
              disabled={!cleanerName}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-sm transition-colors"
            >
              确认指派
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeductionModal} onClose={() => setShowDeductionModal(false)} title="发起扣款">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">扣款金额</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              押金: ¥{room.depositAmount} | 问题预估: ¥{totalEstimatedCost}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">扣款说明</label>
            <textarea
              value={deductionRemark}
              onChange={(e) => setDeductionRemark(e.target.value)}
              rows={3}
              placeholder="请输入扣款说明..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="p-3 bg-amber-50 rounded-sm border border-amber-200">
            <p className="text-sm text-amber-700">
              发起后扣款金额将写入房间记录，应退押金 = 押金 - 扣款金额。客人可对扣款发起申诉。
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowDeductionModal(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleInitiateDeduction}
              disabled={deductionAmount <= 0}
              className="px-3 py-1.5 text-sm text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-sm transition-colors"
            >
              确认扣款
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="撤回扣款">
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-sm border border-amber-200">
            <p className="text-sm text-amber-700">
              撤回扣款后，当前扣款 ¥{room.deductionAmount} 将清零，押金 ¥{room.depositAmount} 全额退还客人，此操作不可撤销。
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">撤回原因</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="请输入撤回原因..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCancelDeduction}
              disabled={!cancelReason}
              className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-sm transition-colors"
            >
              确认撤回
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showNegotiationModal}
        onClose={() => {
          setShowNegotiationModal(false);
          setSelectedDisputeId(null);
        }}
        title="记录协商结果"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">协商内容</label>
            <textarea
              value={negotiationResult}
              onChange={(e) => setNegotiationResult(e.target.value)}
              rows={3}
              placeholder="请记录与客人的协商内容..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调整扣款金额</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                value={negotiationAdjustedAmount}
                onChange={(e) => setNegotiationAdjustedAmount(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              当前扣款: ¥{room.deductionAmount} | 押金: ¥{room.depositAmount} | 修改后应退: ¥{room.depositAmount - negotiationAdjustedAmount}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              处理结果 (留空表示仍在处理中)
            </label>
            <textarea
              value={negotiationResolution}
              onChange={(e) => setNegotiationResolution(e.target.value)}
              rows={2}
              placeholder="如有最终处理结果，请填写..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowNegotiationModal(false);
                setSelectedDisputeId(null);
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleRecordNegotiation}
              disabled={!negotiationResult}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-sm transition-colors"
            >
              保存记录
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
