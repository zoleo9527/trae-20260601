import {
    ArrowLeft,
    Award,
    Check,
    Gift,
    RefreshCw,
    Send,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    COMPENSATION_TYPE_LABELS,
    ROLE_LABELS,
    SOURCE_LABELS,
    TYPE_LABELS,
    type CompensationType
} from '../../shared/types';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import { useStore } from '../store/useStore';

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedComplaint, fetchComplaintDetail, executeAction, proposeCompensation, currentRole, currentUserName, loading } = useStore();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState<'review' | 'compensation'>('review');
  const [showCompensationModal, setShowCompensationModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [compensationType, setCompensationType] = useState<CompensationType>('refund');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [compensationDesc, setCompensationDesc] = useState('');
  const [supplementaryNote, setSupplementaryNote] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (id) {
      fetchComplaintDetail(id);
    }
  }, [id]);

  if (loading && !selectedComplaint) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!selectedComplaint) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">投诉记录不存在</p>
        <Link to="/complaints" className="btn-primary mt-4 inline-block">
          返回列表
        </Link>
      </div>
    );
  }

  const { status, currentHandlerRole, actionLogs, compensations } = selectedComplaint;

  const canSubmit = status === 'draft' && currentRole === 'reception';
  const canReviewApprove = status === 'pending_review' && currentRole === 'manager';
  const canReviewReject = status === 'pending_review' && currentRole === 'manager';
  const canResubmit = status === 'review_rejected' && currentRole === currentHandlerRole;
  const canProposeCompensation = (status === 'pending_compensation' || status === 'compensation_rejected') && currentRole === 'reception';
  const hasPendingCompensation = compensations.some((c) => c.status === 'pending');
  const canApproveCompensation = status === 'pending_compensation' && currentRole === 'manager' && hasPendingCompensation;
  const canRejectCompensation = status === 'pending_compensation' && currentRole === 'manager' && hasPendingCompensation;
  const canComplete = status === 'completed';

  const latestRejectLog = [...actionLogs].reverse().find((log) => log.actionType === 'review_reject' || log.actionType === 'compensation_reject');
  const latestResubmitLog = [...actionLogs].reverse().find((log) => log.actionType === 'resubmit');

  async function handleSubmit() {
    if (!id) return;
    await executeAction(id, { actionType: 'submit', remark: remark || undefined });
    setRemark('');
  }

  async function handleReviewApprove() {
    if (!id) return;
    await executeAction(id, { actionType: 'review_approve', remark: remark || undefined });
    setRemark('');
  }

  async function handleReviewReject() {
    if (!id || !rejectReason.trim()) return;
    await executeAction(id, { actionType: 'review_reject', rejectReason });
    setRejectReason('');
    setShowRejectModal(false);
  }

  async function handleResubmit() {
    if (!id || !supplementaryNote.trim()) return;
    await executeAction(id, { actionType: 'resubmit', supplementaryNote, remark: remark || undefined });
    setSupplementaryNote('');
    setRemark('');
    setShowResubmitModal(false);
  }

  async function handleProposeCompensation() {
    if (!id || !compensationDesc.trim()) return;
    await proposeCompensation(id, {
      type: compensationType,
      amount: compensationAmount ? parseFloat(compensationAmount) : undefined,
      description: compensationDesc,
    });
    setCompensationType('refund');
    setCompensationAmount('');
    setCompensationDesc('');
    setShowCompensationModal(false);
  }

  async function handleApproveCompensation() {
    if (!id) return;
    await executeAction(id, { actionType: 'compensation_approve', remark: remark || undefined });
    setRemark('');
  }

  async function handleRejectCompensation() {
    if (!id || !rejectReason.trim()) return;
    await executeAction(id, { actionType: 'compensation_reject', rejectReason });
    setRejectReason('');
    setShowRejectModal(false);
  }

  async function handleComplete() {
    if (!id) return;
    await executeAction(id, { actionType: 'complete', remark: remark || undefined });
    setRemark('');
  }

  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} />
        返回
      </button>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-serif font-bold text-gray-900">{selectedComplaint.title}</h1>
                  <StatusBadge status={selectedComplaint.status} />
                  <PriorityBadge priority={selectedComplaint.priority} />
                </div>
                <p className="text-sm text-gray-500">投诉单号: {selectedComplaint.complaintNo}</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">{selectedComplaint.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">投诉类型:</span>
                <span className="ml-2 text-gray-900 font-medium">{TYPE_LABELS[selectedComplaint.type]}</span>
              </div>
              <div>
                <span className="text-gray-500">来源渠道:</span>
                <span className="ml-2 text-gray-900 font-medium">{SOURCE_LABELS[selectedComplaint.source]}</span>
              </div>
              <div>
                <span className="text-gray-500">创建时间:</span>
                <span className="ml-2 text-gray-900">{formatTime(selectedComplaint.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500">当前处理:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {ROLE_LABELS[selectedComplaint.currentHandlerRole]} · {selectedComplaint.currentHandlerName}
                </span>
              </div>
              {selectedComplaint.relatedCoach && (
                <div>
                  <span className="text-gray-500">涉及教练:</span>
                  <span className="ml-2 text-gray-900 font-medium">{selectedComplaint.relatedCoach}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-6">处理时间线</h2>
            <Timeline logs={selectedComplaint.actionLogs} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">客户信息</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">客户姓名</span>
                <p className="font-medium text-gray-900">{selectedComplaint.customerName}</p>
              </div>
              <div>
                <span className="text-gray-500">联系电话</span>
                <p className="font-medium text-gray-900">{selectedComplaint.customerPhone}</p>
              </div>
            </div>
          </div>

          {selectedComplaint.compensations.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">补偿方案</h2>
              <div className="space-y-3">
                {selectedComplaint.compensations.map((comp) => (
                  <div key={comp.id} className="border border-gray-100 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{COMPENSATION_TYPE_LABELS[comp.type]}</span>
                      <span className={`status-badge ${
                        comp.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        comp.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {comp.status === 'approved' ? '已通过' : comp.status === 'rejected' ? '已驳回' : '待审批'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{comp.description}</p>
                    {comp.amount > 0 && (
                      <p className="text-sm font-medium text-navy-900">¥{comp.amount.toFixed(2)}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      由 {comp.proposedBy} 于 {formatTime(comp.proposedAt)} 提出
                    </p>
                    {comp.rejectReason && (
                      <div className="mt-2 p-2 bg-rose-50 rounded text-sm text-rose-600">
                        驳回原因: {comp.rejectReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {latestRejectLog && (status === 'review_rejected' || status === 'compensation_rejected') && (
              <div className="card p-4 bg-rose-50 border-rose-200">
                <h3 className="text-sm font-semibold text-rose-800 mb-2 flex items-center gap-2">
                  <X size={16} />
                  {latestRejectLog.actionType === 'review_reject' ? '初审驳回原因' : '补偿方案驳回原因'}
                </h3>
                <p className="text-sm text-rose-700">{latestRejectLog.rejectReason}</p>
                <p className="text-xs text-rose-500 mt-2">
                  由 {ROLE_LABELS[latestRejectLog.operatorRole]} · {latestRejectLog.operatorName} 于 {formatTime(latestRejectLog.timestamp)} 驳回
                </p>
              </div>
            )}

            {latestResubmitLog && (status === 'pending_review' || status === 'pending_compensation') && (
              <div className="card p-4 bg-amber-50 border-amber-200">
                <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <RefreshCw size={16} />
                  上次补录内容
                </h3>
                <p className="text-sm text-amber-700">{latestResubmitLog.supplementaryNote}</p>
                {latestResubmitLog.remark && (
                  <p className="text-xs text-amber-600 mt-1">备注: {latestResubmitLog.remark}</p>
                )}
                <p className="text-xs text-amber-500 mt-2">
                  由 {ROLE_LABELS[latestResubmitLog.operatorRole]} · {latestResubmitLog.operatorName} 于 {formatTime(latestResubmitLog.timestamp)} 提交
                </p>
              </div>
            )}

            <div className="card p-6">
              <h2 className="text-lg font-serif font-semibold text-gray-900 mb-4">操作</h2>
              <div className="space-y-3">
                {canSubmit && (
                  <>
                    <textarea
                      placeholder="备注（可选）..."
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                      rows={2}
                    />
                    <button onClick={handleSubmit} className="btn-primary w-full flex items-center justify-center gap-2">
                      <Send size={16} />
                      提交初审
                    </button>
                  </>
                )}

                {canReviewApprove && (
                  <>
                    <textarea
                      placeholder="审核意见（可选）..."
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                      rows={2}
                    />
                    <button onClick={handleReviewApprove} className="btn-primary w-full flex items-center justify-center gap-2">
                      <Check size={16} />
                      初审通过
                    </button>
                    <button onClick={() => { setRejectType('review'); setShowRejectModal(true); }} className="btn-danger w-full flex items-center justify-center gap-2">
                    <X size={16} />
                    初审驳回
                  </button>
                  </>
                )}

                {canResubmit && (
                  <button onClick={() => setShowResubmitModal(true)} className="btn-warning w-full flex items-center justify-center gap-2">
                    <RefreshCw size={16} />
                    补录重提
                  </button>
                )}

                {canProposeCompensation && (
                  <button onClick={() => setShowCompensationModal(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <Gift size={16} />
                    {status === 'compensation_rejected' ? '重新提出补偿方案' : '提出补偿方案'}
                  </button>
                )}

                {canApproveCompensation && (
                  <>
                    <textarea
                      placeholder="审批意见（可选）..."
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                      rows={2}
                    />
                    <button onClick={handleApproveCompensation} className="btn-primary w-full flex items-center justify-center gap-2">
                      <Award size={16} />
                      通过补偿方案
                    </button>
                    <button onClick={() => { setRejectType('compensation'); setShowRejectModal(true); }} className="btn-danger w-full flex items-center justify-center gap-2">
                    <X size={16} />
                    驳回补偿方案
                  </button>
                  </>
                )}

                {!canSubmit && !canReviewApprove && !canResubmit && !canProposeCompensation && !canApproveCompensation && (
                  <p className="text-sm text-gray-500 text-center py-4">当前状态暂无可操作项</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {rejectType === 'review' ? '初审驳回' : '驳回补偿方案'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">请填写驳回原因（必填）</p>
            <textarea
              placeholder="请详细说明驳回原因..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="btn-secondary flex-1">
                取消
              </button>
              <button
                onClick={rejectType === 'review' ? handleReviewReject : handleRejectCompensation}
                disabled={!rejectReason.trim()}
                className="btn-danger flex-1 disabled:opacity-50"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {showResubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">补录重提</h3>
            <p className="text-sm text-gray-500 mb-4">请填写补充备注（必填）</p>
            <textarea
              placeholder="请补充说明..."
              value={supplementaryNote}
              onChange={(e) => setSupplementaryNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mb-3"
              rows={3}
            />
            <textarea
              placeholder="其他备注（可选）..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
              rows={2}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowResubmitModal(false)} className="btn-secondary flex-1">
                取消
              </button>
              <button
                onClick={handleResubmit}
                disabled={!supplementaryNote.trim()}
                className="btn-warning flex-1 disabled:opacity-50"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompensationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {status === 'compensation_rejected' ? '重新提出补偿方案' : '提出补偿方案'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">补偿类型</label>
                <select
                  value={compensationType}
                  onChange={(e) => setCompensationType(e.target.value as CompensationType)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
                >
                  {Object.entries(COMPENSATION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金额（可选）</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={compensationAmount}
                  onChange={(e) => setCompensationAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">补偿说明</label>
                <textarea
                  placeholder="请详细描述补偿方案..."
                  value={compensationDesc}
                  onChange={(e) => setCompensationDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCompensationModal(false)} className="btn-secondary flex-1">
                取消
              </button>
              <button
                onClick={handleProposeCompensation}
                disabled={!compensationDesc.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                提交方案
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
