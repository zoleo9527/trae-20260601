import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  MessageCircle,
  History,
  FileText
} from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import { useAppStore, roleLabels } from '../lib/store';
import { formatDate } from '../lib/utils';

interface RegistrationDetail {
  id: string;
  projectId: string;
  projectName: string;
  bidderId: string;
  bidderName: string;
  status: string;
  currentHandlerId?: string;
  currentHandlerRole?: string;
  createdAt: string;
  updatedAt: string;
  currentHandler?: {
    id: string;
    name: string;
    role: string;
  };
  clarifications?: Array<{
    id: string;
    question: string;
    answer?: string;
    status: string;
    createdBy?: { name: string };
    reviewedBy?: { name: string };
    versions?: Array<{
      version: number;
      question: string;
      answer?: string;
      changedBy?: { name: string };
      changedAt: string;
    }>;
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
  rejectionReasons?: Array<{
    reason: string;
    supplementaryNote?: string;
    rejectedBy?: { name: string };
  }>;
}

export default function RegistrationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, currentUser } = useAppStore();
  const [registration, setRegistration] = useState<RegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    fetchRegistration();
  }, [id]);

  const fetchRegistration = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/registrations/${id}`);
      const data = await response.json();
      if (data.success) {
        setRegistration(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!registration) return;
    
    const note = prompt('请输入备注（可选）:');
    
    try {
      const response = await fetch(`/api/registrations/${registration.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentRole === 'finance' ? 'completed' : 'approved',
          handlerId: currentUser?.id,
          handlerName: currentUser?.name,
          handlerRole: currentRole,
          note: note || ''
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchRegistration();
        alert('操作成功');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    if (!registration || !rejectReason) return;
    
    try {
      const response = await fetch(`/api/registrations/${registration.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          handlerId: currentUser?.id,
          handlerName: currentUser?.name,
          handlerRole: currentRole,
          note: rejectNote || '',
          rejectionReason: rejectReason,
          supplementaryNote: rejectNote
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowRejectModal(false);
        setRejectReason('');
        setRejectNote('');
        fetchRegistration();
        alert('操作成功');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
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

  if (!registration) {
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
            onClick={() => navigate('/registrations')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            返回列表
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
                <StatusBadge status={registration.status} type="registration" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">项目名称</label>
                  <p className="text-sm text-gray-900">{registration.projectName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">投标人</label>
                  <p className="text-sm text-gray-900">{registration.bidderName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">项目编号</label>
                  <p className="text-sm text-gray-900">{registration.projectId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">投标人编号</label>
                  <p className="text-sm text-gray-900">{registration.bidderId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">创建时间</label>
                  <p className="text-sm text-gray-900">{formatDate(registration.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">更新时间</label>
                  <p className="text-sm text-gray-900">{formatDate(registration.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">状态流转时间线</h3>
              </div>
              
              {registration.operationLogs && registration.operationLogs.length > 0 ? (
                <Timeline items={registration.operationLogs} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无操作记录
                </div>
              )}
            </div>

            {registration.rejectionReasons && registration.rejectionReasons.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">退回原因</h3>
                </div>
                
                <div className="space-y-4">
                  {registration.rejectionReasons.map((rej, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-red-900">{rej.reason}</span>
                        {rej.rejectedBy && (
                          <span className="text-sm text-red-600">
                            ({rej.rejectedBy.name})
                          </span>
                        )}
                      </div>
                      {rej.supplementaryNote && (
                        <p className="text-sm text-red-700">{rej.supplementaryNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">关联答疑澄清</h3>
              </div>
              
              {registration.clarifications && registration.clarifications.length > 0 ? (
                <div className="space-y-4">
                  {registration.clarifications.map((clar) => (
                    <div
                      key={clar.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 cursor-pointer"
                      onClick={() => navigate(`/clarifications/${clar.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <StatusBadge status={clar.status} type="clarification" />
                      </div>
                      <p className="text-sm text-gray-900 mb-2">{clar.question}</p>
                      {clar.answer && (
                        <p className="text-sm text-gray-600">{clar.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无关联澄清
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">操作</h3>
              
              <div className="space-y-3">
                {registration.status === 'pending' && currentRole === 'project_specialist' && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      通过初审
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      退回
                    </button>
                  </>
                )}
                
                {registration.status === 'approved' && currentRole === 'finance' && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      确认完成
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                      退回
                    </button>
                  </>
                )}
                
                {registration.status === 'reviewing' && currentRole === 'review_secretary' && (
                  <>
                    <button
                      onClick={handleApprove}
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
                      退回
                    </button>
                  </>
                )}
                
                {(registration.status === 'completed' || registration.status === 'rejected') && (
                  <div className="text-center py-4 text-gray-500">
                    该记录已处理完成
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退回报名</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  退回原因 *
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入退回原因"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  补充备注
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请输入补充备注（可选）"
                />
              </div>
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
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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