import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Droplets,
  Wrench,
  AlertTriangle,
  Calculator,
  UserCheck,
  CalendarDays,
  Save,
  Plus,
  Trash2,
  FileText,
  Loader2,
} from 'lucide-react';
import { surrenderApi } from '@/api/surrender';
import StepNavigator from '@/components/common/StepNavigator';
import { formatCurrency, generateId, daysBetween } from '@/utils/formatters';
import type {
  CostBreakdown as CostBreakdownType,
  RentSettlement,
  UtilityFee,
  RepairFee,
  PenaltyFee,
  DeductionItem,
  SurrenderApplication,
} from '@/types';
import { DEDUCTION_CATEGORY_LABELS } from '@/types';

export default function CostBreakdownPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [app, setApp] = useState<SurrenderApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['rent', 'utility', 'repair', 'penalty', 'deductions'])
  );

  const [cost, setCost] = useState<CostBreakdownType | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    surrenderApi
      .getApplication(id)
      .then((data) => {
        setApp(data);
        initializeCost(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const initializeCost = (app: SurrenderApplication) => {
    if (app.costBreakdown) {
      setCost(app.costBreakdown);
      return;
    }

    const defaultRentSettlement: RentSettlement = {
      occupationDays: daysBetween(
        app.surrenderInfo.expectedMoveOutDate.slice(0, 8) + '01',
        app.surrenderInfo.expectedMoveOutDate
      ),
      dailyRent: app.contract.dailyRent || 0,
      amount:
        daysBetween(
          app.surrenderInfo.expectedMoveOutDate.slice(0, 8) + '01',
          app.surrenderInfo.expectedMoveOutDate
        ) * app.contract.dailyRent,
      period: `${app.surrenderInfo.expectedMoveOutDate.slice(0, 8)}01 至 ${app.surrenderInfo.expectedMoveOutDate}`,
      basis: '根据《租赁合同》第4.2条：退租当月不足整月的，按实际占用天数乘以日租金标准计算。',
    };

    const defaultUtilities: UtilityFee[] = [
      {
        type: 'electricity',
        previousReading: 0,
        currentReading: 0,
        unitPrice: 1.2,
        amount: 0,
        period: '2026-05-01 至 2026-06-05',
      },
      {
        type: 'water',
        previousReading: 0,
        currentReading: 0,
        unitPrice: 5.5,
        amount: 0,
        period: '2026-05-01 至 2026-06-05',
      },
    ];

    const defaultRepairs: RepairFee[] =
      app.inspection?.items
        .filter((i) => i.status !== 'normal' && i.estimatedCost)
        .map((item) => ({
          id: generateId('rep'),
          itemName: item.name + '维修',
          damageDescription: item.description,
          quotedAmount: item.estimatedCost || 0,
          basis: `参考《房屋交接标准》及验收记录（${item.category}）`,
        })) || [];

    const defaultPenalty: PenaltyFee | undefined =
      app.surrenderInfo.reason.includes('提前') ||
      app.surrenderInfo.reason.includes('调整') ||
      app.surrenderInfo.reason.includes('缩减') ||
      app.surrenderInfo.reason.includes('解散')
        ? {
            amount: 0,
            clause: '《租赁合同》第8.3条',
            defaultDays: Math.max(
              0,
              daysBetween(app.surrenderInfo.expectedMoveOutDate, app.contract.endDate)
            ),
            formula: '',
          }
        : undefined;

    setCost({
      id: generateId('cost'),
      preparedBy: '陈会计',
      preparedAt: new Date().toISOString().slice(0, 10),
      totalDeposit: app.contract.depositAmount || 0,
      totalDeduction: 0,
      refundAmount: app.contract.depositAmount || 0,
      rentSettlement: defaultRentSettlement,
      utilityFees: defaultUtilities,
      repairFees: defaultRepairs,
      penaltyFee: defaultPenalty,
      deductions: [],
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const updateRent = (patch: Partial<RentSettlement>) => {
    setCost((prev) => {
      if (!prev) return prev;
      const newRent = { ...prev.rentSettlement, ...patch };
      if ('occupationDays' in patch || 'dailyRent' in patch) {
        newRent.amount = newRent.occupationDays * newRent.dailyRent;
      }
      return { ...prev, rentSettlement: newRent };
    });
  };

  const updateUtility = (idx: number, patch: Partial<UtilityFee>) => {
    setCost((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        utilityFees: prev.utilityFees.map((u, i) => {
          if (i !== idx) return u;
          const updated = { ...u, ...patch };
          if (
            'previousReading' in patch ||
            'currentReading' in patch ||
            'unitPrice' in patch
          ) {
            updated.amount =
              (updated.currentReading - updated.previousReading) *
              updated.unitPrice;
          }
          return updated;
        }),
      };
    });
  };

  const updateRepair = (idx: number, patch: Partial<RepairFee>) => {
    setCost((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        repairFees: prev.repairFees.map((r, i) =>
          i === idx ? { ...r, ...patch } : r
        ),
      };
    });
  };

  const addRepair = () => {
    setCost((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        repairFees: [
          ...prev.repairFees,
          {
            id: generateId('rep'),
            itemName: '',
            damageDescription: '',
            quotedAmount: 0,
            basis: '',
          },
        ],
      };
    });
  };

  const removeRepair = (idx: number) => {
    setCost((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        repairFees: prev.repairFees.filter((_, i) => i !== idx),
      };
    });
  };

  const updatePenalty = (patch: Partial<PenaltyFee>) => {
    setCost((prev) => {
      if (!prev || !prev.penaltyFee) return prev;
      return {
        ...prev,
        penaltyFee: { ...prev.penaltyFee, ...patch },
      };
    });
  };

  const buildDeductionsFromCost = (prev: CostBreakdownType): CostBreakdownType => {
    const deductions: DeductionItem[] = [];

    if (prev.rentSettlement.amount > 0) {
      deductions.push({
        id: generateId('ded'),
        category: 'rent',
        itemName: '实际占用租金',
        amount: prev.rentSettlement.amount,
        basis: `${prev.rentSettlement.occupationDays}天 × ${formatCurrency(prev.rentSettlement.dailyRent)}/天 = ${formatCurrency(prev.rentSettlement.amount)}`,
        relatedEvidence: '《租赁合同》第4.2条',
      });
    }

    prev.utilityFees.forEach((u) => {
      if (u.amount > 0) {
        deductions.push({
          id: generateId('ded'),
          category: 'utility',
          itemName: u.type === 'electricity' ? '电费' : '水费',
          amount: u.amount,
          basis: `(${u.currentReading} - ${u.previousReading})${u.type === 'electricity' ? '度' : '吨'} × ${u.unitPrice}元/${u.type === 'electricity' ? '度' : '吨'} = ${formatCurrency(u.amount)}`,
          relatedEvidence: `物业水电抄表单 ${u.period}`,
        });
      }
    });

    prev.repairFees.forEach((r) => {
      if (r.quotedAmount > 0) {
        deductions.push({
          id: generateId('ded'),
          category: 'repair',
          itemName: r.itemName,
          amount: r.quotedAmount,
          basis: r.damageDescription,
          relatedEvidence: r.basis,
        });
      }
    });

    if (prev.penaltyFee && prev.penaltyFee.amount > 0) {
      deductions.push({
        id: generateId('ded'),
        category: 'penalty',
        itemName: '提前退租违约金',
        amount: prev.penaltyFee.amount,
        basis: prev.penaltyFee.formula || '按合同约定计算',
        relatedEvidence: prev.penaltyFee.clause,
      });
    }

    const totalDeduction = deductions.reduce((sum, d) => sum + d.amount, 0);
    const refundAmount = prev.totalDeposit - totalDeduction;

    return {
      ...prev,
      deductions,
      totalDeduction,
      refundAmount,
    };
  };

  const regenerateDeductions = () => {
    setCost((prev) => {
      if (!prev) return prev;
      return buildDeductionsFromCost(prev);
    });
  };

  const handleSave = async () => {
    if (!id || !cost) return;
    const updatedCost = buildDeductionsFromCost({
      ...cost,
      preparedAt: new Date().toISOString(),
    });
    setSubmitting(true);
    try {
      setCost(updatedCost);
      await surrenderApi.submitCostBreakdown(id, updatedCost);
      navigate(`/application/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-navy-500 mb-3" />
        <p className="text-navy-500">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-coral-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary inline-flex items-center gap-2"
        >
          重试
        </button>
      </div>
    );
  }

  if (!app || !cost) {
    return (
      <div className="text-center py-20 text-navy-500">
        申请记录不存在
      </div>
    );
  }

  const currentTotalDeduction =
    cost.rentSettlement.amount +
    cost.utilityFees.reduce((sum, u) => sum + u.amount, 0) +
    cost.repairFees.reduce((sum, r) => sum + r.quotedAmount, 0) +
    (cost.penaltyFee?.amount || 0);

  const currentRefund = cost.totalDeposit - currentTotalDeduction;

  type LucideIcon = React.ComponentType<{ className?: string; strokeWidth?: number | string }>;

  const SectionHeader = ({
    id,
    icon: Icon,
    title,
    amount,
  }: {
    id: string;
    icon: LucideIcon;
    title: string;
    amount?: number;
  }) => {
    const expanded = expandedSections.has(id);
    return (
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-50 transition-colors rounded-lg"
      >
        <div className="w-8 h-8 rounded bg-navy-100 flex items-center justify-center text-navy-600 shrink-0">
          <Icon className="w-4 h-4" strokeWidth={2} />
        </div>
        <span className="font-medium text-navy-800 flex-1">{title}</span>
        {amount !== undefined && (
          <span className="money-text text-navy-700 font-semibold">
            {formatCurrency(amount)}
          </span>
        )}
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-navy-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-navy-400" />
        )}
      </button>
    );
  };

  return (
    <div className="animate-fade-in opacity-0">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/application/${app.id}`)}
          className="w-10 h-10 rounded-lg bg-white border border-navy-100 flex items-center justify-center text-navy-600 hover:bg-navy-50 transition-colors"
        >
          <ArrowLeft className="w-4.5 h-4.5" strokeWidth={2} />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">
            费用明细核算
          </h1>
          <p className="text-sm text-navy-500 mt-1">
            财务人员拆分租金、水电、维修、违约金，生成押金扣减明细
          </p>
        </div>
      </div>

      <StepNavigator currentStep={2} application={app} />

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
              <p className="text-xs text-coral-100 mb-1">应扣费用合计</p>
              <p className="font-serif text-2xl font-semibold money-text">
                {formatCurrency(currentTotalDeduction)}
              </p>
            </div>
            <div className="card p-5 bg-gradient-to-br from-sage-500 to-sage-700 text-white">
              <p className="text-xs text-sage-100 mb-1">应退还金额</p>
              <p className="font-serif text-2xl font-semibold money-text">
                {formatCurrency(currentRefund)}
              </p>
            </div>
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-2">
            <SectionHeader
              id="rent"
              icon={Calculator}
              title="租金结算"
              amount={cost.rentSettlement.amount}
            />
            {expandedSections.has('rent') && (
              <div className="px-4 pb-4 pt-2 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="label-field">实际占用天数</label>
                    <input
                      type="number"
                      className="input-field"
                      value={cost.rentSettlement.occupationDays}
                      onChange={(e) =>
                        updateRent({
                          occupationDays: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-field">日租金（元）</label>
                    <input
                      type="number"
                      className="input-field"
                      value={cost.rentSettlement.dailyRent}
                      onChange={(e) =>
                        updateRent({
                          dailyRent: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-field">结算金额</label>
                    <div className="input-field bg-navy-50 font-mono font-semibold text-navy-800">
                      {formatCurrency(cost.rentSettlement.amount)}
                    </div>
                  </div>
                  <div>
                    <label className="label-field">计算期间</label>
                    <input
                      className="input-field text-xs"
                      value={cost.rentSettlement.period}
                      onChange={(e) => updateRent({ period: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label-field">计算依据</label>
                  <textarea
                    className="input-field min-h-[80px] resize-none text-sm bg-amber-50/50 border-amber-200"
                    value={cost.rentSettlement.basis}
                    onChange={(e) => updateRent({ basis: e.target.value })}
                  />
                </div>
                <div className="p-4 rounded-lg bg-navy-50 border border-navy-100">
                  <p className="text-xs text-navy-500 mb-1">计算公式</p>
                  <p className="text-sm font-mono text-navy-800">
                    实际占用天数 {cost.rentSettlement.occupationDays} 天 × 日租金{' '}
                    {formatCurrency(cost.rentSettlement.dailyRent)} ={' '}
                    <span className="font-semibold text-coral-600">
                      {formatCurrency(cost.rentSettlement.amount)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-3">
            <SectionHeader
              id="utility"
              icon={Zap}
              title="水电费用"
              amount={cost.utilityFees.reduce((sum, u) => sum + u.amount, 0)}
            />
            {expandedSections.has('utility') && (
              <div className="px-4 pb-4 pt-2 space-y-6 animate-fade-in">
                {cost.utilityFees.map((utility, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-navy-100 bg-white"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      {utility.type === 'electricity' ? (
                        <Zap className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Droplets className="w-4 h-4 text-sky-500" />
                      )}
                      <span className="font-medium text-navy-800">
                        {utility.type === 'electricity' ? '电费' : '水费'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="label-field">上次读数</label>
                        <input
                          type="number"
                          className="input-field"
                          value={utility.previousReading}
                          onChange={(e) =>
                            updateUtility(idx, {
                              previousReading: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="label-field">本次读数</label>
                        <input
                          type="number"
                          className="input-field"
                          value={utility.currentReading}
                          onChange={(e) =>
                            updateUtility(idx, {
                              currentReading: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="label-field">
                          单价（元/{utility.type === 'electricity' ? '度' : '吨'}）
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-field"
                          value={utility.unitPrice}
                          onChange={(e) =>
                            updateUtility(idx, {
                              unitPrice: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="label-field">应缴金额</label>
                        <div className="input-field bg-navy-50 font-mono font-semibold text-navy-800">
                          {formatCurrency(utility.amount)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-navy-50 text-sm">
                      <span className="text-navy-500">计算过程：</span>
                      <span className="font-mono text-navy-800">
                        ({utility.currentReading} - {utility.previousReading}) × {utility.unitPrice} ={' '}
                        <span className="font-semibold text-coral-600">
                          {formatCurrency(utility.amount)}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-4">
            <div className="flex items-center justify-between">
              <SectionHeader
                id="repair"
                icon={Wrench}
                title="维修费用"
                amount={cost.repairFees.reduce((sum, r) => sum + r.quotedAmount, 0)}
              />
              <button
                onClick={addRepair}
                className="mr-4 inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy-800"
              >
                <Plus className="w-3.5 h-3.5" />
                添加维修项
              </button>
            </div>
            {expandedSections.has('repair') && (
              <div className="px-4 pb-4 pt-2 space-y-4 animate-fade-in">
                {cost.repairFees.length === 0 ? (
                  <div className="text-center py-8 text-navy-400">
                    <Wrench className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>暂无维修费用</p>
                  </div>
                ) : (
                  cost.repairFees.map((repair, idx) => (
                    <div
                      key={repair.id}
                      className="p-4 rounded-lg border border-navy-100 bg-white relative group"
                    >
                      <button
                        onClick={() => removeRepair(idx)}
                        className="absolute top-3 right-3 w-7 h-7 rounded flex items-center justify-center text-navy-300 hover:text-coral-500 hover:bg-coral-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="label-field">维修项目</label>
                          <input
                            className="input-field"
                            value={repair.itemName}
                            onChange={(e) =>
                              updateRepair(idx, { itemName: e.target.value })
                            }
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="label-field">损坏描述</label>
                          <textarea
                            className="input-field min-h-[60px] resize-none text-sm"
                            value={repair.damageDescription}
                            onChange={(e) =>
                              updateRepair(idx, {
                                damageDescription: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="label-field">维修报价（元）</label>
                          <input
                            type="number"
                            className="input-field"
                            value={repair.quotedAmount}
                            onChange={(e) =>
                              updateRepair(idx, {
                                quotedAmount: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="label-field">扣减依据</label>
                          <input
                            className="input-field text-sm"
                            value={repair.basis}
                            onChange={(e) =>
                              updateRepair(idx, { basis: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {cost.penaltyFee && (
            <div className="card p-6 animate-fade-in-up opacity-0 stagger-5">
              <SectionHeader
                id="penalty"
                icon={AlertTriangle}
                title="违约金"
                amount={cost.penaltyFee.amount}
              />
              {expandedSections.has('penalty') && (
                <div className="px-4 pb-4 pt-2 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label-field">违约条款</label>
                      <input
                        className="input-field"
                        value={cost.penaltyFee.clause}
                        onChange={(e) => updatePenalty({ clause: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label-field">违约天数</label>
                      <input
                        type="number"
                        className="input-field"
                        value={cost.penaltyFee.defaultDays}
                        onChange={(e) =>
                          updatePenalty({
                            defaultDays: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="label-field">违约金金额（元）</label>
                      <input
                        type="number"
                        className="input-field"
                        value={cost.penaltyFee.amount}
                        onChange={(e) =>
                          updatePenalty({
                            amount: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-field">计算公式说明</label>
                    <input
                      className="input-field"
                      value={cost.penaltyFee.formula}
                      onChange={(e) => updatePenalty({ formula: e.target.value })}
                      placeholder="如：违约天数 × 月租金 × 约定比例"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card p-6 animate-fade-in-up opacity-0 stagger-6">
            <SectionHeader
              id="deductions"
              icon={FileText}
              title="押金扣减明细"
              amount={cost.totalDeduction}
            />
            {expandedSections.has('deductions') && (
              <div className="px-4 pb-4 pt-2 animate-fade-in">
                <button
                  onClick={regenerateDeductions}
                  className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded bg-navy-100 text-navy-700 hover:bg-navy-200 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  重新生成扣减明细
                </button>

                {cost.deductions.length === 0 ? (
                  <div className="text-center py-8 text-navy-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>点击上方按钮生成扣减明细</p>
                  </div>
                ) : (
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
                        {cost.deductions.map((d) => (
                          <tr
                            key={d.id}
                            className="border-b border-navy-50 hover:bg-navy-50/50"
                          >
                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-0.5 text-xs rounded bg-navy-100 text-navy-700">
                                {DEDUCTION_CATEGORY_LABELS[d.category]}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-navy-800 font-medium">
                              {d.itemName}
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
                        ))}
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
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 sticky top-6 animate-fade-in-up opacity-0 stagger-4">
            <h3 className="font-serif text-base font-semibold text-navy-800 mb-4">
              核算信息
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="label-field">核算人</label>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-navy-400" strokeWidth={2} />
                  <input
                    className="input-field"
                    value={cost.preparedBy}
                    onChange={(e) =>
                      setCost((prev) => prev ? { ...prev, preparedBy: e.target.value } : prev)
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label-field">核算日期</label>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-navy-400" strokeWidth={2} />
                  <input
                    type="date"
                    className="input-field"
                    value={cost.preparedAt}
                    onChange={(e) =>
                      setCost((prev) => prev ? { ...prev, preparedAt: e.target.value } : prev)
                    }
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-navy-100 space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-navy-500">租金结算</span>
                  <span className="money-text text-navy-800 font-medium">
                    {formatCurrency(cost.rentSettlement.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-navy-500">水电费用</span>
                  <span className="money-text text-navy-800 font-medium">
                    {formatCurrency(
                      cost.utilityFees.reduce((sum, u) => sum + u.amount, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-navy-500">维修费用</span>
                  <span className="money-text text-navy-800 font-medium">
                    {formatCurrency(
                      cost.repairFees.reduce((sum, r) => sum + r.quotedAmount, 0)
                    )}
                  </span>
                </div>
                {cost.penaltyFee && (
                  <div className="flex justify-between py-2">
                    <span className="text-navy-500">违约金</span>
                    <span className="money-text text-navy-800 font-medium">
                      {formatCurrency(cost.penaltyFee.amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-navy-100 mt-2 pt-4">
                  <span className="text-navy-600 font-medium">应扣费用合计</span>
                  <span className="font-serif text-lg font-semibold text-coral-600 money-text">
                    {formatCurrency(currentTotalDeduction)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-navy-600 font-medium">应退还金额</span>
                  <span className="font-serif text-xl font-semibold text-sage-600 money-text">
                    {formatCurrency(currentRefund)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-navy-100 space-y-3">
              <button
                onClick={handleSave}
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {submitting ? '提交中...' : '保存费用明细'}
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  navigate(`/application/${app.id}`);
                }}
                className="btn-secondary w-full"
              >
                跳过，直接发送确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
