import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { StatusBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { Timeline } from '@/components/Timeline';
import { ArrowLeft, Calendar, Phone, User, AlertCircle, Check, MessageSquare, Send, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { VisitStatus } from '@/types';

export function VisitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actions, currentUser } = useStore();
  const { getVisitById, getRefundById, updateVisitStatus, addVisitRemark } = actions;
  
  const visit = id ? getVisitById(id) : undefined;
  const relatedRefund = visit ? getRefundById(visit.refundId) : undefined;
  
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<VisitStatus>('已完成');
  const [visitResult, setVisitResult] = useState('');
  const [dissatisfaction, setDissatisfaction] = useState('');
  const [needFollowUp, setNeedFollowUp] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [remarkText, setRemarkText] = useState('');

  if (!visit) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">未找到该回访记录</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/visits')}>
          返回列表
        </button>
      </div>
    );
  }

  const handleUpdateStatus = () => {
    updateVisitStatus(visit.id, selectedStatus, visitResult, dissatisfaction, needFollowUp, followUpNote);
    setStatusModalOpen(false);
    setVisitResult('');
    setDissatisfaction('');
    setNeedFollowUp(false);
    setFollowUpNote('');
  };

  const handleAddRemark = () => {
    if (remarkText.trim()) {
      addVisitRemark(visit.id, remarkText);
      setRemarkText('');
    }
  };

  const canUpdateStatus = ['待回访', '回访中', '需再次回访'].includes(visit.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button className="btn-secondary" onClick={() => navigate('/visits')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家长回访详情</h1>
          <p className="text-sm text-gray-500">回访编号：{visit.id}</p>
        </div>
      </div>

      {visit.needFollowUp && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">需跟进提醒</h3>
              <p className="text-sm text-orange-700 mt-1">{visit.followUpNote}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">家长与学生信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">学生姓名</div>
                  <div className="text-sm font-medium text-gray-900">{visit.studentName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">所在班级</div>
                  <div className="text-sm font-medium text-gray-900">{visit.className}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">家长姓名</div>
                  <div className="text-sm font-medium text-gray-900">{visit.parentName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">联系电话</div>
                  <div className="text-sm font-medium text-gray-900">{visit.parentPhone}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">回访内容</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">回访主题</div>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{visit.visitContent}</p>
              </div>
              {visit.visitResult && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">回访结果</div>
                  <p className="text-sm text-gray-900 bg-green-50 rounded-lg p-3">{visit.visitResult}</p>
                </div>
              )}
              {visit.dissatisfaction && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">家长不满点</div>
                  <p className="text-sm text-gray-900 bg-red-50 rounded-lg p-3">{visit.dissatisfaction}</p>
                </div>
              )}
            </div>
          </div>

          {relatedRefund && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">关联退费申请（一站式查看）</h2>
                <button
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  onClick={() => navigate(`/refunds/${relatedRefund.id}`)}
                >
                  查看完整详情
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">退费编号</span>
                  <span className="text-sm font-mono text-gray-900">{relatedRefund.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">退费金额</span>
                  <span className="text-lg font-bold text-primary-600">¥{relatedRefund.refundAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">退费状态</span>
                  <StatusBadge status={relatedRefund.status} type="refund" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">退费原因</span>
                  <span className="text-sm text-gray-900 text-right max-w-[60%]">{relatedRefund.refundReason}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">当前责任人</span>
                  <UserAvatar user={relatedRefund.currentHandler} size="sm" showName />
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">回访时间线</h2>
              <StatusBadge status={visit.status} type="visit" />
            </div>
            <Timeline events={visit.timeline} />
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">回访信息</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">回访人</div>
                <UserAvatar user={visit.operator} size="md" showName showRole />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">创建时间</span>
                <span className="text-sm text-gray-900">
                  {format(new Date(visit.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </span>
              </div>
              {visit.visitTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">回访时间</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(visit.visitTime), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">回访操作</h2>
            <div className="space-y-3">
              {canUpdateStatus && (
                <button
                  className="btn-primary w-full"
                  onClick={() => setStatusModalOpen(true)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  更新回访状态
                </button>
              )}
              {!canUpdateStatus && (
                <p className="text-sm text-gray-500 text-center py-4">当前状态无可用操作</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {statusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">更新回访状态</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">回访状态</label>
                <select
                  className="select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as VisitStatus)}
                >
                  <option value="回访中">回访中</option>
                  <option value="已完成">已完成</option>
                  <option value="需再次回访">需再次回访</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">回访结果</label>
                <textarea
                  className="input h-24 resize-none"
                  placeholder="请输入回访结果..."
                  value={visitResult}
                  onChange={(e) => setVisitResult(e.target.value)}
                />
              </div>
              {selectedStatus === '需再次回访' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">家长不满点（如有）</label>
                    <textarea
                      className="input h-20 resize-none"
                      placeholder="请描述家长不满的地方..."
                      value={dissatisfaction}
                      onChange={(e) => setDissatisfaction(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="needFollowUp"
                      checked={needFollowUp}
                      onChange={(e) => setNeedFollowUp(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="needFollowUp" className="text-sm text-gray-700">标记为需要跟进</label>
                  </div>
                  {needFollowUp && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">跟进说明</label>
                      <textarea
                        className="input h-20 resize-none"
                        placeholder="请输入跟进说明..."
                        value={followUpNote}
                        onChange={(e) => setFollowUpNote(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="btn-secondary"
                onClick={() => {
                  setStatusModalOpen(false);
                  setVisitResult('');
                  setDissatisfaction('');
                  setNeedFollowUp(false);
                  setFollowUpNote('');
                }}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleUpdateStatus}
                disabled={!visitResult.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                确认更新
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
