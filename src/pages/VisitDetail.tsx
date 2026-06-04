import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Phone, Clock, FileText, Check, X, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { StatusTimeline } from '../components/StatusTimeline';
import { AlertBanner } from '../components/AlertBanner';
import { formatDate, formatDateTime } from '../utils/date';
import { hasPermission } from '../utils/permissions';

export function VisitDetail() {
  const { id } = useParams<{ id: string }>();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  const {
    currentUser,
    visitAppointments,
    elders,
    familyMembers,
    users,
    approveVisit,
    rejectVisit,
    checkInVisit,
    checkOutVisit,
    updateVisitStatus,
    canViewVisit,
  } = useStore();

  const visit = visitAppointments.find(v => v.id === id);
  const elder = elders.find(e => e.id === visit?.elderId);
  const family = familyMembers.find(f => f.id === visit?.familyMemberId);
  const approvedByUser = users.find(u => u.id === visit?.approvedBy);

  if (!visit || !elder) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">预约记录不存在</h2>
        <Link to="/visits" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          返回列表
        </Link>
      </div>
    );
  }

  if (currentUser && !canViewVisit(visit.id)) {
    return (
      <div className="text-center py-12">
        <AlertBanner type="danger" title="无权查看" message="您没有权限查看此预约记录" />
        <Link to="/visits" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          返回列表
        </Link>
      </div>
    );
  }

  const canApprove = currentUser && hasPermission(currentUser.role, 'canApproveVisit');
  const canCheckIn = currentUser && (currentUser.role === 'nurse_manager' || currentUser.role === 'primary_nurse');
  const canResolveStuck = currentUser && currentUser.role === 'nurse_manager';
  const isStuck = visit.status === 'stuck';

  const handleApprove = async () => {
    const result = await approveVisit(visit.id);
    if (result.success) {
      setActionNotes('');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    const result = await rejectVisit(visit.id, rejectReason);
    if (result.success) {
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const handleCheckIn = async () => {
    await checkInVisit(visit.id);
  };

  const handleCheckOut = async () => {
    await checkOutVisit(visit.id);
  };

  const handleResolveStuck = async () => {
    if (!actionNotes.trim()) return;
    await updateVisitStatus(visit.id, 'completed', actionNotes || '异常已处理');
    setActionNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/visits" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">探视预约详情</h1>
          <p className="text-gray-500">申请编号：{visit.requestId}</p>
        </div>
      </div>

      {isStuck && (
        <AlertBanner
          type="danger"
          title="⚠️ 此记录状态异常"
          message={visit.notes || '该探视预约处于卡住状态，需要人工介入处理。'}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
              <StatusBadge status={visit.status} type="visit" />
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">老人姓名</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <User className="h-4 w-4 text-gray-400" />
                    {elder.name} ({elder.age}岁 / {elder.gender === 'male' ? '男' : '女'})
                  </div>
                </div>
                <div>
                  <label className="label">床位</label>
                  <div className="text-gray-900">{visit.elderId}</div>
                </div>
                <div>
                  <label className="label">访客姓名</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <User className="h-4 w-4 text-gray-400" />
                    {visit.visitorName}
                    {family && <span className="text-gray-500">({family.relationship})</span>}
                  </div>
                </div>
                <div>
                  <label className="label">联系电话</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {visit.visitorPhone}
                  </div>
                </div>
                <div>
                  <label className="label">探视日期</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(visit.requestedDate)}
                  </div>
                </div>
                <div>
                  <label className="label">探视时段</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {visit.requestedTimeSlot}
                  </div>
                </div>
                <div>
                  <label className="label">探视人数</label>
                  <div className="text-gray-900">{visit.numberOfVisitors}人</div>
                </div>
                <div>
                  <label className="label">探视类型</label>
                  <div className="text-gray-900">
                    {visit.visitType === 'emergency' ? '紧急探视' : 
                     visit.visitType === 'special' ? '特殊探视' : '常规探视'}
                  </div>
                </div>
              </div>

              {visit.purpose && (
                <div>
                  <label className="label">探视目的</label>
                  <div className="text-gray-900">{visit.purpose}</div>
                </div>
              )}

              {visit.rejectedReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="label text-red-700">拒绝原因</label>
                  <div className="text-red-800">{visit.rejectedReason}</div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                状态变更历史
              </h2>
            </div>
            <div className="card-body">
              <StatusTimeline history={visit.statusHistory} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">操作</h2>
            </div>
            <div className="card-body space-y-3">
              {visit.status === 'pending_approval' && canApprove && (
                <>
                  <button onClick={handleApprove} className="btn btn-success w-full flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    批准预约
                  </button>
                  <button onClick={() => setShowRejectModal(true)} className="btn btn-danger w-full flex items-center justify-center gap-2">
                    <X className="h-4 w-4" />
                    拒绝预约
                  </button>
                </>
              )}

              {visit.status === 'approved' && canCheckIn && (
                <button onClick={handleCheckIn} className="btn btn-primary w-full">
                  访客签到
                </button>
              )}

              {visit.status === 'checked_in' && canCheckIn && (
                <button onClick={handleCheckOut} className="btn btn-success w-full">
                  访客签出
                </button>
              )}

              {isStuck && canResolveStuck && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-700 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      异常处理
                    </div>
                    <p className="text-sm text-red-600 mt-1">请输入处理说明后点击下方按钮</p>
                  </div>
                  <textarea
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                    placeholder="请输入处理说明..."
                    className="input min-h-[80px]"
                  />
                  <button 
                    onClick={handleResolveStuck} 
                    className="btn btn-warning w-full flex items-center justify-center gap-2"
                    disabled={!actionNotes.trim()}
                  >
                    <Check className="h-4 w-4" />
                    标记为已处理
                  </button>
                </div>
              )}

              {(visit.status === 'pending_approval' || visit.status === 'approved') && (
                <button className="btn btn-secondary w-full">
                  取消预约
                </button>
              )}

              <Link to={`/elders/${elder.id}`} className="btn btn-secondary w-full block text-center">
                查看老人档案
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">审批信息</h2>
            </div>
            <div className="card-body space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">提交时间</span>
                <span className="text-gray-900">{formatDateTime(visit.createdAt)}</span>
              </div>
              {visit.approvedAt && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">审批时间</span>
                    <span className="text-gray-900">{formatDateTime(visit.approvedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">审批人</span>
                    <span className="text-gray-900">{approvedByUser?.name || '-'}</span>
                  </div>
                </>
              )}
              {visit.checkInAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">签到时间</span>
                  <span className="text-gray-900">{formatDateTime(visit.checkInAt)}</span>
                </div>
              )}
              {visit.checkOutAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">签出时间</span>
                  <span className="text-gray-900">{formatDateTime(visit.checkOutAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">拒绝预约</h3>
            <div className="mb-4">
              <label className="label">拒绝原因</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                className="input min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="btn btn-danger"
                disabled={!rejectReason.trim()}
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
