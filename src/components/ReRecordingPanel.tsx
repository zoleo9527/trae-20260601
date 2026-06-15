import { useState } from 'react';
import { Edit3, CheckCircle, XCircle, RotateCcw, History, User, Clock, FileText, AlertTriangle } from 'lucide-react';
import type { Machine, ApprovalRecord, BurnInTest } from '@/types';
import { statusLabels, statusColors, approvalStatusLabels, approvalStatusColors } from '@/utils/helpers';

interface ReRecordingPanelProps {
  machine: Machine;
  onCompleteReRecording: (machineId: string, operator: string, reRecordInfo: string) => void;
  onCompleteReview: (machineId: string, operator: string, reviewResult: 'approve' | 'reject', comments: string) => void;
}

export function ReRecordingPanel({ machine, onCompleteReRecording, onCompleteReview }: ReRecordingPanelProps) {
  const [operator, setOperator] = useState('');
  const [reRecordInfo, setReRecordInfo] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState<'re_record' | 'review_approve' | 'review_reject' | null>(null);

  const handleCompleteReRecording = () => {
    if (operator.trim() && reRecordInfo.trim()) {
      onCompleteReRecording(machine.id, operator.trim(), reRecordInfo.trim());
      setShowConfirmModal(null);
      setReRecordInfo('');
      setOperator('');
    }
  };

  const handleReview = (result: 'approve' | 'reject') => {
    if (operator.trim() && reviewComments.trim()) {
      onCompleteReview(machine.id, operator.trim(), result, reviewComments.trim());
      setShowConfirmModal(null);
      setReviewComments('');
      setOperator('');
    }
  };

  const renderTestSection = (test: BurnInTest, isHistory: boolean = false) => (
    <div className={`border ${isHistory ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-white'} rounded-xl p-4 mb-4`}>
      {isHistory && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200">
          <History className="h-4 w-4" />
          <span>历史测试记录 - 测试ID: {test.id}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-600">测试时间</span>
        <span className="font-medium">{test.startTime} - {test.endTime || '进行中'}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">测试结果</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          test.overallStatus === 'passed' ? 'bg-green-100 text-green-700' :
          test.overallStatus === 'failed' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {test.overallStatus === 'passed' ? '通过' : test.overallStatus === 'failed' ? '失败' : '进行中'}
        </span>
      </div>
      {test.remarks && (
        <p className="text-sm text-gray-600 mt-2">备注: {test.remarks}</p>
      )}
    </div>
  );

  const renderApprovalRecord = (approval: ApprovalRecord, isHistory: boolean = false) => (
    <div className={`rounded-lg p-3 ${
      approval.status === 'approved' ? 'bg-green-50' :
      approval.status === 'rejected' ? 'bg-red-50' :
      approval.status === 'reviewed' ? 'bg-indigo-50' : 'bg-yellow-50'
    }`}>
      {isHistory && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <History className="h-3 w-3" />
          <span>历史验收 - 验收ID: {approval.id}</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">验收状态</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${approvalStatusColors[approval.status]}`}>
          {approvalStatusLabels[approval.status]}
        </span>
      </div>
      {approval.approver && (
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">验收人</span>
          <span className="text-gray-700">{approval.approver}</span>
        </div>
      )}
      {approval.comments && (
        <p className="text-sm text-gray-600 mt-2">
          {approval.status === 'rejected' ? <strong>驳回原因:</strong> : <strong>验收意见:</strong>} {approval.comments}
        </p>
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">补录与复核 - {machine.orderNo}</h2>
          <p className="text-sm text-gray-500">客户: {machine.customerName} | 状态: <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[machine.status]}`}>{statusLabels[machine.status]}</span></p>
        </div>
      </div>

      {machine.status === 're_recording' && (
        <div className="bg-cyan-50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="h-5 w-5 text-cyan-600" />
            <h3 className="font-semibold text-gray-900">补录处理</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">此订单已被退回，需要补充或修正相关信息后提交复核。</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">操作人员</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="请输入操作人员姓名"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">补录内容</label>
              <textarea
                value={reRecordInfo}
                onChange={(e) => setReRecordInfo(e.target.value)}
                placeholder="请详细描述补录或修正的内容..."
                className="text-area h-32"
              />
            </div>
            <button
              onClick={() => setShowConfirmModal('re_record')}
              disabled={!operator.trim() || !reRecordInfo.trim()}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              完成补录
            </button>
          </div>
        </div>
      )}

      {machine.status === 'pending_review' && (
        <div className="bg-indigo-50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">复核处理</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">此订单已完成补录，等待复核确认。</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">复核人员</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="请输入复核人员姓名"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">复核意见</label>
              <textarea
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="请输入复核意见..."
                className="text-area h-24"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal('review_reject')}
                disabled={!operator.trim() || !reviewComments.trim()}
                className="btn btn-danger flex-1 flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                复核驳回
              </button>
              <button
                onClick={() => setShowConfirmModal('review_approve')}
                disabled={!operator.trim() || !reviewComments.trim()}
                className="btn btn-success flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                复核通过
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            历史测试记录
          </h3>
          {machine.burnInTestHistory.length > 0 ? (
            <div className="space-y-4">
              {[...machine.burnInTestHistory].reverse().map((test, index) => (
                <div key={test.id}>
                  <div className="text-xs text-gray-400 mb-2">第{machine.burnInTestHistory.length - index}次测试</div>
                  {renderTestSection(test, true)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">暂无历史测试记录</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            历史验收记录
          </h3>
          {machine.approvalHistory.length > 0 ? (
            <div className="space-y-3">
              {[...machine.approvalHistory].reverse().map((approval, index) => (
                <div key={approval.id}>
                  <div className="text-xs text-gray-400 mb-1">第{machine.approvalHistory.length - index}次验收</div>
                  {renderApprovalRecord(approval, true)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">暂无历史验收记录</p>
          )}
        </div>
      </div>

      {machine.operations.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            操作轨迹
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
            {[...machine.operations].reverse().map(op => (
              <div key={op.id} className="flex items-start gap-3 py-2 border-b border-gray-200 last:border-0">
                <div className="mt-0.5">
                  {op.type === 'return' && <RotateCcw className="h-4 w-4 text-yellow-500" />}
                  {op.type === 're_record' && <Edit3 className="h-4 w-4 text-cyan-500" />}
                  {op.type === 'review' && <CheckCircle className="h-4 w-4 text-indigo-500" />}
                  {op.type === 'start_test' && <Clock className="h-4 w-4 text-blue-500" />}
                  {op.type === 'complete_test' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {op.type === 'approve' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {op.type === 'reject' && <XCircle className="h-4 w-4 text-red-500" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">{op.description}</div>
                  <div className="text-xs text-gray-500">{op.operator} - {op.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showConfirmModal === 're_record' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认完成补录</h3>
            <p className="text-sm text-gray-600 mb-4">确定要完成此订单的补录操作吗？补录后订单将进入待复核状态。</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600"><strong>操作人员:</strong> {operator}</p>
              <p className="text-sm text-gray-600"><strong>补录内容:</strong> {reRecordInfo}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(null)} className="btn btn-secondary flex-1">取消</button>
              <button onClick={handleCompleteReRecording} className="btn btn-primary flex-1">确认补录</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal === 'review_approve' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认复核通过</h3>
            <p className="text-sm text-gray-600 mb-4">确定要通过此订单的复核吗？复核通过后订单将进入待测试状态。</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600"><strong>复核人员:</strong> {operator}</p>
              <p className="text-sm text-gray-600"><strong>复核意见:</strong> {reviewComments}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(null)} className="btn btn-secondary flex-1">取消</button>
              <button onClick={() => handleReview('approve')} className="btn btn-success flex-1">确认通过</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal === 'review_reject' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">确认复核驳回</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">确定要驳回此订单的复核吗？驳回后订单将返回补录状态，需要重新补录。</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600"><strong>复核人员:</strong> {operator}</p>
              <p className="text-sm text-gray-600"><strong>驳回原因:</strong> {reviewComments}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(null)} className="btn btn-secondary flex-1">取消</button>
              <button onClick={() => handleReview('reject')} className="btn btn-danger flex-1">确认驳回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}