import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FilePlus,
  Send,
  User,
  Phone,
  FileText,
  Calendar,
  DollarSign,
  Tag,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  ROLE_LABELS,
} from '@/types';
import type { ActionType, SupplementMaterial, Handler } from '@/types';
import { formatCurrency, formatDateTime, canPerformAction } from '@/utils/workflow';
import { cn } from '@/lib/utils';
import ResponsibilityPanel from '@/components/ResponsibilityPanel';
import WorkflowTimeline from '@/components/WorkflowTimeline';

type OperationType = 'approve' | 'reject' | 'supplement' | 'urge' | 'material_ok';

export default function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { claims, handlers, currentUserId, performAction } = useAppStore();

  const claim = claims.find((c) => c.id === id);
  const currentUser = handlers.find((h) => h.id === currentUserId);

  const [operation, setOperation] = useState<OperationType | null>(null);
  const [reason, setReason] = useState('');
  const [supplementMaterials, setSupplementMaterials] = useState<
    { name: string; description: string; providerId: string }[]
  >([{ name: '', description: '', providerId: '' }]);
  const [urgeMessage, setUrgeMessage] = useState('');
  const [urgeTargetId, setUrgeTargetId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!claim || !currentUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-slate-600">案件不存在</p>
          <button
            onClick={() => navigate('/approval')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const currentHandler = handlers.find((h) => h.id === claim.currentHandlerId);

  const canApprove = canPerformAction('approve', currentUser.role);
  const canReject = canPerformAction('reject', currentUser.role);
  const canSupplement = canPerformAction('supplement', currentUser.role);
  const canMaterialOk = canPerformAction('material_ok', currentUser.role);
  const canUrge = canPerformAction('urge', currentUser.role);

  const pendingMaterials = claim.supplementMaterials.filter((m) => m.status === 'pending');

  const handleAddMaterial = () => {
    setSupplementMaterials([
      ...supplementMaterials,
      { name: '', description: '', providerId: '' },
    ]);
  };

  const handleRemoveMaterial = (index: number) => {
    setSupplementMaterials(supplementMaterials.filter((_, i) => i !== index));
  };

  const handleUpdateMaterial = (
    index: number,
    field: 'name' | 'description' | 'providerId',
    value: string
  ) => {
    const updated = [...supplementMaterials];
    updated[index][field] = value;
    setSupplementMaterials(updated);
  };

  const handleSubmit = async () => {
    if (!operation) return;
    setIsSubmitting(true);

    try {
      let actionType: ActionType;
      let actionReason = reason;
      let options: Parameters<typeof performAction>[3] = {};

      switch (operation) {
        case 'approve':
          actionType = 'approve';
          actionReason = reason || '材料齐全，事实清楚，同意进入赔付计算';
          break;
        case 'reject':
          actionType = 'reject';
          if (!reason.trim()) {
            alert('请填写退回原因');
            setIsSubmitting(false);
            return;
          }
          break;
        case 'supplement':
          actionType = 'supplement';
          const validMaterials = supplementMaterials.filter((m) => m.name.trim());
          if (validMaterials.length === 0) {
            alert('请至少添加一项需要补充的材料');
            setIsSubmitting(false);
            return;
          }
          options.supplementMaterials = validMaterials.map((m) => ({
            name: m.name,
            description: m.description,
            providerId: m.providerId || claim.currentHandlerId,
          }));
          actionReason =
            reason ||
            `需要补充材料：${validMaterials.map((m) => m.name).join('、')}`;
          break;
        case 'urge':
          actionType = 'urge';
          if (!urgeMessage.trim()) {
            alert('请填写催办内容');
            setIsSubmitting(false);
            return;
          }
          if (!urgeTargetId) {
            alert('请选择催办对象');
            setIsSubmitting(false);
            return;
          }
          actionReason = urgeMessage;
          options.targetHandlerId = urgeTargetId;
          break;
        case 'material_ok':
          actionType = 'material_ok';
          actionReason = reason || '材料已补充完毕，提交审核';
          break;
        default:
          return;
      }

      performAction(claim.id, actionType, actionReason, options);

      setOperation(null);
      setReason('');
      setSupplementMaterials([{ name: '', description: '', providerId: '' }]);
      setUrgeMessage('');
      setUrgeTargetId('');

      alert('操作成功！');
      navigate('/approval');
    } catch (error) {
      alert(error instanceof Error ? error.message : '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/approval')}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">{claim.caseNumber}</h1>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white',
                STATUS_COLORS[claim.status]
              )}
            >
              {STATUS_LABELS[claim.status]}
            </span>
            {claim.urgeCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">
                <AlertTriangle className="h-4 w-4" />
                已被催办 {claim.urgeCount} 次
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            创建于 {formatDateTime(claim.createdAt)} · 最后更新{' '}
            {formatDateTime(claim.updatedAt)}
          </p>
        </div>
      </div>

      <ResponsibilityPanel claim={claim} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">案件基本信息</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">报案人</p>
                  <p className="font-medium text-slate-800">{claim.claimantName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Tag className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">事故类型</p>
                  <p className="font-medium text-slate-800">{claim.accidentType}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">报案金额</p>
                  <p className="font-bold text-slate-900">
                    {formatCurrency(claim.claimAmount)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">保单号</p>
                  <p className="font-medium text-slate-800">{claim.policyNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Calendar className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">立案时间</p>
                  <p className="font-medium text-slate-800">
                    {formatDateTime(claim.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100">
                  <Phone className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">当前处理人</p>
                  <div className="flex items-center gap-2">
                    {currentHandler && (
                      <img
                        src={currentHandler.avatar}
                        alt={currentHandler.name}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="font-medium text-slate-800">
                      {currentHandler?.name || '未分配'}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({currentHandler?.role && ROLE_LABELS[currentHandler.role]})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-500 mb-2">事故描述</p>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-slate-700 leading-relaxed">
                  {claim.accidentDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <WorkflowTimeline claim={claim} handlers={handlers} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">审批操作</h2>

            {operation === null ? (
              <div className="space-y-3">
                {canApprove && (
                  <button
                    onClick={() => setOperation('approve')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5" />
                    审批通过
                  </button>
                )}

                {canReject && (
                  <button
                    onClick={() => setOperation('reject')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-white font-medium hover:bg-amber-700 transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                    退回案件
                  </button>
                )}

                {canSupplement && (
                  <button
                    onClick={() => setOperation('supplement')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    <FilePlus className="h-5 w-5" />
                    要求补材料
                  </button>
                )}

                {canMaterialOk && pendingMaterials.length > 0 && (
                  <button
                    onClick={() => setOperation('material_ok')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5" />
                    材料已补齐
                  </button>
                )}

                {canUrge && (
                  <button
                    onClick={() => setOperation('urge')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    发起催办
                  </button>
                )}

                {!canApprove && !canReject && !canSupplement && !canMaterialOk && !canUrge && (
                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-slate-500">当前角色无审批操作权限</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-800">
                    {operation === 'approve' && '审批通过'}
                    {operation === 'reject' && '退回案件'}
                    {operation === 'supplement' && '要求补材料'}
                    {operation === 'urge' && '发起催办'}
                    {operation === 'material_ok' && '材料已补齐'}
                  </h3>
                  <button
                    onClick={() => {
                      setOperation(null);
                      setReason('');
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    取消
                  </button>
                </div>

                {operation === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      退回原因 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="请详细说明退回原因和修改要求..."
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {reason.length}/500
                    </p>
                  </div>
                )}

                {operation === 'supplement' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        需补充的材料
                      </label>
                      {supplementMaterials.map((material, index) => (
                        <div key={index} className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">
                              材料 {index + 1}
                            </span>
                            {supplementMaterials.length > 1 && (
                              <button
                                onClick={() => handleRemoveMaterial(index)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={material.name}
                            onChange={(e) =>
                              handleUpdateMaterial(index, 'name', e.target.value)
                            }
                            placeholder="材料名称（如：住院费用明细）"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <textarea
                            value={material.description}
                            onChange={(e) =>
                              handleUpdateMaterial(index, 'description', e.target.value)
                            }
                            placeholder="材料说明（可选）"
                            rows={2}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <select
                            value={material.providerId}
                            onChange={(e) =>
                              handleUpdateMaterial(index, 'providerId', e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">选择材料提供人</option>
                            {handlers.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name} ({ROLE_LABELS[h.role]})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <button
                        onClick={handleAddMaterial}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        添加更多材料
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        补充说明
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="其他说明事项..."
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                )}

                {operation === 'urge' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        催办对象 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={urgeTargetId}
                        onChange={(e) => setUrgeTargetId(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">请选择催办对象</option>
                        {handlers.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({ROLE_LABELS[h.role]})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        催办内容 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={urgeMessage}
                        onChange={(e) => setUrgeMessage(e.target.value)}
                        placeholder="请说明催办原因和要求..."
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                      />
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {['请尽快处理', '已超过处理时限', '客户在催问进度', '请优先处理此案件'].map(
                          (msg) => (
                            <button
                              key={msg}
                              onClick={() => setUrgeMessage(msg)}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
                            >
                              {msg}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(operation === 'approve' || operation === 'material_ok') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      审批意见
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="请填写审批意见（可选）"
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-white font-medium transition-colors disabled:opacity-50',
                    operation === 'approve' && 'bg-emerald-600 hover:bg-emerald-700',
                    operation === 'reject' && 'bg-amber-600 hover:bg-amber-700',
                    operation === 'supplement' && 'bg-blue-600 hover:bg-blue-700',
                    operation === 'urge' && 'bg-red-600 hover:bg-red-700',
                    operation === 'material_ok' && 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  <Send className="h-5 w-5" />
                  {isSubmitting ? '提交中...' : '确认提交'}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-slate-50 p-6">
            <h3 className="font-bold text-slate-800 mb-3">处理说明</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                <span>
                  <strong>审批通过：</strong>
                  案件将进入赔付计算环节，由理赔专员负责计算
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                <span>
                  <strong>退回案件：</strong>
                  需注明退回原因，案件返回给前序处理人修改
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>
                  <strong>要求补材料：</strong>
                  明确需补充的材料清单和责任人
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>
                  <strong>发起催办：</strong>
                  对超时未处理的案件进行催办，记录催办次数
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
