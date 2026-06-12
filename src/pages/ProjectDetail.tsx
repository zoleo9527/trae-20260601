import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Wallet, CheckCircle, XCircle, Clock, User, AlertTriangle, Upload, ArrowRight, History, Info } from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import Layout from '../components/layout/Layout';
import { statusNames, noticeStatusNames, refundStatusNames, mockUsers } from '../data/mockData';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    currentProject, 
    fetchProjectById, 
    submitNotice, 
    approveNotice, 
    rejectNotice, 
    applyRefund, 
    approveRefund, 
    rejectRefund, 
    processPayment,
    currentUser,
    loading 
  } = useProjectStore();
  
  const [activeTab, setActiveTab] = useState<'info' | 'notice' | 'refund'>('info');
  const [showRejectModal, setShowRejectModal] = useState<'notice' | 'refund' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectById(id);
    }
  }, [id, fetchProjectById]);

  const handleSubmitNotice = async () => {
    if (currentProject?.id) {
      await submitNotice(currentProject.id, { file_url: '/notices/test.pdf' });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleApproveNotice = async () => {
    if (currentProject?.id) {
      await approveNotice(currentProject.id);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleRejectNotice = async () => {
    if (currentProject?.id && rejectReason) {
      await rejectNotice(currentProject.id, rejectReason);
      setRejectReason('');
      setShowRejectModal(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleApplyRefund = async () => {
    if (currentProject?.id) {
      await applyRefund(currentProject.id, { amount: currentProject.deposit_amount });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleApproveRefund = async () => {
    if (currentProject?.id) {
      await approveRefund(currentProject.id);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleRejectRefund = async () => {
    if (currentProject?.id && rejectReason) {
      await rejectRefund(currentProject.id, rejectReason);
      setRejectReason('');
      setShowRejectModal(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleProcessPayment = async () => {
    if (currentProject?.id) {
      await processPayment(currentProject.id);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const canSubmitNotice = currentProject?.status === 'draft';
  const canReviewNotice = currentProject?.status === 'notice_pending' && currentUser?.role === 'review_secretary';
  const canResubmitNotice = currentProject?.status === 'notice_rejected';
  const canApplyRefund = ['notice_approved', 'refund_rejected'].includes(currentProject?.status || '');
  const canReviewRefund = currentProject?.status === 'refund_pending' && currentUser?.role === 'finance';
  const canProcessPayment = currentProject?.status === 'refund_approved' && currentUser?.role === 'finance';

  const getStatusColor = (status: string) => {
    if (status.includes('pending')) return 'bg-amber-100 text-amber-600';
    if (status.includes('rejected')) return 'bg-red-100 text-red-600';
    if (status.includes('approved')) return 'bg-blue-100 text-blue-600';
    if (status === 'paid') return 'bg-green-100 text-green-600';
    return 'bg-slate-100 text-slate-600';
  };

  const getRoleAction = () => {
    if (!currentProject || !currentUser) return null;
    
    if (currentProject.status === 'notice_pending' && currentUser.role === 'review_secretary') {
      return { title: '待审核中标通知', assignee: '评审秘书', action: '审核中标通知' };
    }
    if (currentProject.status === 'notice_rejected' && currentUser.role === 'project_manager') {
      return { title: '中标通知已驳回', assignee: '项目专员', action: '补录中标通知信息' };
    }
    if (currentProject.status === 'refund_pending' && currentUser.role === 'finance') {
      return { title: '待审核退款申请', assignee: '财务', action: '审核退款申请' };
    }
    if (currentProject.status === 'refund_rejected' && currentUser.role === 'project_manager') {
      return { title: '退款申请已驳回', assignee: '项目专员', action: '补充退款申请材料' };
    }
    return null;
  };

  const roleAction = getRoleAction();

  if (loading) {
    return (
      <Layout title="项目详情">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!currentProject) {
    return (
      <Layout title="项目详情">
        <div className="flex items-center justify-center h-64 text-slate-500">
          项目不存在
        </div>
      </Layout>
    );
  }

  const sortedActivities = [...(currentProject.activities || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Layout title={currentProject.name} subtitle={`项目编号：${currentProject.code}`}>
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          操作成功
        </div>
      )}

      {roleAction && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">{roleAction.title}</p>
              <p className="text-sm text-amber-600">当前处理人：{roleAction.assignee} | 待执行：{roleAction.action}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  项目信息
                </button>
                <button
                  onClick={() => setActiveTab('notice')}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'notice' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  中标通知
                </button>
                <button
                  onClick={() => setActiveTab('refund')}
                  className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'refund' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  保证金退还
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">项目状态</p>
                      <p className={`mt-1 font-semibold ${
                        currentProject.status.includes('pending') ? 'text-amber-600' :
                        currentProject.status.includes('rejected') ? 'text-red-600' :
                        currentProject.status.includes('approved') ? 'text-blue-600' :
                        currentProject.status === 'paid' ? 'text-green-600' : 'text-slate-600'
                      }`}>
                        {statusNames[currentProject.status]}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">保证金金额</p>
                      <p className="mt-1 font-semibold text-slate-800">¥{currentProject.deposit_amount.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">创建人</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {currentProject.created_by_user?.name || mockUsers.find(u => u.id === currentProject.created_by)?.name}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">创建时间</p>
                      <p className="mt-1 font-semibold text-slate-800">
                        {new Date(currentProject.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <History className="w-5 h-5" />
                      操作历史
                    </h4>
                    <div className="space-y-3">
                      {sortedActivities.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">暂无操作记录</p>
                      ) : (
                        sortedActivities.map(activity => (
                          <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-800">{activity.description}</p>
                              <p className="text-sm text-slate-500">
                                {mockUsers.find(u => u.id === activity.performed_by)?.name} | {new Date(activity.created_at).toLocaleString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notice' && (
                <div className="space-y-6">
                  {currentProject.notice ? (
                    <>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            currentProject.notice.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                            currentProject.notice.status === 'approved' ? 'bg-green-100 text-green-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {noticeStatusNames[currentProject.notice.status]}
                          </span>
                          {currentProject.notice.submitted_at && (
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(currentProject.notice.submitted_at).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>

                        {currentProject.notice.status === 'rejected' && currentProject.notice.reject_reason && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-red-800">驳回理由</span>
                            </div>
                            <p className="text-red-700">{currentProject.notice.reject_reason}</p>
                          </div>
                        )}

                        {currentProject.notice.processed_by && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm text-slate-500">审核人：{mockUsers.find(u => u.id === currentProject.notice?.processed_by)?.name}</p>
                            {currentProject.notice.processed_at && (
                              <p className="text-sm text-slate-500">审核时间：{new Date(currentProject.notice.processed_at).toLocaleString('zh-CN')}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {canResubmitNotice && (
                          <button
                            onClick={handleSubmitNotice}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Upload className="w-5 h-5" />
                            重新提交中标通知
                          </button>
                        )}
                        {canReviewNotice && (
                          <>
                            <button
                              onClick={() => setShowRejectModal('notice')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                              驳回
                            </button>
                            <button
                              onClick={handleApproveNotice}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" />
                              审核通过
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-8 text-center bg-slate-50 rounded-lg">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600">尚未提交中标通知</p>
                      </div>

                      {canSubmitNotice && (
                        <button
                          onClick={handleSubmitNotice}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Upload className="w-5 h-5" />
                          提交中标通知
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'refund' && (
                <div className="space-y-6">
                  {currentProject.refund ? (
                    <>
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            currentProject.refund.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                            currentProject.refund.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                            currentProject.refund.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {refundStatusNames[currentProject.refund.status]}
                          </span>
                          {currentProject.refund.applied_at && (
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(currentProject.refund.applied_at).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-500">退款金额</p>
                            <p className="text-xl font-bold text-slate-800">¥{currentProject.refund.amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">申请时间</p>
                            <p className="font-medium text-slate-800">
                              {currentProject.refund.applied_at ? new Date(currentProject.refund.applied_at).toLocaleString('zh-CN') : '-'}
                            </p>
                          </div>
                        </div>

                        {currentProject.refund.status === 'rejected' && currentProject.refund.reject_reason && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-red-800">驳回理由</span>
                            </div>
                            <p className="text-red-700">{currentProject.refund.reject_reason}</p>
                          </div>
                        )}

                        {currentProject.refund.processed_by && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm text-slate-500">审核人：{mockUsers.find(u => u.id === currentProject.refund?.processed_by)?.name}</p>
                            {currentProject.refund.processed_at && (
                              <p className="text-sm text-slate-500">审核时间：{new Date(currentProject.refund.processed_at).toLocaleString('zh-CN')}</p>
                            )}
                          </div>
                        )}

                        {currentProject.refund.paid_at && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm text-slate-500">打款时间：{new Date(currentProject.refund.paid_at).toLocaleString('zh-CN')}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {canApplyRefund && (
                          <button
                            onClick={handleApplyRefund}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Wallet className="w-5 h-5" />
                            发起退款申请
                          </button>
                        )}
                        {canReviewRefund && (
                          <>
                            <button
                              onClick={() => setShowRejectModal('refund')}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                              驳回
                            </button>
                            <button
                              onClick={handleApproveRefund}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-5 h-5" />
                              审核通过
                            </button>
                          </>
                        )}
                        {canProcessPayment && (
                          <button
                            onClick={handleProcessPayment}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-5 h-5" />
                            执行打款
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-8 text-center bg-slate-50 rounded-lg">
                        <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600">尚未发起退款申请</p>
                        <p className="text-sm text-slate-500 mt-2">请先提交中标通知并通过审核</p>
                      </div>

                      {canApplyRefund && (
                        <button
                          onClick={handleApplyRefund}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Wallet className="w-5 h-5" />
                          发起退款申请
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4">流程进度</h4>
            <div className="relative">
              <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-slate-200"></div>
              
              <div className="space-y-6">
                <div className="relative flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    currentProject.status !== 'draft' ? 'bg-blue-600 text-white' : 'bg-slate-300'
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">项目创建</p>
                    <p className="text-sm text-slate-500">{new Date(currentProject.created_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    ['notice_pending', 'notice_rejected', 'notice_approved', 'refund_pending', 'refund_rejected', 'refund_approved', 'paid'].includes(currentProject.status)
                      ? currentProject.notice?.status === 'approved' ? 'bg-green-600' : currentProject.notice?.status === 'rejected' ? 'bg-red-600' : 'bg-blue-600'
                      : 'bg-slate-300'
                  } text-white`}>
                    {currentProject.notice?.status === 'approved' ? <CheckCircle className="w-4 h-4" /> :
                     currentProject.notice?.status === 'rejected' ? <XCircle className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">中标通知</p>
                    <p className="text-sm text-slate-500">
                      {currentProject.notice?.status === 'approved' ? '已通过' :
                       currentProject.notice?.status === 'rejected' ? '已驳回' :
                       currentProject.notice?.status === 'pending' ? '待审核' : '未提交'}
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    ['refund_pending', 'refund_rejected', 'refund_approved', 'paid'].includes(currentProject.status)
                      ? currentProject.refund?.status === 'approved' || currentProject.refund?.status === 'paid' ? 'bg-green-600' : 
                        currentProject.refund?.status === 'rejected' ? 'bg-red-600' : 'bg-blue-600'
                      : 'bg-slate-300'
                  } text-white`}>
                    {currentProject.refund?.status === 'approved' || currentProject.refund?.status === 'paid' ? <CheckCircle className="w-4 h-4" /> :
                     currentProject.refund?.status === 'rejected' ? <XCircle className="w-4 h-4" /> :
                     <Wallet className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">退款申请</p>
                    <p className="text-sm text-slate-500">
                      {currentProject.refund?.status === 'approved' ? '已通过' :
                       currentProject.refund?.status === 'paid' ? '已打款' :
                       currentProject.refund?.status === 'rejected' ? '已驳回' :
                       currentProject.refund?.status === 'pending' ? '待审核' : '未申请'}
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    currentProject.status === 'paid' ? 'bg-green-600' : 'bg-slate-300'
                  } text-white`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">完成打款</p>
                    <p className="text-sm text-slate-500">
                      {currentProject.status === 'paid' ? new Date(currentProject.refund?.paid_at || '').toLocaleDateString('zh-CN') : '未完成'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h4 className="font-semibold text-slate-800 mb-4">当前处理</h4>
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">当前环节</span>
              </div>
              <p className="text-amber-700">
                {currentProject.status === 'draft' && '项目已创建，等待提交中标通知'}
                {currentProject.status === 'notice_pending' && '中标通知待审核（评审秘书）'}
                {currentProject.status === 'notice_rejected' && '中标通知已驳回，请根据驳回理由修改后重新提交'}
                {currentProject.status === 'notice_approved' && '中标通知已通过，可以发起退款申请'}
                {currentProject.status === 'refund_pending' && '退款申请待审核（财务）'}
                {currentProject.status === 'refund_rejected' && '退款申请已驳回，请根据驳回理由补充材料'}
                {currentProject.status === 'refund_approved' && '退款申请已通过，等待财务打款'}
                {currentProject.status === 'paid' && '已完成打款，项目结束'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {showRejectModal === 'notice' ? '驳回中标通知' : '驳回退款申请'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">请填写驳回理由</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="请输入驳回理由..."
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={showRejectModal === 'notice' ? handleRejectNotice : handleRejectRefund}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
