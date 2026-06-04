import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import Timeline from '../components/Timeline';
import StatusFlow from '../components/StatusFlow';
import {
  FILLING_STATUS_LABELS, FILLING_STATUS_COLORS, ROLE_LABELS,
  PACKAGING_STATUS_LABELS, PACKAGING_STATUS_COLORS
} from '../types';
import type { FillingSchedule, FillingStatus, Role } from '../types';

export default function FillingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, triggerRefresh } = useContext(AppContext);
  const [schedule, setSchedule] = useState<FillingSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState<string | null>(null);
  const [actionRemark, setActionRemark] = useState('');
  const [editForm, setEditForm] = useState<any>({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetch(`/api/filling-schedules/${id}`)
      .then(r => r.json())
      .then(data => {
        setSchedule(data);
        setEditForm({
          productName: data.productName,
          beerType: data.beerType,
          volume: data.volume,
          fillingDate: new Date(data.fillingDate).toISOString().split('T')[0],
          targetBottles: data.targetBottles
        });
        setLoading(false);
      });
  }, [id, triggerRefresh]);

  if (loading || !schedule) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const canHandle = schedule.currentHandler === currentUser?.role;

  const getFlowSteps = () => {
    const statuses: FillingStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED'];
    const currentIdx = statuses.indexOf(schedule.status === 'REJECTED' ? 'SUBMITTED' : schedule.status);
    return statuses.map((s, i) => ({
      key: s,
      label: FILLING_STATUS_LABELS[s],
      active: i === currentIdx,
      done: i < currentIdx || (schedule.status === 'COMPLETED' && i <= currentIdx)
    }));
  };

  const handleAction = async (action: string) => {
    const endpoints: Record<string, string> = {
      submit: 'submit',
      approve: 'approve',
      reject: 'reject',
      resubmit: 'resubmit',
      start: 'start-production',
      complete: 'complete',
      comment: 'add-comment'
    };

    if (action === 'reject' && !actionRemark.trim()) {
      alert('驳回原因不能为空');
      return;
    }

    let body: any = { userId: currentUser!.id, remark: actionRemark };
    if (action === 'resubmit') {
      body = { ...body, ...editForm };
    }
    if (action === 'comment') {
      body.remark = comment;
    }

    const res = await fetch(`/api/filling-schedules/${schedule.id}/${endpoints[action]}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || '操作失败');
      return;
    }

    setShowActionModal(null);
    setActionRemark('');
    setComment('');
    triggerRefresh();
  };

  const getPrimaryAction = () => {
    if (!canHandle) return null;

    const actions: Partial<Record<FillingStatus, { key: string; label: string; variant: string }>> = {
      DRAFT: { key: 'submit', label: '提交审核', variant: 'primary' },
      SUBMITTED: [
        { key: 'approve', label: '复核通过', variant: 'primary' },
        { key: 'reject', label: '驳回', variant: 'danger' }
      ] as any,
      APPROVED: { key: 'start', label: '开始生产', variant: 'primary' },
      IN_PRODUCTION: { key: 'complete', label: '灌装完成', variant: 'primary' },
      REJECTED: { key: 'resubmit', label: '补录后重提', variant: 'primary' }
    };

    return actions[schedule.status];
  };

  const primaryAction = getPrimaryAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/filling')} className="text-gray-500 hover:text-gray-700">
            ← 返回列表
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{schedule.batchNo}</h1>
          <span className={`status-badge ${FILLING_STATUS_COLORS[schedule.status]}`}>
            {FILLING_STATUS_LABELS[schedule.status]}
          </span>
          {schedule.status === 'REJECTED' && (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              ⚠️ 已被驳回，请修改后重提
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">当前处理：</span>
          <span className={`px-2 py-1 rounded text-sm ${
            schedule.currentHandler === currentUser?.role
              ? 'bg-beer-100 text-beer-700 font-medium'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {ROLE_LABELS[schedule.currentHandler]}
          </span>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-4">处理流程</h3>
        <StatusFlow steps={getFlowSteps()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            {schedule.status === 'REJECTED' && canHandle ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-800 mb-1">驳回原因</div>
                  <div className="text-sm text-red-700">
                    {schedule.history.find(h => h.action === '驳回')?.remark || '暂无原因'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                    <input
                      type="text"
                      value={editForm.productName}
                      onChange={e => setEditForm({ ...editForm, productName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">啤酒类型</label>
                    <input
                      type="text"
                      value={editForm.beerType}
                      onChange={e => setEditForm({ ...editForm, beerType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">酒液量 (L)</label>
                    <input
                      type="number"
                      value={editForm.volume}
                      onChange={e => setEditForm({ ...editForm, volume: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">目标瓶数</label>
                    <input
                      type="number"
                      value={editForm.targetBottles}
                      onChange={e => setEditForm({ ...editForm, targetBottles: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">灌装日期</label>
                    <input
                      type="date"
                      value={editForm.fillingDate}
                      onChange={e => setEditForm({ ...editForm, fillingDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm text-gray-500">产品名称</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">{schedule.productName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">啤酒类型</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">{schedule.beerType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">酒液量</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">{schedule.volume} L</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">目标瓶数</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">{schedule.targetBottles} 瓶</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">计划灌装日期</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">
                    {new Date(schedule.fillingDate).toLocaleDateString('zh-CN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">创建人</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">
                    {schedule.createdBy.avatar} {schedule.createdBy.name}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">关联包装领用</h2>
            {schedule.packagingRequisitions.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                暂无关联的包装领用
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.packagingRequisitions.map(req => (
                  <div
                    key={req.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-beer-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <button
                          onClick={() => navigate(`/packaging/${req.id}`)}
                          className="font-medium text-gray-900 hover:text-beer-600"
                        >
                          {req.requisitionNo}
                        </button>
                        <div className="text-sm text-gray-500 mt-1">
                          {req.bottleType} · {req.bottleCount}个 · {req.labelType}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`status-badge ${PACKAGING_STATUS_COLORS[req.status]}`}>
                          {PACKAGING_STATUS_LABELS[req.status]}
                        </span>
                        {req.history?.some(h => h.scheduleChangeNotified) && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            ⚠️ 已收到排产变更提醒
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">处理历史</h2>
            <Timeline history={schedule.history} />
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">添加备注</h2>
            <div className="flex space-x-3">
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="输入备注内容..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
              />
              <button
                onClick={() => handleAction('comment')}
                disabled={!comment.trim()}
                className="btn-secondary disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">操作</h2>
            {!canHandle ? (
              <div className="text-sm text-gray-500 py-2">
                当前由 <span className="font-medium text-gray-700">{ROLE_LABELS[schedule.currentHandler]}</span> 处理
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(primaryAction) ? (
                  <>
                    <button
                      onClick={() => setShowActionModal('approve')}
                      className="w-full btn-primary"
                    >
                      ✓ {primaryAction[0].label}
                    </button>
                    <button
                      onClick={() => setShowActionModal('reject')}
                      className="w-full btn-danger"
                    >
                      ✕ {primaryAction[1].label}
                    </button>
                  </>
                ) : primaryAction ? (
                  <button
                    onClick={() => setShowActionModal(primaryAction.key)}
                    className={`w-full ${
                      primaryAction.variant === 'danger' ? 'btn-danger' : 'btn-primary'
                    }`}
                  >
                    {primaryAction.label}
                  </button>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-4 bg-beer-50 rounded-lg border border-beer-100">
            <h3 className="font-medium text-beer-800 mb-2">💡 操作提示</h3>
            <ul className="text-sm text-beer-700 space-y-1">
              {schedule.status === 'DRAFT' && (
                <li>• 确认信息无误后提交给销售内勤复核</li>
              )}
              {schedule.status === 'SUBMITTED' && currentUser?.role === 'SALES_BACKOFFICE' && (
                <>
                  <li>• 核对酒液量与目标瓶数是否匹配</li>
                  <li>• 确认包装材料库存是否充足</li>
                  <li>• 有问题请驳回并注明原因</li>
                </>
              )}
              {schedule.status === 'APPROVED' && (
                <li>• 复核通过后，酿酒师可开始灌装生产</li>
              )}
              {schedule.status === 'REJECTED' && (
                <>
                  <li>• 请查看驳回原因并修改相关字段</li>
                  <li>• 修改后点击"补录后重提"再次提交</li>
                  <li>• 系统会自动记录变更内容</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showActionModal === 'approve' && '确认复核通过'}
              {showActionModal === 'reject' && '确认驳回'}
              {showActionModal === 'submit' && '确认提交审核'}
              {showActionModal === 'resubmit' && '确认补录后重提'}
              {showActionModal === 'start' && '确认开始生产'}
              {showActionModal === 'complete' && '确认灌装完成'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {showActionModal === 'reject' ? '驳回原因 *' : '备注（可选）'}
              </label>
              <textarea
                value={actionRemark}
                onChange={e => setActionRemark(e.target.value)}
                rows={3}
                placeholder={showActionModal === 'reject' ? '请详细说明驳回原因...' : '输入备注...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                required={showActionModal === 'reject'}
              />
            </div>
            {showActionModal === 'reject' && (
              <p className="text-sm text-red-600 mb-4">
                ⚠️ 驳回后将退回给酿酒师修改，请务必注明原因
              </p>
            )}
            {showActionModal === 'resubmit' && (
              <p className="text-sm text-blue-600 mb-4">
                📝 系统将自动记录您修改的字段，以便追溯
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowActionModal(null)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => handleAction(showActionModal)}
                className={showActionModal === 'reject' ? 'btn-danger' : 'btn-primary'}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
