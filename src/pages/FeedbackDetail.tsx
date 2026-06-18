import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { StatusTag } from '@/components/common/StatusTag';
import { FlowTimeline } from '@/components/common/FlowTimeline';
import { ActionButton } from '@/components/common/ActionButton';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  XCircle,
  Award,
  Star,
  MessageSquare,
  FileText,
  Send,
  Eye,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const FeedbackDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCertificatePanel, setShowCertificatePanel] = useState(false);

  const {
    feedbacks,
    getFeedbackById,
    getCertificatesByFeedbackId,
    updateFeedbackStatus,
    addFlowLog,
    currentUser,
    users,
    updateCertificateStatus,
    certificates,
  } = useStore();

  const feedback = getFeedbackById(id || '');
  const certs = getCertificatesByFeedbackId(id || '');

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">反馈记录不存在</p>
      </div>
    );
  }

  const currentIndex = feedbacks.findIndex((f) => f.id === feedback.id);
  const nextFeedback = feedbacks
    .filter((f) => f.status !== 'completed')
    .find((_, idx) => {
      const pendingIndices = feedbacks
        .map((f, i) => (f.status !== 'completed' ? i : -1))
        .filter((i) => i !== -1);
      const currentPendingIndex = pendingIndices.indexOf(currentIndex);
      return pendingIndices[currentPendingIndex + 1] === idx;
    });

  const prevFeedback = feedbacks
    .filter((f) => f.status !== 'completed')
    .find((_, idx) => {
      const pendingIndices = feedbacks
        .map((f, i) => (f.status !== 'completed' ? i : -1))
        .filter((i) => i !== -1);
      const currentPendingIndex = pendingIndices.indexOf(currentIndex);
      return pendingIndices[currentPendingIndex - 1] === idx;
    });

  const statusLabels = {
    pending_review: '待初核',
    organized: '已整理',
    pending_approval: '待终审',
    completed: '已完成',
  };

  const statusTypes = {
    pending_review: 'pending' as const,
    organized: 'in_progress' as const,
    pending_approval: 'in_progress' as const,
    completed: 'completed' as const,
  };

  const roleLabels = {
    teacher: '社教老师',
    volunteer: '志愿者',
    supervisor: '活动主管',
  };

  const flowStepLabels = {
    teacher: { title: '社教老师初核', description: '审核反馈内容完整性' },
    volunteer: { title: '志愿者整理', description: '整理反馈并标注重点' },
    supervisor: { title: '活动主管终审', description: '最终审核并确认发证' },
  };

  const currentStepInfo = flowStepLabels[feedback.currentStep];
  const nextStep = feedback.currentStep === 'teacher' ? 'volunteer' : feedback.currentStep === 'volunteer' ? 'supervisor' : null;
  const nextStepInfo = nextStep ? flowStepLabels[nextStep] : null;

  const handleAction = async (action: 'approve' | 'reject' | 'organize') => {
    setLoading(true);

    const now = new Date().toISOString();
    let newStatus = feedback.status;
    let nextStep = feedback.currentStep;
    let assigneeId = feedback.assigneeId;
    let assigneeName = feedback.assigneeName;

    if (action === 'approve' && feedback.currentStep === 'teacher') {
      newStatus = 'organized';
      nextStep = 'volunteer';
      const volunteer = users.find((u) => u.role === 'volunteer');
      if (volunteer) {
        assigneeId = volunteer.id;
        assigneeName = volunteer.name;
      }
    } else if (action === 'approve' && feedback.currentStep === 'volunteer') {
      newStatus = 'pending_approval';
      nextStep = 'supervisor';
      const supervisor = users.find((u) => u.role === 'supervisor');
      if (supervisor) {
        assigneeId = supervisor.id;
        assigneeName = supervisor.name;
      }
    } else if (action === 'approve' && feedback.currentStep === 'supervisor') {
      newStatus = 'completed';
      nextStep = 'supervisor';
    }

    if (action === 'reject') {
      newStatus = 'pending_review';
      nextStep = 'teacher';
      const teacher = users.find((u) => u.role === 'teacher');
      if (teacher) {
        assigneeId = teacher.id;
        assigneeName = teacher.name;
      }
    }

    updateFeedbackStatus(feedback.id, newStatus, nextStep, assigneeId, assigneeName);

    addFlowLog('feedback', feedback.id, {
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      action,
      remark: remark || (action === 'approve' ? '审核通过' : action === 'reject' ? '退回补充' : '整理完成'),
      timestamp: now,
    });

    setRemark('');
    setLoading(false);

    if (nextFeedback && newStatus === 'completed') {
      navigate(`/feedback/${nextFeedback.id}`);
    }
  };

  const handleIssueCertificate = (certId: string) => {
    const now = new Date().toLocaleString('zh-CN');
    updateCertificateStatus(certId, 'issued', now, currentUser.id);
    
    addFlowLog('certificate', certId, {
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      action: 'issue',
      remark: '证书已发放',
      timestamp: now,
    });
  };

  const handleNext = () => {
    if (nextFeedback) {
      navigate(`/feedback/${nextFeedback.id}`);
    }
  };

  const handlePrev = () => {
    if (prevFeedback) {
      navigate(`/feedback/${prevFeedback.id}`);
    }
  };

  const handleCompleteAndNext = () => {
    if (feedback.currentStep === currentUser.role && feedback.status !== 'completed') {
      handleAction('approve');
    } else if (nextFeedback) {
      navigate(`/feedback/${nextFeedback.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回工作台</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={!prevFeedback}
            className="px-4 py-2 border border-border rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">上一条</span>
          </button>
          <span className="text-sm text-text-muted px-2">
            {currentIndex + 1} / {feedbacks.length}
          </span>
          <button
            onClick={handleNext}
            disabled={!nextFeedback}
            className="px-4 py-2 border border-border rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm">下一条</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-border">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-text-main">
                    {feedback.activityName}
                  </h1>
                  {feedback.isOverdue && (
                    <span className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded-full font-medium">
                      已超时
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-muted">
                  提交时间：{format(new Date(feedback.submittedAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </p>
              </div>
              <StatusTag
                status={feedback.isOverdue ? 'overdue' : statusTypes[feedback.status]}
                label={feedback.isOverdue ? '超时' : statusLabels[feedback.status]}
              />
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {feedback.currentStep.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-main mb-1">{currentStepInfo.title}</h3>
                  <p className="text-sm text-text-muted">{currentStepInfo.description}</p>
                  {nextStepInfo && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                      <ArrowRight className="w-4 h-4" />
                      <span>下一环节：{nextStepInfo.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text-main">反馈概要</h3>
                </div>
                <p className="text-text-main bg-gray-50 rounded-lg p-4 leading-relaxed">
                  {feedback.content.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-5 h-5 text-warning" />
                    <span className="text-2xl font-bold text-text-main">{feedback.content.ratings}</span>
                  </div>
                  <p className="text-sm text-text-muted">满意度评分</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-text-main">{feedback.content.comments.length}</span>
                  </div>
                  <p className="text-sm text-text-muted">反馈意见</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-text-main">
                      {feedback.certificateEligible ? '是' : '否'}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">可发证</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-text-main">{certs.length}</span>
                  </div>
                  <p className="text-sm text-text-muted">关联证书</p>
                </div>
              </div>

              {feedback.content.comments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-text-main mb-3">学员反馈</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {feedback.content.comments.map((comment, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-4 text-sm text-text-main border-l-4 border-primary"
                      >
                        {comment}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div 
              className="px-6 py-4 border-b border-border cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
              onClick={() => setShowCertificatePanel(!showCertificatePanel)}
            >
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-text-main">关联证书</h3>
                <span className="text-sm text-text-muted">({certs.length}份)</span>
              </div>
              <ArrowDown className={`w-5 h-5 text-text-muted transition-transform ${showCertificatePanel ? 'rotate-180' : ''}`} />
            </div>

            {showCertificatePanel && (
              <div className="p-6">
                {certs.length === 0 ? (
                  <div className="text-center py-8 text-text-muted">
                    暂无关联证书
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certs.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Award className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-text-main">{cert.recipientName}</p>
                            <p className="text-sm text-text-muted">
                              {cert.activityName} | {cert.recipientPhone || '暂无联系方式'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusTag
                            status={cert.status === 'issued' ? 'completed' : cert.status === 'ready' ? 'in_progress' : 'pending'}
                            label={cert.status === 'issued' ? '已发放' : cert.status === 'ready' ? '待发放' : '待制作'}
                          />
                          {cert.status === 'ready' && (
                            <ActionButton
                              variant="success"
                              onClick={() => handleIssueCertificate(cert.id)}
                              icon={<CheckCircle className="w-4 h-4" />}
                              size="sm"
                            >
                              发放
                            </ActionButton>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-border">
            <h3 className="font-semibold text-text-main mb-4">当前处理人</h3>
            <div className="flex items-center gap-4 mb-6">
              <UserAvatar name={feedback.assigneeName} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text-main">{feedback.assigneeName}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    feedback.assigneeId === currentUser.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-text-muted'
                  }`}>
                    {feedback.assigneeId === currentUser.id ? '我' : roleLabels[feedback.currentStep]}
                  </span>
                </div>
                <p className="text-sm text-text-muted mt-1">
                  {roleLabels[feedback.currentStep]}环节
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-text-muted">是否可发证</span>
                </div>
                <span className={`font-medium ${
                  feedback.certificateEligible ? 'text-success' : 'text-danger'
                }`}>
                  {feedback.certificateEligible ? '✓ 可发证' : '✗ 暂不发证'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-text-muted">当前状态</span>
                </div>
                <span className="font-medium text-text-main">
                  {statusLabels[feedback.status]}
                </span>
              </div>
            </div>
          </div>

          {feedback.status !== 'completed' && (
            <div className="bg-white rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-text-main mb-4">处理操作</h3>
              <div className="space-y-4">
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="添加处理备注..."
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={4}
                />

                {feedback.currentStep === currentUser.role && (
                  <div className="space-y-3">
                    {feedback.currentStep !== 'supervisor' ? (
                      <ActionButton
                        variant="success"
                        onClick={() => handleAction('approve')}
                        icon={<Send className="w-4 h-4" />}
                        loading={loading}
                        className="w-full"
                      >
                        确认并流转
                      </ActionButton>
                    ) : (
                      <ActionButton
                        variant="success"
                        onClick={() => handleAction('approve')}
                        icon={<CheckCircle className="w-4 h-4" />}
                        loading={loading}
                        className="w-full"
                      >
                        完成审核
                      </ActionButton>
                    )}

                    <ActionButton
                      variant="danger"
                      onClick={() => handleAction('reject')}
                      icon={<XCircle className="w-4 h-4" />}
                      loading={loading}
                      className="w-full"
                    >
                      退回补充
                    </ActionButton>
                  </div>
                )}

                {feedback.currentStep !== currentUser.role && (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-text-muted">
                      当前环节由 <span className="font-medium text-text-main">{feedback.assigneeName}</span> 处理
                    </p>
                  </div>
                )}

                {nextFeedback && feedback.status === 'completed' && (
                  <ActionButton
                    variant="primary"
                    onClick={handleCompleteAndNext}
                    icon={<ChevronRight className="w-4 h-4" />}
                    className="w-full"
                  >
                    处理下一条
                  </ActionButton>
                )}
              </div>
            </div>
          )}

          {feedback.status === 'completed' && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">处理完成</h3>
                  <p className="text-sm text-green-600">反馈已审核通过</p>
                </div>
              </div>
              {nextFeedback && (
                <div className="mt-4">
                  <ActionButton
                    variant="primary"
                    onClick={handleNext}
                    icon={<ChevronRight className="w-4 h-4" />}
                    className="w-full"
                  >
                    处理下一条 ({nextFeedback.activityName})
                  </ActionButton>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl p-6 border border-border">
            <h3 className="font-semibold text-text-main mb-4">流转历史</h3>
            <div className="max-h-[400px] overflow-y-auto pr-2">
              <FlowTimeline logs={feedback.flowLogs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};