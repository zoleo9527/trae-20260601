import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Users,
  FileText,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Clock,
  PenLine,
  Calculator,
  Zap,
  Droplets,
  Wrench,
  AlertTriangle,
  Building2,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import StepNavigator from '@/components/common/StepNavigator';
import { StatusBadge } from '@/components/common/StatusBadge';
import PhotoUploader from '@/components/common/PhotoUploader';
import {
  formatCurrency,
  formatDateTime,
} from '@/utils/formatters';
import type { DisputeResponse, DeductionItem, SurrenderApplication, UserRole } from '@/types';
import { DEDUCTION_CATEGORY_LABELS } from '@/types';
import { surrenderApi } from '@/api/surrender';

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentRole = useAppStore((s) => s.currentRole);
  const setCurrentRole = useAppStore((s) => s.setCurrentRole);

  const [application, setApplication] = useState<SurrenderApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'deductions', 'disputes'])
  );
  const [showDisputeForm, setShowDisputeForm] = useState<string | null>(null);
  const [selectedDeduction, setSelectedDeduction] = useState<string>('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeAttachments, setDisputeAttachments] = useState<string[]>([]);
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);
  const [responseContent, setResponseContent] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState('');
  const [responderName, setResponderName] = useState('陈会计');
  const [confirmerName, setConfirmerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const fetchApplication = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await surrenderApi.getApplication(id);
      setApplication(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-navy-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-coral-100 flex items-center justify-center text-coral-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-medium text-navy-800">加载失败</h3>
          <p className="text-sm text-navy-500">{error}</p>
          <button
            onClick={fetchApplication}
            className="btn-primary mt-2"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const app = application;
  const hasCostBreakdown = !!app.costBreakdown;

  if (!hasCostBreakdown) {
    return (
      <div className="animate-fade-in opacity-0">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/application/${app.id}`)}
            className="w-10 h-10 rounded-lg bg-white border border-navy-100 flex items-center justify-center text-navy-600 hover:bg-navy-50 transition-colors"
          >
            <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2} />
          </button>
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-semibold text-navy-900">
              客户确认
            </h1>
            <p className="text-sm text-navy-500 mt-1">
              客户查看费用明细、提交异议、最终确认签署
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-navy-500">当前身份：</span>
            <select
              className="input-field py-1.5 px-3 max-w-[140px]"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            >
              <option value="consultant">租赁顾问</option>
              <option value="manager">运营经理</option>
              <option value="finance">财务人员</option>
              <option value="customer">企业客户</option>
            </select>
          </div>
        </div>

        <StepNavigator currentStep={3} application={app} />

        <div className="card p-8">
          <div className="rounded-lg bg-gradient-to-r from-coral-50 to-orange-50 border border-coral-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-coral-100 flex items-center justify-center text-coral-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-navy-900 text-lg mb-2">
                  费用核算尚未完成
                </h3>
                <p className="text-sm text-navy-600 mb-4">
                  当前退租申请还未完成费用核算，请先前往费用核算页面完成费用明细的编制，然后再进行客户确认。
                </p>
                <button
                  onClick={() => navigate(`/application/${app.id}/cost`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-coral-500 text-white font-medium hover:bg-coral-600 transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  返回费用核算
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cost = app.costBreakdown!;
  const confirmation = app.confirmation;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleSubmitDispute = async () => {
    if (!selectedDeduction || !disputeReason.trim() || !id) return;

    try {
      await surrenderApi.submitDispute(id, {
        deductionItemId: selectedDeduction,
        customerReason: disputeReason,
        customerAttachments: disputeAttachments.length > 0 ? disputeAttachments : undefined,
      });

      setShowDisputeForm(null);
      setSelectedDeduction('');
      setDisputeReason('');
      setDisputeAttachments([]);

      await fetchApplication();
    } catch (err) {
      console.error('提交异议失败:', err);
    }
  };

  const handleRespondDispute = async (disputeId: string) => {
    if (!responseContent.trim() || !id) return;

    const response: DisputeResponse = {
      content: responseContent,
      adjustedAmount: adjustedAmount ? Number(adjustedAmount) : undefined,
      responder: responderName,
      respondedAt: new Date().toISOString(),
    };

    try {
      await surrenderApi.respondDispute(id, disputeId, response);

      setShowResponseForm(null);
      setResponseContent('');
      setAdjustedAmount('');

      await fetchApplication();
    } catch (err) {
      console.error('回复异议失败:', err);
    }
  };

  const handleFinalConfirm = async () => {
    if (!confirmerName.trim() || !id) return;
    setIsSigning(true);
    try {
      await surrenderApi.finalConfirm(id, confirmerName);
      await fetchApplication();
    } catch (err) {
      console.error('签署确认失败:', err);
    } finally {
      setIsSigning(false);
    }
  };

  const handleUpdateStatus = async (status: 'confirming') => {
    if (!id) return;
    try {
      await surrenderApi.updateStatus(id, status);
      await fetchApplication();
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const getDeductionById = (deductionId: string): DeductionItem | undefined => {
    return cost.deductions.find((d) => d.id === deductionId);
  };

  const SectionHeader = ({
    sectionId,
    icon: Icon,
    title,
    badge,
  }: {
    sectionId: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
    title: string;
    badge?: React.ReactNode;
  }) => {
    const expanded = expandedSections.has(sectionId);
    return (
      <button
        onClick={() => toggleSection(sectionId)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-50 transition-colors rounded-lg"
      >
        <div className="w-8 h-8 rounded bg-navy-100 flex items-center justify-center text-navy-600 shrink-0">
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <span className="font-medium text-navy-800 flex-1">{title}</span>
        {badge}
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-navy-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-navy-400" />
        )}
      </button>
    );
  };

  const timelineSteps = [
    {
      icon: FileText,
      label: '退租申请已提交',
      time: app.createdAt,
      done: true,
      color: 'sage',
    },
    {
      icon: Building2,
      label: '退场验收完成',
      time: app.inspection?.inspectionDate,
      done: !!app.inspection?.inspectionDate,
      color: 'sage',
    },
    {
      icon: Calculator,
      label: '费用核算完成',
      time: cost.preparedAt,
      done: !!cost.preparedAt,
      color: 'sage',
    },
    {
      icon: Users,
      label: '客户确认中',
      time: confirmation?.customerViewedAt || new Date().toISOString(),
      done: confirmation?.finalConfirmed,
      color: confirmation?.finalConfirmed ? 'sage' : 'navy',
    },
  ];

  return (
    <div className="animate-fade-in opacity-0">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/application/${app.id}`)}
          className="w-10 h-10 rounded-lg bg-white border border-navy-100 flex items-center justify-center text-navy-600 hover:bg-navy-50 transition-colors"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold text-navy-900">
            客户确认
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            客户查看费用明细、提交异议、最终确认签署
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-navy-500">当前身份：</span>
          <select
            className="input-field py-1.5 px-3 max-w-[140px]"
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
          >
            <option value="consultant">租赁顾问</option>
            <option value="manager">运营经理</option>
            <option value="finance">财务人员</option>
            <option value="customer">企业客户</option>
          </select>
        </div>
      </div>

      <StepNavigator currentStep={3} application={app} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4 animate-fade-in-up opacity-0 stagger-1">
            <div className="card p-5 bg-gradient-to-br from-navy-700 to-navy-900 text-white">
              <p className="text-xs text-navy-300 mb-1">押金总额</p>
              <p className="font-serif text-2xl font-semibold text-amber-300 money-text">
                {formatCurrency(cost.totalDeposit)}
              </p>
            </div>
            <div className="card p-5 bg-gradient-to-br from-coral-500 to-coral-700 text-white">
              <p className="text-xs text-coral-100 mb-1">扣减费用</p>
              <p className="font-serif text-2xl font-semibold money-text">
                {formatCurrency(cost.totalDeduction)}
              </p>
            </div>
            <div className="card p-5 bg-gradient-to-br from-sage-500 to-sage-700 text-white">
              <p className="text-xs text-sage-100 mb-1">应退还金额</p>
              <p className="font-serif text-2xl font-semibold money-text">
                {formatCurrency(cost.refundAmount)}
              </p>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-2">
            <SectionHeader
              sectionId="timeline"
              icon={Clock}
              title="流程时间线"
            />
            {expandedSections.has('timeline') && (
              <div className="px-4 pb-4 pt-2 animate-fade-in">
                <div className="relative">
                  {timelineSteps.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              step.done
                                ? `bg-${step.color}-500 text-white shadow-md shadow-${step.color}-200`
                                : 'bg-navy-100 text-navy-400'
                            }`}
                          >
                            <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                          </div>
                          {idx < timelineSteps.length - 1 && (
                            <div
                              className={`w-px flex-1 my-2 ${
                                step.done ? 'bg-sage-300' : 'bg-navy-100'
                              }`}
                            ></div>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p
                            className={`text-sm font-medium ${
                              step.done ? 'text-sage-700' : 'text-navy-700'
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.time && (
                            <p className="text-xs text-navy-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(step.time)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-3">
            <SectionHeader
              sectionId="summary"
              icon={FileText}
              title="费用明细概览"
            />
            {expandedSections.has('summary') && (
              <div className="px-4 pb-4 pt-2 space-y-5 animate-fade-in">
                <div className="p-4 rounded-lg bg-gradient-to-r from-navy-50 to-navy-100/50 border border-navy-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-4 h-4 text-navy-600" />
                    <span className="font-medium text-navy-800">租金结算</span>
                    <span className="ml-auto money-text text-coral-600 font-semibold">
                      {formatCurrency(cost.rentSettlement.amount)}
                    </span>
                  </div>
                  <div className="text-sm text-navy-600 space-y-1">
                    <p>
                      计费期间：{cost.rentSettlement.period}
                    </p>
                    <p className="font-mono">
                      {cost.rentSettlement.occupationDays} 天 × {formatCurrency(cost.rentSettlement.dailyRent)}/天 = {formatCurrency(cost.rentSettlement.amount)}
                    </p>
                    <p className="text-xs text-navy-500 bg-white rounded px-2 py-1 mt-2">
                      依据：{cost.rentSettlement.basis}
                    </p>
                  </div>
                </div>

                {cost.utilityFees.length > 0 && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-navy-800">水电费用</span>
                      <span className="ml-auto money-text text-coral-600 font-semibold">
                        {formatCurrency(
                          cost.utilityFees.reduce((sum, u) => sum + u.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {cost.utilityFees.map((u, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-navy-600"
                        >
                          {u.type === 'electricity' ? (
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Droplets className="w-3.5 h-3.5 text-sky-500" />
                          )}
                          <span>{u.type === 'electricity' ? '电费' : '水费'}：</span>
                          <span className="font-mono">
                            ({u.currentReading} - {u.previousReading}) × {u.unitPrice} ={' '}
                            {formatCurrency(u.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cost.repairFees.length > 0 && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-coral-50 to-coral-100/50 border border-coral-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="w-4 h-4 text-coral-600" />
                      <span className="font-medium text-navy-800">维修费用</span>
                      <span className="ml-auto money-text text-coral-600 font-semibold">
                        {formatCurrency(
                          cost.repairFees.reduce((sum, r) => sum + r.quotedAmount, 0)
                        )}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {cost.repairFees.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-start gap-2 text-sm text-navy-600"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-coral-400 mt-1.5 shrink-0"></span>
                          <div>
                            <span className="font-medium">{r.itemName}</span>
                            <span className="mx-2">—</span>
                            <span>{r.damageDescription}</span>
                            <span className="ml-2 money-text text-coral-600 font-medium">
                              {formatCurrency(r.quotedAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {cost.penaltyFee && cost.penaltyFee.amount > 0 && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-red-100/50 border border-red-100">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-navy-800">违约金</span>
                      <span className="ml-auto money-text text-coral-600 font-semibold">
                        {formatCurrency(cost.penaltyFee.amount)}
                      </span>
                    </div>
                    <div className="text-sm text-navy-600 space-y-1">
                      <p>违约条款：{cost.penaltyFee.clause}</p>
                      <p>违约天数：{cost.penaltyFee.defaultDays} 天</p>
                      {cost.penaltyFee.formula && (
                        <p className="font-mono bg-white rounded px-2 py-1">
                          {cost.penaltyFee.formula}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-4">
            <div className="flex items-center justify-between">
              <SectionHeader
                sectionId="deductions"
                icon={FileText}
                title="押金扣减明细"
                badge={
                  <span className="text-xs text-navy-500">
                    共 {cost.deductions.length} 项
                  </span>
                }
              />
              {currentRole === 'customer' && !confirmation?.finalConfirmed && (
                <button
                  onClick={() => setShowDisputeForm(showDisputeForm ? null : 'new')}
                  className="mr-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-coral-50 text-coral-600 border border-coral-200 hover:bg-coral-100 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  提交异议
                </button>
              )}
            </div>

            {showDisputeForm === 'new' && (
              <div className="mx-4 mb-4 p-4 rounded-lg bg-coral-50 border border-coral-200 animate-fade-in">
                <h4 className="font-medium text-navy-800 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-coral-500" />
                  提交费用异议
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="label-field">选择异议项目 *</label>
                    <select
                      className="input-field"
                      value={selectedDeduction}
                      onChange={(e) => setSelectedDeduction(e.target.value)}
                    >
                      <option value="">请选择有异议的扣减项</option>
                      {cost.deductions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {DEDUCTION_CATEGORY_LABELS[d.category]} - {d.itemName}（{formatCurrency(d.amount)}）
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-field">异议理由 *</label>
                    <textarea
                      className="input-field min-h-[100px] resize-none text-sm"
                      placeholder="请详细描述您的异议理由，如计算错误、依据不充分等..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label-field">上传证明材料（可选）</label>
                    <PhotoUploader
                      photos={disputeAttachments}
                      onChange={setDisputeAttachments}
                      maxPhotos={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setShowDisputeForm(null)}
                      className="btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmitDispute}
                      disabled={!selectedDeduction || !disputeReason.trim()}
                      className="btn-danger"
                    >
                      <Send className="w-4 h-4" />
                      提交异议
                    </button>
                  </div>
                </div>
              </div>
            )}

            {expandedSections.has('deductions') && (
              <div className="px-4 pb-4 pt-2 animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-100 bg-navy-50">
                        <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">
                          类别
                        </th>
                        <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">
                          扣减项目
                        </th>
                        <th className="text-right py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">
                          金额
                        </th>
                        <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">
                          计算依据
                        </th>
                        <th className="text-left py-3 px-3 font-medium text-navy-500 text-xs uppercase tracking-wider">
                          相关文件
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cost.deductions.map((d) => {
                        const hasDispute = confirmation?.disputes.some(
                          (dis) => dis.deductionItemId === d.id && !dis.response
                        );
                        return (
                          <tr
                            key={d.id}
                            className={`border-b border-navy-50 hover:bg-navy-50/50 ${
                              hasDispute ? 'bg-coral-50/50' : ''
                            }`}
                          >
                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 text-xs rounded bg-navy-100 text-navy-700">
                                {DEDUCTION_CATEGORY_LABELS[d.category]}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-navy-800 font-medium">
                              {d.itemName}
                              {hasDispute && (
                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-coral-600">
                                  <AlertCircle className="w-3 h-3" />
                                  异议中
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right money-text text-coral-600 font-semibold">
                              {formatCurrency(d.amount)}
                            </td>
                            <td className="py-3 px-3 text-navy-600 text-xs max-w-[200px]">
                              {d.basis}
                            </td>
                            <td className="py-3 px-3 text-navy-500 text-xs">
                              {d.relatedEvidence || '-'}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-amber-50 border-2 border-amber-200">
                        <td colSpan={2} className="py-3 px-3 font-semibold text-navy-800">
                          扣减合计
                        </td>
                        <td className="py-3 px-3 text-right money-text text-coral-600 font-bold text-lg">
                          {formatCurrency(cost.totalDeduction)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                      <tr className="bg-sage-50 border-2 border-sage-200">
                        <td colSpan={2} className="py-3 px-3 font-semibold text-navy-800">
                          应退还押金
                        </td>
                        <td className="py-3 px-3 text-right money-text text-sage-700 font-bold text-lg">
                          {formatCurrency(cost.refundAmount)}
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-sm text-navy-500">
                          押金总额 {formatCurrency(cost.totalDeposit)} - 扣减合计{' '}
                          {formatCurrency(cost.totalDeduction)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-5">
            <SectionHeader
              sectionId="disputes"
              icon={MessageCircle}
              title="异议处理记录"
              badge={
                confirmation?.disputes && confirmation.disputes.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-coral-100 text-coral-700">
                    {confirmation.disputes.length} 条异议
                  </span>
                ) : undefined
              }
            />
            {expandedSections.has('disputes') && (
              <div className="px-4 pb-4 pt-2 animate-fade-in">
                {!confirmation?.disputes || confirmation.disputes.length === 0 ? (
                  <div className="text-center py-8 text-navy-400">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>暂无异议记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {confirmation.disputes.map((dispute) => {
                      const deduction = getDeductionById(dispute.deductionItemId);
                      return (
                        <div
                          key={dispute.id}
                          className="p-4 rounded-lg border border-navy-100 bg-white"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-coral-100 flex items-center justify-center text-coral-600 shrink-0">
                              <User className="w-4.5 h-4.5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-navy-800">
                                  {app.tenant.contactPerson}
                                </span>
                                <span className="text-xs text-navy-400">
                                  {formatDateTime(dispute.createdAt)}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-coral-100 text-coral-700">
                                  <AlertCircle className="w-3 h-3" />
                                  客户异议
                                </span>
                              </div>
                              {deduction && (
                                <div className="text-xs text-navy-500 mb-2">
                                  异议项目：
                                  <span className="text-navy-700 font-medium">
                                    {deduction.itemName}
                                  </span>
                                  <span className="ml-2 money-text text-coral-600">
                                    {formatCurrency(deduction.amount)}
                                  </span>
                                </div>
                              )}
                              <p className="text-sm text-navy-700 bg-coral-50 rounded-lg p-3">
                                {dispute.customerReason}
                              </p>
                              {dispute.customerAttachments &&
                                dispute.customerAttachments.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-navy-500 mb-1">
                                      客户上传的证明材料：
                                    </p>
                                    <PhotoUploader
                                      photos={dispute.customerAttachments}
                                      readOnly
                                    />
                                  </div>
                                )}
                            </div>
                          </div>

                          {dispute.response ? (
                            <div className="flex items-start gap-3 ml-6 border-l-2 border-sage-200 pl-4">
                              <div className="w-9 h-9 rounded-full bg-sage-100 flex items-center justify-center text-sage-600 shrink-0">
                                <User className="w-4.5 h-4.5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-navy-800">
                                    {dispute.response.responder}
                                  </span>
                                  <span className="text-xs text-navy-400">
                                    {formatDateTime(dispute.response.respondedAt)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-sage-100 text-sage-700">
                                    <CheckCircle2 className="w-3 h-3" />
                                    已回复
                                  </span>
                                </div>
                                <p className="text-sm text-navy-700 bg-sage-50 rounded-lg p-3">
                                  {dispute.response.content}
                                </p>
                                {dispute.response.adjustedAmount !== undefined && (
                                  <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                    <p className="text-sm text-navy-700">
                                      <span className="font-medium">费用调整：</span>
                                      <span className="money-text text-amber-700 font-semibold ml-2">
                                        {dispute.response.adjustedAmount >= 0
                                          ? `+${formatCurrency(dispute.response.adjustedAmount)}`
                                          : formatCurrency(dispute.response.adjustedAmount)}
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : currentRole === 'finance' || currentRole === 'consultant' ? (
                            <div className="ml-6">
                              {showResponseForm === dispute.id ? (
                                <div className="p-4 rounded-lg bg-navy-50 border border-navy-200 space-y-3">
                                  <div>
                                    <label className="label-field">回复内容 *</label>
                                    <textarea
                                      className="input-field min-h-[80px] resize-none text-sm"
                                      placeholder="请详细说明处理结果和依据..."
                                      value={responseContent}
                                      onChange={(e) => setResponseContent(e.target.value)}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="label-field">调整金额（元）</label>
                                      <input
                                        type="number"
                                        className="input-field"
                                        placeholder="负数表示减少费用"
                                        value={adjustedAmount}
                                        onChange={(e) => setAdjustedAmount(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="label-field">回复人</label>
                                      <input
                                        className="input-field"
                                        value={responderName}
                                        onChange={(e) => setResponderName(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end pt-2">
                                    <button
                                      onClick={() => setShowResponseForm(null)}
                                      className="btn-secondary"
                                    >
                                      取消
                                    </button>
                                    <button
                                      onClick={() => handleRespondDispute(dispute.id)}
                                      disabled={!responseContent.trim()}
                                      className="btn-primary"
                                    >
                                      <Send className="w-4 h-4" />
                                      提交回复
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setShowResponseForm(dispute.id);
                                    setResponseContent('');
                                    setAdjustedAmount('');
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-navy-100 text-navy-700 hover:bg-navy-200 transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  回复客户异议
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="ml-6 flex items-center gap-2 text-xs text-amber-600">
                              <Clock className="w-3.5 h-3.5" />
                              等待运营方回复...
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 animate-fade-in-up opacity-0 stagger-2">
            <h3 className="font-serif text-base font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-navy-600" />
              租户信息
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-navy-400">公司名称</p>
                <p className="font-medium text-navy-800">
                  {app.tenant.companyName}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-navy-600">
                <User className="w-3.5 h-3.5 text-navy-400" />
                {app.tenant.contactPerson}
              </div>
              <div className="flex items-center gap-1.5 text-navy-600">
                <Phone className="w-3.5 h-3.5 text-navy-400" />
                {app.tenant.contactPhone}
              </div>
              <div className="flex items-center gap-1.5 text-navy-600">
                <Building2 className="w-3.5 h-3.5 text-navy-400" />
                {app.contract.floorRoom}
              </div>
              <div className="pt-2 border-t border-navy-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-navy-500">押金总额</span>
                  <span className="money-text text-amber-600 font-semibold">
                    {formatCurrency(cost.totalDeposit)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-navy-500">扣减合计</span>
                  <span className="money-text text-coral-600 font-semibold">
                    {formatCurrency(cost.totalDeduction)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-t border-navy-100 mt-1 pt-2">
                  <span className="text-navy-700 font-medium">应退还金额</span>
                  <span className="font-serif text-xl font-semibold text-sage-600 money-text">
                    {formatCurrency(cost.refundAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {confirmation?.finalConfirmed ? (
            <div className="card p-6 bg-gradient-to-br from-sage-50 to-sage-100 border-sage-200 animate-fade-in-up opacity-0 stagger-3">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-sage-500" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-sage-800 mb-2">
                  客户已确认
                </h3>
                <div className="text-sm text-sage-700 space-y-1">
                  <p>确认人：{confirmation.confirmerName}</p>
                  <p className="flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {confirmation.confirmedAt && formatDateTime(confirmation.confirmedAt)}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-sage-200">
                  <StatusBadge status="completed" />
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-6 sticky top-6 animate-fade-in-up opacity-0 stagger-3">
              <h3 className="font-serif text-base font-semibold text-navy-800 mb-4 flex items-center gap-2">
                <PenLine className="w-4.5 h-4.5 text-navy-600" />
                最终确认
              </h3>

              {currentRole === 'customer' ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    <p className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      请仔细核对以上所有费用明细及扣减依据。如有异议，请先提交异议；如无异议，请签署确认。
                    </p>
                  </div>
                  <div>
                    <label className="label-field">确认人姓名 *</label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-navy-400" strokeWidth={2} />
                      <input
                        className="input-field"
                        placeholder="请输入确认人姓名"
                        value={confirmerName}
                        onChange={(e) => setConfirmerName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-navy-500">
                    <p className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage-500" />
                      我已仔细阅读并理解所有费用明细
                    </p>
                    <p className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage-500" />
                      我认可所有扣减项目的依据和金额
                    </p>
                    <p className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage-500" />
                      我确认无其他异议
                    </p>
                  </div>
                  <button
                    onClick={handleFinalConfirm}
                    disabled={!confirmerName.trim() || isSigning}
                    className="btn-primary w-full"
                  >
                    {isSigning ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                        确认签署中...
                      </>
                    ) : (
                      <>
                        <PenLine className="w-4 h-4" />
                        确认并签署
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-navy-50 border border-navy-200 text-sm text-navy-700">
                    <p className="flex items-start gap-2">
                      <Users className="w-4 h-4 shrink-0 mt-0.5 text-navy-500" />
                      请切换到"企业客户"身份进行最终确认操作
                    </p>
                  </div>
                  <div className="text-sm text-navy-500">
                    <p className="mb-2">当前状态：</p>
                    <StatusBadge status={app.status} />
                  </div>
                  {confirmation?.disputes &&
                    confirmation.disputes.some((d) => !d.response) && (
                    <div className="p-3 rounded-lg bg-coral-50 border border-coral-200 text-sm text-coral-700">
                      <p className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        有待处理的客户异议，请先回复处理
                      </p>
                    </div>
                  )}
                  {confirmation?.disputes &&
                    confirmation.disputes.length > 0 &&
                    confirmation.disputes.every((d) => d.response) &&
                    app.status === 'disputing' && (
                    <button
                      onClick={() => handleUpdateStatus('confirming')}
                      className="btn-secondary w-full"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      标记为已处理，等待客户确认
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
