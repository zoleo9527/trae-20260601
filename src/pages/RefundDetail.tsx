import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { Timeline } from '@/components/Timeline';
import { ArrowLeft, Calendar, Phone, User, AlertTriangle, Check, X, RotateCcw, MessageSquare, Send, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function RefundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actions, currentUser } = useStore();
  const { getRefundById, getVisitsByRefundId, approveRefund, rejectRefund, returnRefund, markRefundAnomaly, addRefundRemark, submitRefundForReview } = actions;
  
  const refund = id ? getRefundById(id) : undefined;
  const relatedVisits = id ? getVisitsByRefundId(id) : [];
  
  const [showActionModal, setShowActionModal] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [remarkText, setRemarkText] = useState('');

  if (!refund) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">未找到该退费申请记录</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/refunds')}>
          返回列表
        </button>
      </div>
    );
  }

  const handleAction = (action: string) => {
    if (action === 'submit') {
      submitRefundForReview(refund.id, actionReason);
    } else if (action === 'approve') {
      approveRefund(refund.id, actionReason);
    } else if (action === 'reject') {
      rejectRefund(refund.id, actionReason);
    } else if (action === 'return') {
      returnRefund(refund.id, actionReason);
    } else if (action === 'anomaly') {
      markRefundAnomaly(refund.id, actionReason);
    }
    setShowActionModal(null);
    setActionReason('');
  };

  const handleAddRemark = () => {
    if (remarkText.trim()) {
      addRefundRemark(refund.id, remarkText);
      setRemarkText('');
    }
  };

  // 权限判断
  const canSubmit = refund.status === '待审核' && currentUser.role === '食堂管理员';
  const canApprove = refund.status === '审核中' && currentUser.role === '年级主任';
  const canReject = ['待审核', '审核中'].includes(refund.status) && (currentUser.role === '年级主任' || currentUser.role === '校长');
  const canReturn = refund.status === '审核中' && currentUser.role === '年级主任';
  const canMarkAnomaly = !['已通过', '已拒绝', '已退回'].includes(refund.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button className="btn-secondary" onClick={() => navigate('/refunds')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">退费申请详情</h1>
          <p className="text-sm text-gray-500">申请编号：{refund.id}</p>
        </div>
      </div>

      {refund.hasAnomaly && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">异常提醒</h3>
              <p className="text-sm text-red-700 mt-1">{refund.anomalyReason}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">学生信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">学生姓名</div>
                  <div className="text-sm font-medium text-gray-900">{refund.studentName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">所在班级</div>
                  <div className="text-sm font-medium text-gray-900">{refund.className}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">家长姓名</div>
                  <div className="text-sm font-medium text-gray-900">{refund.parentName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">联系电话</div>
                  <div className="text-sm font-medium text-gray-900">{refund.parentPhone}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">退费信息</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-500">退费金额</span>
                <span className="text-2xl font-bold text-primary-600">¥{refund.refundAmount}</span>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">退费原因</div>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{refund.refundReason}</p>
              </div>
              {refund.mealDates.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">未用餐日期（共 {refund.mealDates.length} 天）</div>
                  <div className="flex flex-wrap gap-2">
                    {refund.mealDates.map((date) => (
                      <span key={date} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {date}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">处理时间线</h2>
              <StatusBadge status={refund.status} type="refund" />
            </div>
            <Timeline events={refund.timeline} />
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">添加备注</h2>
            <div className="space-y-3">
              <textarea
                className="input h-24 resize-none"
                placeholder="输入备注内容..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  className="btn-primary"
                  onClick={handleAddRemark}
                  disabled={!remarkText.trim()}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  添加备注
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">责任人</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">当前处理人</div>
                <UserAvatar user={refund.currentHandler} size="md" showName showRole />
              </div>
              {refund.historyHandlers.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">历史处理人</div>
                  <div className="flex flex-wrap gap-2">
                    {refund.historyHandlers.map((handler, index) => (
                      <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                        <UserAvatar user={handler} size="sm" />
                        <span className="text-gray-700">{handler.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">申请时间</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">创建时间</span>
                <span className="text-sm text-gray-900">
                  {format(new Date(refund.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">更新时间</span>
                <span className="text-sm text-gray-900">
                  {format(new Date(refund.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </span>
              </div>
            </div>
          </div>

          {relatedVisits.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">关联家长回访</h2>
              <div className="space-y-3">
                {relatedVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => navigate(`/visits/${visit.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{visit.id}</span>
                      <StatusBadge status={visit.status} type="visit" />
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{visit.visitContent}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">处理操作</h2>
            <div className="space-y-3">
              {canSubmit && (
                <button
                  className="btn-primary w-full"
                  onClick={() => setShowActionModal('submit')}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  提交审核
                </button>
              )}
              {canApprove && (
                <button
                  className="btn-primary w-full"
                  onClick={() => setShowActionModal('approve')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  审核通过
                </button>
              )}
              {canReject && (
                <button
                  className="btn-danger w-full"
                  onClick={() => setShowActionModal('reject')}
                >
                  <X className="w-4 h-4 mr-2" />
                  拒绝申请
                </button>
              )}
              {canReturn && (
                <button
                  className="btn-warning w-full"
                  onClick={() => setShowActionModal('return')}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  退回申请
                </button>
              )}
              {canMarkAnomaly && (
                <button
                  className="btn-secondary w-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowActionModal('anomaly')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  标记异常
                </button>
              )}
              {!canSubmit && !canApprove && !canReject && !canReturn && !canMarkAnomaly && (
                <p className="text-sm text-gray-500 text-center py-4">当前状态无可用操作</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showActionModal === 'submit' && '确认提交审核？'}
              {showActionModal === 'approve' && '确认审核通过？'}
              {showActionModal === 'reject' && '确认拒绝申请？'}
              {showActionModal === 'return' && '确认退回申请？'}
              {showActionModal === 'anomaly' && '标记为异常'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {showActionModal === 'approve' || showActionModal === 'submit' ? '备注（可选）' : '原因'}
              </label>
              <textarea
                className="input h-24 resize-none"
                placeholder={
                  showActionModal === 'submit'
                    ? '请输入备注...'
                    : showActionModal === 'approve'
                    ? '请输入备注...'
                    : showActionModal === 'reject'
                    ? '请输入拒绝原因...'
                    : showActionModal === 'return'
                    ? '请输入退回原因...'
                    : '请输入异常原因...'
                }
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowActionModal(null);
                  setActionReason('');
                }}
              >
                取消
              </button>
              <button
                className={
                  showActionModal === 'approve' || showActionModal === 'submit'
                    ? 'btn-primary'
                    : showActionModal === 'anomaly'
                    ? 'btn-warning'
                    : 'btn-danger'
                }
                onClick={() => handleAction(showActionModal)}
                disabled={
                  showActionModal !== 'approve' && showActionModal !== 'submit' && !actionReason.trim()
                }
              >
                <Send className="w-4 h-4 mr-2" />
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
