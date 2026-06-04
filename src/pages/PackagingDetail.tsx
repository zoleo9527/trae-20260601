import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import Timeline from '../components/Timeline';
import StatusFlow from '../components/StatusFlow';
import {
  PACKAGING_STATUS_LABELS, PACKAGING_STATUS_COLORS, ROLE_LABELS,
  FILLING_STATUS_LABELS, FILLING_STATUS_COLORS
} from '../types';
import type { PackagingRequisition, PackagingStatus } from '../types';

export default function PackagingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, triggerRefresh } = useContext(AppContext);
  const [requisition, setRequisition] = useState<PackagingRequisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState<string | null>(null);
  const [actionRemark, setActionRemark] = useState('');
  const [editForm, setEditForm] = useState<any>({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetch(`/api/packaging-requisitions/${id}`)
      .then(r => r.json())
      .then(data => {
        setRequisition(data);
        setEditForm({
          bottleType: data.bottleType,
          bottleCount: data.bottleCount,
          labelType: data.labelType,
          cartonType: data.cartonType,
          requiredDate: new Date(data.requiredDate).toISOString().split('T')[0]
        });
        setLoading(false);
      });
  }, [id, triggerRefresh]);

  if (loading || !requisition) {
    return <div className="text-center py-12">加载中...</div>;
  }

  const canHandle = requisition.currentHandler === currentUser?.role;
  const hasScheduleChangeWarning = requisition.history?.some(h => h.scheduleChangeNotified);

  const getFlowSteps = () => {
    const statuses: PackagingStatus[] = ['PENDING', 'APPROVED', 'ISSUED', 'COMPLETED'];
    const currentIdx = statuses.indexOf(requisition.status === 'REJECTED' ? 'PENDING' : requisition.status);
    return statuses.map((s, i) => ({
      key: s,
      label: PACKAGING_STATUS_LABELS[s],
      active: i === currentIdx,
      done: i < currentIdx || (requisition.status === 'COMPLETED' && i <= currentIdx)
    }));
  };

  const handleAction = async (action: string) => {
    const endpoints: Record<string, string> = {
      approve: 'approve',
      reject: 'reject',
      resubmit: 'resubmit',
      issue: 'issue',
      complete: 'complete',
      comment: 'add-comment'
    };

    if (action === 'reject' && !actionRemark.trim()) {
      alert('退回原因不能为空');
      return;
    }

    let body: any = { userId: currentUser!.id, remark: actionRemark };
    if (action === 'resubmit') {
      body = { ...body, ...editForm };
    }
    if (action === 'comment') {
      body.remark = comment;
    }

    const res = await fetch(`/api/packaging-requisitions/${requisition.id}/${endpoints[action]}`, {
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

    const actions: Partial<Record<PackagingStatus, any>> = {
      PENDING: [
        { key: 'approve', label: '审核通过', variant: 'primary' },
        { key: 'reject', label: '退回', variant: 'danger' }
      ],
      APPROVED: { key: 'issue', label: '物料发放', variant: 'primary' },
      ISSUED: { key: 'complete', label: '领用完成', variant: 'primary' },
      REJECTED: { key: 'resubmit', label: '补录后重提', variant: 'primary' }
    };

    return actions[requisition.status];
  };

  const primaryAction = getPrimaryAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/packaging')} className="text-gray-500 hover:text-gray-700">
            ← 返回列表
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{requisition.requisitionNo}</h1>
          <span className={`status-badge ${PACKAGING_STATUS_COLORS[requisition.status]}`}>
            {PACKAGING_STATUS_LABELS[requisition.status]}
          </span>
          {requisition.status === 'REJECTED' && (
            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              ⚠️ 已被退回，请修改后重提
            </span>
          )}
          {hasScheduleChangeWarning && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center space-x-1">
              <span>⚠️</span>
              <span>关联排产已变更，请确认</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">当前处理：</span>
          <span className={`px-2 py-1 rounded text-sm ${
            requisition.currentHandler === currentUser?.role
              ? 'bg-beer-100 text-beer-700 font-medium'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {ROLE_LABELS[requisition.currentHandler]}
          </span>
        </div>
      </div>

      {hasScheduleChangeWarning && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-medium text-orange-800">关联灌装排产已变更</div>
              <div className="text-sm text-orange-700 mt-1">
                该包装领用关联的灌装排产
                <button
                  onClick={() => navigate(`/filling/${requisition.scheduleId}`)}
                  className="mx-1 underline font-medium hover:text-orange-900"
                >
                  {requisition.schedule.batchNo}
                </button>
                有内容变更，请确认是否影响您的包装需求。
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-medium text-gray-500 mb-4">处理流程</h3>
        <StatusFlow steps={getFlowSteps()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">关联灌装排产</h2>
            <div className="p-4 bg-beer-50 rounded-lg border border-beer-100">
              <div className="flex justify-between items-start">
                <div>
                  <button
                    onClick={() => navigate(`/filling/${requisition.scheduleId}`)}
                    className="font-medium text-beer-800 hover:text-beer-600"
                  >
                    {requisition.schedule.batchNo} - {requisition.schedule.productName}
                  </button>
                  <div className="text-sm text-beer-600 mt-1">
                    {requisition.schedule.beerType} · {requisition.schedule.volume}L · {requisition.schedule.targetBottles}瓶
                  </div>
                </div>
                <span className={`status-badge ${FILLING_STATUS_COLORS[requisition.schedule.status]}`}>
                  {FILLING_STATUS_LABELS[requisition.schedule.status]}
                </span>
              </div>
              <div className="mt-3 text-sm text-beer-700">
                <span className="text-gray-500">灌装日期：</span>
                {new Date(requisition.schedule.fillingDate).toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">包装领用信息</h2>
            {requisition.status === 'REJECTED' && canHandle ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-800 mb-1">退回原因</div>
                  <div className="text-sm text-red-700">
                    {requisition.history.find(h => h.action === '退回')?.remark || '暂无原因'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">瓶型</label>
                    <select
                      value={editForm.bottleType}
                      onChange={e => setEditForm({ ...editForm, bottleType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    >
                      <option value="330ml透明瓶">330ml透明瓶</option>
                      <option value="330ml棕色瓶">330ml棕色瓶</option>
                      <option value="500ml透明瓶">500ml透明瓶</option>
                      <option value="500ml棕色瓶">500ml棕色瓶</option>
                      <option value="500ml听装">500ml听装</option>
                      <option value="330ml听装">330ml听装</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">瓶子数量</label>
                    <input
                      type="number"
                      value={editForm.bottleCount}
                      onChange={e => setEditForm({ ...editForm, bottleCount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">标签类型</label>
                    <input
                      type="text"
                      value={editForm.labelType}
                      onChange={e => setEditForm({ ...editForm, labelType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">纸箱类型</label>
                    <select
                      value={editForm.cartonType}
                      onChange={e => setEditForm({ ...editForm, cartonType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    >
                      <option value="12瓶装彩色纸箱">12瓶装彩色纸箱</option>
                      <option value="24瓶装彩色纸箱">24瓶装彩色纸箱</option>
                      <option value="24瓶装牛皮纸箱">24瓶装牛皮纸箱</option>
                      <option value="24听装托盘">24听装托盘</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">需求日期</label>
                    <input
                      type="date"
                      value={editForm.requiredDate}
                      onChange={e => setEditForm({ ...editForm, requiredDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm text-gray-500">瓶型</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">{requisition.bottleType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">瓶子数量</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">{requisition.bottleCount} 个</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">标签类型</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">{requisition.labelType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">纸箱类型</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">{requisition.cartonType}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">需求日期</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">
                    {new Date(requisition.requiredDate).toLocaleDateString('zh-CN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">创建人</dt>
                  <dd className="text-base font-medium text-gray-900 mt-1">
                    {requisition.createdBy.avatar} {requisition.createdBy.name}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">处理历史</h2>
            <Timeline history={requisition.history} />
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
                当前由 <span className="font-medium text-gray-700">{ROLE_LABELS[requisition.currentHandler]}</span> 处理
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

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">💡 操作提示</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              {requisition.status === 'PENDING' && currentUser?.role === 'SALES_BACKOFFICE' && (
                <>
                  <li>• 核对包装材料与灌装排产是否匹配</li>
                  <li>• 确认仓库库存是否充足</li>
                  <li>• 有问题请退回并注明原因</li>
                </>
              )}
              {requisition.status === 'APPROVED' && currentUser?.role === 'BREW_MASTER' && (
                <li>• 审核通过后，按清单发放包装材料</li>
              )}
              {requisition.status === 'ISSUED' && currentUser?.role === 'PACKAGING_SUPERVISOR' && (
                <li>• 收到物料并核对无误后，确认领用完成</li>
              )}
              {requisition.status === 'REJECTED' && (
                <>
                  <li>• 请查看退回原因并修改相关字段</li>
                  <li>• 修改后点击"补录后重提"再次提交</li>
                  <li>• 系统会自动记录变更内容</li>
                </>
              )}
              {hasScheduleChangeWarning && (
                <li className="text-orange-700 font-medium">
                  ⚠️ 关联排产已变更，请确认需求是否需要调整
                </li>
              )}
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">📋 责任划分</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-beer-500">🍺</span>
                <span><strong>酿酒师</strong>：发放物料，确保数量准确</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500">📦</span>
                <span><strong>包装主管</strong>：按需申请，核对接收</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500">💼</span>
                <span><strong>销售内勤</strong>：审核匹配度，跟踪时效</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showActionModal === 'approve' && '确认审核通过'}
              {showActionModal === 'reject' && '确认退回'}
              {showActionModal === 'resubmit' && '确认补录后重提'}
              {showActionModal === 'issue' && '确认物料发放'}
              {showActionModal === 'complete' && '确认领用完成'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {showActionModal === 'reject' ? '退回原因 *' : '备注（可选）'}
              </label>
              <textarea
                value={actionRemark}
                onChange={e => setActionRemark(e.target.value)}
                rows={3}
                placeholder={showActionModal === 'reject' ? '请详细说明退回原因...' : '输入备注...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-beer-500 focus:border-beer-500"
                required={showActionModal === 'reject'}
              />
            </div>
            {showActionModal === 'reject' && (
              <p className="text-sm text-red-600 mb-4">
                ⚠️ 退回后将退回给包装主管修改，请务必注明原因，避免责任不清
              </p>
            )}
            {showActionModal === 'resubmit' && (
              <p className="text-sm text-blue-600 mb-4">
                📝 系统将自动记录您修改的字段，变更历史可追溯
              </p>
            )}
            {showActionModal === 'issue' && (
              <p className="text-sm text-orange-600 mb-4">
                📦 确认物料已按清单清点并发放，发放后请及时通知包装主管
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
