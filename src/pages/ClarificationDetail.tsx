import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, History, FileText, Send, Edit3 } from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import { useAppStore, roleLabels, clarificationStatusLabels } from '../lib/store';
import { formatDate } from '../lib/utils';

interface ClarificationDetail {
  id: string;
  registrationId: string;
  question: string;
  answer?: string;
  status: string;
  createdById: string;
  reviewedById?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  registration?: {
    id: string;
    projectName: string;
    bidderName: string;
  };
  createdBy?: {
    name: string;
    role: string;
  };
  reviewedBy?: {
    name: string;
    role: string;
  };
  versions?: Array<{
    id: string;
    version: number;
    question: string;
    answer?: string;
    changedBy?: { name: string; role: string };
    changeNote?: string;
    changedAt: string;
  }>;
  operationLogs?: Array<{
    id: string;
    operationType: string;
    operatorName: string;
    operatorRole: string;
    previousStatus?: string;
    newStatus?: string;
    note?: string;
    createdAt: string;
  }>;
}

interface VersionDiff {
  question: { old: string; new: string; changed: boolean };
  answer: { old: string; new: string; changed: boolean };
}

export default function ClarificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentUser } = useAppStore();
  const [clarification, setClarification] = useState<ClarificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchClarification();
  }, [id]);

  const fetchClarification = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clarifications/${id}`);
      const data = await response.json();
      if (data.success) {
        setClarification(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch clarification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = (version: number) => {
    if (!clarification || !clarification.versions) return;
    
    const selected = clarification.versions.find(v => v.version === version);
    if (selected) {
      setSelectedVersion(version);
      setVersionDiff({
        question: {
          old: selected.question,
          new: clarification.question,
          changed: selected.question !== clarification.question
        },
        answer: {
          old: selected.answer || '',
          new: clarification.answer || '',
          changed: (selected.answer || '') !== (clarification.answer || '')
        }
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!clarification) return;
    
    try {
      const response = await fetch(`/api/clarifications/${clarification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'pending_review',
          operatorId: currentUser?.id,
          operatorName: currentUser?.name,
          operatorRole: currentRole,
          note: note || '提交审核'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowSubmitModal(false);
        setNote('');
        fetchClarification();
        alert('提交成功');
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  const handleApprove = async () => {
    if (!clarification) return;
    
    try {
      const response = await fetch(`/api/clarifications/${clarification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          operatorId: currentUser?.id,
          operatorName: currentUser?.name,
          operatorRole: currentRole,
          note: note || '审核通过'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowApproveModal(false);
        setNote('');
        fetchClarification();
        alert('审核通过');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    if (!clarification) return;
    
    try {
      const response = await fetch(`/api/clarifications/${clarification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          operatorId: currentUser?.id,
          operatorName: currentUser?.name,
          operatorRole: currentRole,
          note: note || '审核退回'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowRejectModal(false);
        setNote('');
        fetchClarification();
        alert('已退回');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handlePublish = async () => {
    if (!clarification) return;
    
    try {
      const response = await fetch(`/api/clarifications/${clarification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          operatorId: currentUser?.id,
          operatorName: currentUser?.name,
          operatorRole: currentRole,
          note: '发布澄清'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchClarification();
        alert('发布成功');
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!clarification) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">记录不存在</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clarifications')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            返回列表
          </button>
          <button
            onClick={() => navigate(`/registrations/${clarification.registrationId}`)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <FileText className="w-5 h-5" />
            查看报名详情
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">答疑澄清详情</h3>
                  <span className="text-sm text-gray-500">v{clarification.version}</span>
                </div>
                <StatusBadge status={clarification.status} type="clarification" />
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">项目名称</label>
                  <p className="text-sm text-gray-900">{clarification.registration?.projectName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">投标人</label>
                  <p className="text-sm text-gray-900">{clarification.registration?.bidderName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">创建人</label>
                  <p className="text-sm text-gray-900">
                    {clarification.createdBy?.name} ({roleLabels[clarification.createdBy?.role as any] || clarification.createdBy?.role})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">审核人</label>
                  <p className="text-sm text-gray-900">
                    {clarification.reviewedBy?.name || '-'}
                    {clarification.reviewedBy && ` (${roleLabels[clarification.reviewedBy.role as any] || clarification.reviewedBy.role})`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">创建时间</label>
                  <p className="text-sm text-gray-900">{formatDate(clarification.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">更新时间</label>
                  <p className="text-sm text-gray-900">{formatDate(clarification.updatedAt)}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">问题内容</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{clarification.question}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">澄清回复</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{clarification.answer || '暂无回复'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">操作记录</h3>
                </div>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  {showHistory ? '隐藏历史版本' : '查看历史版本'}
                </button>
              </div>
              
              {showHistory && clarification.versions && clarification.versions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">版本历史</h4>
                  <div className="space-y-2">
                    {clarification.versions.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleSelectVersion(v.version)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedVersion === v.version
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">v{v.version}</span>
                            <span className="text-sm text-gray-500">{formatDate(v.changedAt)}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {v.changedBy?.name || '-'}
                          </span>
                        </div>
                        {v.changeNote && (
                          <p className="text-sm text-gray-600 mt-1">{v.changeNote}</p>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {versionDiff && selectedVersion && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-4">
                        版本对比 (v{selectedVersion} vs 当前版本)
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">问题内容</label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">v{selectedVersion}</p>
                              <p className={`text-sm ${versionDiff.question.changed ? 'text-red-600' : 'text-gray-700'}`}>
                                {versionDiff.question.old}
                              </p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">当前版本</p>
                              <p className={`text-sm ${versionDiff.question.changed ? 'text-green-600' : 'text-gray-700'}`}>
                                {versionDiff.question.new}
                              </p>
                            </div>
                          </div>
                          {versionDiff.question.changed && (
                            <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                              已修改
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-2">澄清回复</label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">v{selectedVersion}</p>
                              <p className={`text-sm ${versionDiff.answer.changed ? 'text-red-600' : 'text-gray-700'}`}>
                                {versionDiff.answer.old || '-'}
                              </p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">当前版本</p>
                              <p className={`text-sm ${versionDiff.answer.changed ? 'text-green-600' : 'text-gray-700'}`}>
                                {versionDiff.answer.new || '-'}
                              </p>
                            </div>
                          </div>
                          {versionDiff.answer.changed && (
                            <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                              已修改
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {clarification.operationLogs && clarification.operationLogs.length > 0 ? (
                <Timeline items={clarification.operationLogs} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无操作记录
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">操作</h3>
              
              <div className="space-y-3">
                {clarification.status === 'draft' && currentRole === 'project_specialist' && (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    提交审核
                  </button>
                )}
                
                {clarification.status === 'pending_review' && currentRole === 'review_secretary' && (
                  <>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      通过审核
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      退回修改
                    </button>
                  </>
                )}
                
                {clarification.status === 'approved' && currentRole === 'review_secretary' && (
                  <button
                    onClick={handlePublish}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    发布澄清
                  </button>
                )}
                
                {(clarification.status === 'published' || clarification.status === 'rejected') && (
                  <div className="text-center py-4 text-gray-500">
                    {clarification.status === 'published' ? '已发布' : '已退回'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">提交审核</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="请输入备注"
              />
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">通过审核</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="请输入备注"
              />
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退回修改</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">退回原因</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="请输入退回原因"
              />
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}