import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Users
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
    getFeedbackById,
    getCertificatesByFeedbackId,
    updateFeedbackStatus,
    addFlowLog,
    createCertificates,
    currentUser,
    users,
    updateCertificateStatus,
    getNextTask,
    getPrevTask,
    getTasksByCurrentUser,
    getCurrentTaskIndex,
  } = useStore();

  const feedback = getFeedbackById(id || '');
  const certs = getCertificatesByFeedbackId(id || '');

  const myPendingTasks = getTasksByCurrentUser();
  const isMyTask = feedback && feedback.assigneeId === currentUser.id;
  const currentIndex = feedback ? getCurrentTaskIndex(feedback.id) : -1;
  const nextFeedback = feedback ? getNextTask(feedback.id) : undefined;
  const prevFeedback = feedback ? getPrevTask(feedback.id) : undefined;

  useEffect(() => {
    if (feedback && feedback.status === 'completed' && certs.length === 0 && feedback.certificateEligible) {
      setShowCertificatePanel(true);
    }
  }, [feedback, certs.length]);

  if (!feedback) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">反馈记录不存在</p>
      </div>
    );
  }

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

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(true);

    const now = new Date().toISOString();
    let newStatus = feedback.status;
    let nextStep = feedback.currentStep;
    let assigneeId = feedback.assigneeId;
    let assigneeName = feedback.assigneeName;
    let actionRemark = '';

    if (action === 'approve') {
      if (feedback.currentStep === 'teacher') {
        newStatus = 'organized';
        nextStep = 'volunteer';
        const volunteer = users.find((u) => u.role === 'volunteer');
        if (volunteer) {
          assigneeId = volunteer.id;
          assigneeName = volunteer.name;
        }
        actionRemark = '初核通过，流转至志愿者整理';
      } else if (feedback.currentStep === 'volunteer') {
        newStatus = 'pending_approval';
        nextStep = 'supervisor';
        const supervisor = users.find((u) => u.role === 'supervisor');
        if (supervisor) {
          assigneeId = supervisor.id;
          assigneeName = supervisor.name;
        }
        actionRemark = '整理完成，流转至主管终审';
      } else if (feedback.currentStep === 'supervisor') {
        newStatus = 'completed';
        nextStep = 'supervisor';
        actionRemark = '终审通过';
        
        if (feedback.certificateEligible && certs.length === 0) {
          const recipientNames = feedback.content.comments.map((_, i) => `学员${i + 1}`);
          createCertificates(feedback.id, feedback.activityId, feedback.activityName, recipientNames.slice(0, 3));
          actionRemark = '终审通过，已自动生成证书草稿';
        }
      }
    } else if (action === 'reject') {
      if (feedback.currentStep === 'volunteer') {
        newStatus = 'pending_review';
        nextStep = 'teacher';
        const teacher = users.find((u) => u.role === 'teacher');
        if (teacher) {
          assigneeId = teacher.id;
          assigneeName = teacher.name;
        }
        actionRemark = '退回社教老师补充';
      } else if (feedback.currentStep === 'supervisor') {
        newStatus = 'organized';
        nextStep = 'volunteer';
        const volunteer = users.find((u) => u.role === 'volunteer');
        if (volunteer) {
          assigneeId = volunteer.id;
          assigneeName = volunteer.name;
        }
        actionRemark = '退回志愿者补充材料';
      } else {
        actionRemark = '退回修改';
      }
    }

    updateFeedbackStatus(feedback.id, newStatus, nextStep, assigneeId, assigneeName);

    addFlowLog('feedback', feedback.id, {
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      action,
      remark: remark || actionRemark,
      timestamp: now,
    });

    setRemark('');
    setLoading(false);

    if (newStatus === 'completed') {
      if (nextFeedback) {
        setTimeout(() => navigate(`/feedback/${nextFeedback.id}`), 500);
      } else {
        setTimeout(() => navigate('/'), 500);
      }
    } else if (action === 'approve' && nextFeedback) {
      setTimeout(() => navigate(`/feedback/${nextFeedback.id}`), 500);
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

  const canHandle = feedback.currentStep === currentUser.role && feedback.status !== 'completed';

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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <Users className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">
              {isMyTask ? `${currentIndex + 1} / ${myPendingTasks.length}` : '非本人任务'}
            </span>
          </div>
          <button
            onClick={handlePrev}
            disabled={!prevFeedback}
            className="px-4 py-2 border border-border rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">上一条</span>
          </button>
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
                {feedback.status === 'completed' && feedback.certificateEligible && certs.length === 0 && (
                  <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">
                    可生成证书
                  </span>
                )}
              </div>
              <ArrowDown className={`w-5 h-5 text-text-muted transition-transform ${showCertificatePanel ? 'rotate-180' : ''}`} />
            </div>

            {showCertificatePanel && (
              <div className="p-6">
                {certs.length === 0 ? (
                  feedback.status === 'completed' && feedback.certificateEligible ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-success" />
                      </div>
                      <p className="text-text-main font-medium">审核通过，可生成证书</p>
                      <p className="text-sm text-text-muted mt-2">证书已自动生成，等待发放</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      暂无关联证书
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {certs.map((cert) => (
                      <div
                        key={cert.id}
                        className="bg-gray-50 rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-4">
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
                        {cert.flowLogs && cert.flowLogs.length > 0 && (
                          <div className="px-4 pb-4 pt-2 border-t border-border">
                            <div className="text-xs text-text-muted mb-2">流转历史</div>
                            <div className="space-y-2">
                              {cert.flowLogs.map((log) => (
                                <div key={log.id} className="flex items-center gap-2 text-xs">
                                  <span className="text-text-muted">{log.operatorName}</span>
                                  <span className={log.action === 'create' ? 'text-purple-600' : log.action === 'issue' ? 'text-green-600' : 'text-gray-600'}>
                                    {log.action === 'create' ? '创建' : log.action === 'issue' ? '发放' : log.action}
                                  </span>
                                  <span className="text-text-muted">-</span>
                                  <span className="text-text-muted">{log.timestamp}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

                {canHandle ? (
                  <div className="space-y-3">
                    <ActionButton
                      variant="success"
                      onClick={() => handleAction('approve')}
                      icon={feedback.currentStep === 'supervisor' ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      loading={loading}
                      className="w-full"
                    >
                      {feedback.currentStep === 'supervisor' ? '完成审核' : '确认并流转'}
                    </ActionButton>

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
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-text-muted">
                      当前环节由 <span className="font-medium text-text-main">{feedback.assigneeName}</span> 处理
                    </p>
                  </div>
                )}

                {nextFeedback && !canHandle && (
                  <ActionButton
                    variant="primary"
                    onClick={handleNext}
                    icon={<ChevronRight className="w-4 h-4" />}
                    className="w-full"
                  >
                    跳转到下一条
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