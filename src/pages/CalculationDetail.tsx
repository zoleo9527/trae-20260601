import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  Save,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  HelpCircle,
  User,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  MapPin,
  FileCheck,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  ROLE_LABELS,
} from '@/types';
import type { CalcItem } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  canPerformAction,
} from '@/utils/workflow';
import { cn } from '@/lib/utils';
import ResponsibilityPanel from '@/components/ResponsibilityPanel';
import WorkflowTimeline from '@/components/WorkflowTimeline';

export default function CalculationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { claims, handlers, currentUserId, performAction } = useAppStore();

  const claim = claims.find((c) => c.id === id);
  const currentUser = handlers.find((h) => h.id === currentUserId);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [calcItems, setCalcItems] = useState<CalcItem[]>([]);
  const [remark, setRemark] = useState('');
  const [showFormula, setShowFormula] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (claim?.compensationCalc) {
      setCalcItems(claim.compensationCalc.items || []);
      setRemark(claim.compensationCalc.remark || '');
      setIsStarted(true);
    }
  }, [claim]);

  if (!claim || !currentUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Calculator className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-slate-600">案件不存在</p>
          <button
            onClick={() => navigate('/calculation')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const canStartCalc = canPerformAction('start_calc', currentUser.role);
  const canFinishCalc = canPerformAction('finish_calc', currentUser.role);
  const canUrge = canPerformAction('urge', currentUser.role);

  const currentHandler = handlers.find((h) => h.id === claim.currentHandlerId);

  const totalAmount = calcItems.reduce((sum, item) => sum + item.amount, 0);

  const formula = calcItems
    .map((item) => `${item.amount >= 0 ? '+' : ''}${item.amount}`)
    .join(' ');

  const handleAddItem = () => {
    setCalcItems([
      ...calcItems,
      { name: '', amount: 0, formula: '', remark: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setCalcItems(calcItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof CalcItem,
    value: string | number
  ) => {
    const updated = [...calcItems];
    (updated[index] as any)[field] = value;
    setCalcItems(updated);
  };

  const handleStartCalc = async () => {
    try {
      performAction(claim.id, 'start_calc', '开始赔付计算', {
        compensationCalc: {
          items: [
            {
              name: '初步核算金额',
              amount: claim.claimAmount,
              formula: '报案金额',
              remark: '根据报案金额初步核算',
            },
          ],
        },
      });
      setIsStarted(true);
      alert('已开始赔付计算');
    } catch (error) {
      alert(error instanceof Error ? error.message : '操作失败');
    }
  };

  const handleSaveCalc = async () => {
    try {
      const validItems = calcItems.filter((item) => item.name.trim());
      if (validItems.length === 0) {
        alert('请至少添加一项计算项目');
        return;
      }

      const total = validItems.reduce((sum, item) => sum + item.amount, 0);

      performAction(claim.id, 'start_calc', '保存赔付计算草稿', {
        compensationCalc: {
          items: validItems,
          totalAmount: total,
          formula: formula,
          remark: remark,
        },
      });

      alert('计算已保存');
    } catch (error) {
      alert(error instanceof Error ? error.message : '操作失败');
    }
  };

  const handleFinishCalc = async () => {
    const validItems = calcItems.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      alert('请至少添加一项计算项目');
      return;
    }

    if (!remark.trim()) {
      alert('请填写计算说明');
      return;
    }

    if (
      !confirm(
        `确认完成赔付计算？\n赔付金额：${formatCurrency(totalAmount)}\n此操作将完成案件处理，不可撤销。`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const total = validItems.reduce((sum, item) => sum + item.amount, 0);

      performAction(claim.id, 'start_calc', '保存赔付计算', {
        compensationCalc: {
          items: validItems,
          totalAmount: total,
          formula: formula,
          remark: remark,
        },
      });

      performAction(claim.id, 'finish_calc', remark || '赔付计算完成');

      alert('赔付计算已完成！');
      navigate('/calculation');
    } catch (error) {
      alert(error instanceof Error ? error.message : '操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full gap-6 -m-6 p-6">
      <div
        className={cn(
          'flex-shrink-0 overflow-hidden transition-all duration-300 border-r border-slate-200',
          sidebarOpen ? 'w-96 pr-6' : 'w-0 pr-0'
        )}
      >
        {sidebarOpen && (
          <div className="h-full overflow-auto">
            <div className="sticky top-0 bg-slate-50 z-10 py-4 pr-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">流转回看</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded hover:bg-slate-200"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                点击节点查看操作详情和原因说明
              </p>
            </div>
            <div className="mt-2">
              <WorkflowTimeline claim={claim} handlers={handlers} />
            </div>
          </div>
        )}
      </div>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-slate-300 border-l-0 rounded-r-lg p-2 shadow-md hover:bg-slate-50"
        >
          <ChevronRight className="h-5 w-5 text-slate-500" />
        </button>
      )}

      <div className="flex-1 overflow-auto">
        <div className="space-y-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/calculation')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800">
                  {claim.caseNumber}
                </h1>
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
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  案件基本信息
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">报案人</p>
                    <p className="font-medium text-slate-800">
                      {claim.claimantName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">事故类型</p>
                    <p className="font-medium text-slate-800">
                      {claim.accidentType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">报案金额</p>
                    <p className="font-bold text-slate-900">
                      {formatCurrency(claim.claimAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">保单号</p>
                    <p className="font-medium text-slate-800">
                      {claim.policyNumber}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-slate-500 mb-2">事故描述</p>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-slate-700 leading-relaxed">
                      {claim.accidentDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    赔付计算明细
                  </h2>
                  <button
                    onClick={() => setShowFormula(!showFormula)}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {showFormula ? '隐藏公式' : '显示公式'}
                  </button>
                </div>

                {!isStarted ? (
                  <div className="text-center py-12">
                    <Calculator className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-4 text-slate-600">尚未开始赔付计算</p>
                    <p className="mt-1 text-sm text-slate-500">
                      点击下方按钮开始计算赔付金额
                    </p>
                    {canStartCalc && (
                      <button
                        onClick={handleStartCalc}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-white font-medium hover:bg-purple-700 transition-colors"
                      >
                        <Calculator className="h-5 w-5" />
                        开始赔付计算
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {calcItems.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-slate-200 p-4 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="md:col-span-1">
                                  <label className="block text-sm font-medium text-slate-700 mb-1">
                                    项目名称
                                  </label>
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) =>
                                      handleUpdateItem(index, 'name', e.target.value)
                                    }
                                    placeholder="如：车辆损失"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">
                                    金额
                                  </label>
                                  <input
                                    type="number"
                                    value={item.amount}
                                    onChange={(e) =>
                                      handleUpdateItem(
                                        index,
                                        'amount',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    placeholder="0.00"
                                    step="0.01"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <button
                                    onClick={() => handleRemoveItem(index)}
                                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center justify-center gap-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    删除
                                  </button>
                                </div>
                              </div>
                              {showFormula && (
                                <div>
                                  <label className="block text-sm font-medium text-slate-700 mb-1">
                                    计算公式说明
                                  </label>
                                  <input
                                    type="text"
                                    value={item.formula}
                                    onChange={(e) =>
                                      handleUpdateItem(index, 'formula', e.target.value)
                                    }
                                    placeholder="如：投保金额 × (1 - 折旧率×使用月数)"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                  备注说明
                                </label>
                                <input
                                  type="text"
                                  value={item.remark}
                                  onChange={(e) =>
                                    handleUpdateItem(index, 'remark', e.target.value)
                                  }
                                  placeholder="计算依据或特殊说明"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleAddItem}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-slate-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                        添加计算项目
                      </button>
                    </div>

                    <div className="mt-6 rounded-lg bg-purple-50 p-5 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-700">赔付金额合计</p>
                          {showFormula && formula && (
                            <p className="mt-1 text-sm font-mono text-purple-600">
                              {formula} = {totalAmount}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-purple-700">
                            {formatCurrency(totalAmount)}
                          </p>
                          {claim.claimAmount > 0 && (
                            <p className="mt-1 text-sm text-purple-600">
                              赔付率：{((totalAmount / claim.claimAmount) * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        计算说明 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="请详细说明赔付计算的依据、规则和特殊情况处理..."
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      />
                      <p className="mt-1 text-xs text-slate-500 text-right">
                        {remark.length}/1000
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4">计算操作</h2>

                {isStarted && claim.status !== 'completed' && (
                  <div className="space-y-3">
                    <button
                      onClick={handleSaveCalc}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-600 px-4 py-3 text-white font-medium hover:bg-slate-700 transition-colors"
                    >
                      <Save className="h-5 w-5" />
                      保存草稿
                    </button>

                    {canFinishCalc && (
                      <button
                        onClick={handleFinishCalc}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        <FileCheck className="h-5 w-5" />
                        {isSubmitting ? '提交中...' : '完成计算'}
                      </button>
                    )}

                    {canUrge && (
                      <button
                        onClick={() => {
                          alert('催办功能（占位）：将发送通知给当前处理人');
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-white font-medium hover:bg-red-700 transition-colors"
                      >
                        <AlertTriangle className="h-5 w-5" />
                        发起催办
                      </button>
                    )}
                  </div>
                )}

                {claim.status === 'completed' && (
                  <div className="text-center py-4">
                    <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                    <p className="mt-3 font-medium text-slate-800">计算已完成</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {claim.compensationCalc?.calculatedAt &&
                        formatDateTime(claim.compensationCalc.calculatedAt)}
                    </p>
                    <div className="mt-4 rounded-lg bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-700">最终赔付金额</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">
                        {formatCurrency(claim.compensationCalc?.totalAmount || 0)}
                      </p>
                    </div>
                  </div>
                )}

                {!isStarted && !canStartCalc && (
                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-slate-500">当前角色无计算权限</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-blue-50 p-6">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                  责任追溯
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">当前处理人</span>
                    <div className="flex items-center gap-2">
                      {currentHandler && (
                        <img
                          src={currentHandler.avatar}
                          alt={currentHandler.name}
                          className="h-6 w-6 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium text-slate-800">
                        {currentHandler?.name || '未分配'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">流转步数</span>
                    <span className="text-sm font-medium text-slate-800">
                      {claim.workflowLogs.length} 步
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">处理时长</span>
                    <span className="text-sm font-medium text-slate-800">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {(
                        (new Date().getTime() - new Date(claim.createdAt).getTime()) /
                        (1000 * 60 * 60)
                      ).toFixed(1)}{' '}
                      小时
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">报案金额</span>
                    <span className="text-sm font-medium text-slate-800">
                      {formatCurrency(claim.claimAmount)}
                    </span>
                  </div>
                  {claim.compensationCalc && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-sm font-medium text-purple-700">
                        赔付金额
                      </span>
                      <span className="text-sm font-bold text-purple-700">
                        {formatCurrency(claim.compensationCalc.totalAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-slate-50 p-6">
                <h3 className="font-bold text-slate-800 mb-3">计算说明</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    <span>
                      <strong>开始计算：</strong>
                      进入赔付计算状态，可随时保存草稿
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500">•</span>
                    <span>
                      <strong>添加项目：</strong>
                      支持添加多项赔付和扣除项目
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>
                      <strong>流转回看：</strong>
                      左侧时间线可查看完整流转历史和原因
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>
                      <strong>完成计算：</strong>
                      确认后案件结案，不可修改
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
