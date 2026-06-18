import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { StatusTag } from '@/components/common/StatusTag';
import { FlowTimeline } from '@/components/common/FlowTimeline';
import { ActionButton } from '@/components/common/ActionButton';
import {
  ArrowLeft,
  Award,
  Download,
  Printer,
  CheckCircle,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const CertificateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issueMethod, setIssueMethod] = useState<'onsite' | 'mail'>('onsite');
  const [loading, setLoading] = useState(false);

  const {
    getCertificateById,
    getFeedbackById,
    updateCertificateStatus,
    addFlowLog,
    currentUser,
  } = useStore();

  const certificate = getCertificateById(id || '');
  const feedback = certificate ? getFeedbackById(certificate.feedbackId) : null;

  if (!certificate) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">证书记录不存在</p>
      </div>
    );
  }

  const statusLabels = {
    pending: '待制作',
    ready: '待发放',
    issued: '已发放',
    archived: '已归档',
  };

  const statusTypes = {
    pending: 'pending' as const,
    ready: 'in_progress' as const,
    issued: 'completed' as const,
    archived: 'completed' as const,
  };

  const handleIssue = async () => {
    setLoading(true);

    const now = new Date().toISOString();

    updateCertificateStatus(
      certificate.id,
      'issued',
      now,
      currentUser.id
    );

    addFlowLog('certificate', certificate.id, {
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      action: 'issue',
      remark: `通过${issueMethod === 'onsite' ? '现场领取' : '邮寄'}方式发放`,
      timestamp: now,
    });

    setLoading(false);
  };

  const handlePrepare = async () => {
    setLoading(true);

    const now = new Date().toISOString();

    updateCertificateStatus(certificate.id, 'ready');

    addFlowLog('certificate', certificate.id, {
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      action: 'organize',
      remark: '准备发放，确认发放方式',
      timestamp: now,
    });

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/certificate')}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-border">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-text-main mb-2">
                  证书详情
                </h1>
                <p className="text-sm text-text-muted">
                  证书ID：{certificate.id}
                </p>
              </div>
              <StatusTag
                status={statusTypes[certificate.status]}
                label={statusLabels[certificate.status]}
              />
            </div>

            <div className="border-2 border-primary rounded-xl p-8 bg-gradient-to-br from-blue-50 to-white">
              <div className="text-center space-y-4">
                <Award className="w-16 h-16 text-primary mx-auto" />
                <h2 className="text-3xl font-bold text-primary">
                  结业证书
                </h2>
                <p className="text-text-muted">
                  兹证明 <span className="font-bold text-text-main text-xl">{certificate.recipientName}</span> 同志
                </p>
                <p className="text-text-main">
                  已完成 <span className="font-semibold">{certificate.activityName}</span> 培训课程
                </p>
                <p className="text-sm text-text-muted mt-4">
                  特发此证，以资证明
                </p>
                <div className="pt-8">
                  <p className="text-sm text-text-muted">
                    发证日期：{format(new Date(), 'yyyy年MM月dd日', { locale: zhCN })}
                  </p>
                  <p className="text-sm text-text-muted">
                    发证单位：博物馆社会教育部
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <ActionButton
                variant="secondary"
                icon={<Printer className="w-4 h-4" />}
              >
                打印证书
              </ActionButton>
              <ActionButton
                variant="secondary"
                icon={<Download className="w-4 h-4" />}
              >
                下载证书
              </ActionButton>
            </div>
          </div>

          {feedback && (
            <div className="bg-white rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-text-main mb-4">关联反馈</h3>
              <div
                className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => navigate(`/feedback/${feedback.id}`)}
              >
                <p className="font-medium text-text-main mb-2">
                  {feedback.activityName}
                </p>
                <p className="text-sm text-text-muted">
                  评分：{feedback.content.ratings} | 反馈：{feedback.content.comments.length}条
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-border">
            <h3 className="font-semibold text-text-main mb-4">证书信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">学员姓名</span>
                <span className="font-medium text-text-main">
                  {certificate.recipientName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">联系电话</span>
                <span className="font-medium text-text-main">
                  {certificate.recipientPhone || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">活动名称</span>
                <span className="font-medium text-text-main text-right max-w-[200px]">
                  {certificate.activityName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">当前状态</span>
                <span className="font-medium text-text-main">
                  {statusLabels[certificate.status]}
                </span>
              </div>
              {certificate.issuedAt && (
                <div className="flex justify-between">
                  <span className="text-text-muted">发放时间</span>
                  <span className="font-medium text-text-main">
                    {format(new Date(certificate.issuedAt), 'MM/dd HH:mm', { locale: zhCN })}
                  </span>
                </div>
              )}
              {certificate.issueMethod && (
                <div className="flex justify-between">
                  <span className="text-text-muted">发放方式</span>
                  <span className="font-medium text-text-main">
                    {certificate.issueMethod === 'onsite' ? '现场领取' : '邮寄'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {certificate.status !== 'issued' && (
            <div className="bg-white rounded-xl p-6 border border-border">
              <h3 className="font-semibold text-text-main mb-4">发放操作</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-text-muted mb-2 block">
                    发放方式
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIssueMethod('onsite')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        issueMethod === 'onsite'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-text-main hover:bg-gray-200'
                      }`}
                    >
                      现场领取
                    </button>
                    <button
                      onClick={() => setIssueMethod('mail')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        issueMethod === 'mail'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-text-main hover:bg-gray-200'
                      }`}
                    >
                      邮寄
                    </button>
                  </div>
                </div>

                {certificate.status === 'pending' && (
                  <ActionButton
                    variant="primary"
                    onClick={handlePrepare}
                    icon={<Package className="w-4 h-4" />}
                    loading={loading}
                    className="w-full"
                  >
                    准备发放
                  </ActionButton>
                )}

                {certificate.status === 'ready' && (
                  <ActionButton
                    variant="success"
                    onClick={handleIssue}
                    icon={<CheckCircle className="w-4 h-4" />}
                    loading={loading}
                    className="w-full"
                  >
                    确认发放
                  </ActionButton>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 border border-border">
            <h3 className="font-semibold text-text-main mb-4">流转历史</h3>
            <FlowTimeline logs={certificate.flowLogs} />
          </div>
        </div>
      </div>
    </div>
  );
};
