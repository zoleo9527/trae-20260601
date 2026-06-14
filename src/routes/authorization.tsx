import { useState, useMemo } from 'react';
import { useLoaderData, useActionData, Form, useNavigation, Link, useSearchParams } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { requireUser } from '../utils/session.server';
import { getAuthReviewList, createAuthReview } from '../utils/business.server';
import {
  getRoleName, getBlockedReason, getHandlerInfo, formatAmount,
  getWaitMinutes, formatWaitTime, getAuthReviewSummary, filterAuthCases,
  type AuthFilterType, isTimeoutCase, isEscalatedCase, isFirstAuthCase, isHighPriorityCase
} from '../utils/display';
import { STATUS_LABELS, AUTHORIZATION_RESULT_LABELS, AUTHORIZATION_RESULT_COLORS } from '../utils/constants';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { BusinessStatus } from '@prisma/client';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const cases = await getAuthReviewList(user.id, user.role);

  const stats = {
    total: cases.length,
    escalated: cases.filter(isEscalatedCase).length,
    waiting: cases.filter(isFirstAuthCase).length,
    priority: cases.filter(isHighPriorityCase).length,
    timeout: cases.filter(c => isTimeoutCase(c)).length,
  };

  return json({ user, cases, stats });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  if (user.role !== 'OPERATION_SUPERVISOR') {
    return json({ success: false, message: '无权操作' }, { status: 403 });
  }

  const formData = await request.formData();
  const caseId = formData.get('caseId') as string;
  const actionType = formData.get('actionType') as string;
  const reason = formData.get('reason') as string;
  const note = (formData.get('note') as string) || undefined;
  const reviewLevel = parseInt((formData.get('reviewLevel') as string) || '1');

  invariant(caseId, 'caseId is required');
  invariant(reason, '请填写处理原因');

  const resultMap: Record<string, 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED'> = {
    AUTH_APPROVE: 'APPROVED',
    AUTH_REJECT: 'REJECTED',
    AUTH_RETURN: 'RETURNED',
    AUTH_ESCALATE: 'ESCALATED',
  };

  try {
    await createAuthReview(caseId, user.id, resultMap[actionType], reason, note, reviewLevel);
    return json({ success: true, message: '授权处理完成' });
  } catch (error: any) {
    return json({ success: false, message: error.message || '处理失败' }, { status: 400 });
  }
}

export default function AuthorizationPage() {
  const { user, cases, stats } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = (searchParams.get('filter') as AuthFilterType) || 'all';

  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<{ caseId: string; type: string } | null>(null);

  const isSupervisor = user.role === 'OPERATION_SUPERVISOR';

  const filteredCases = useMemo(() => filterAuthCases(cases, activeFilter), [cases, activeFilter]);

  const filterTabs: { key: AuthFilterType; label: string; count: number; color: string }[] = [
    { key: 'all', label: '全部', count: stats.total, color: 'slate' },
    { key: 'first', label: '首次授权', count: stats.waiting, color: 'blue' },
    { key: 'escalated', label: '升级复核', count: stats.escalated, color: 'orange' },
    { key: 'timeout', label: '超时等待', count: stats.timeout, color: 'red' },
    { key: 'priority', label: '高优先级', count: stats.priority, color: 'rose' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">授权复核中心</h1>
          <p className="text-slate-500 mt-1">
            {isSupervisor ? '待处理授权业务列表' : '当前无授权权限，请使用运营主管账号登录'}
          </p>
        </div>
        {!isSupervisor && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm">
            ⚠️ 当前账号无授权权限
          </div>
        )}
      </div>

      {actionData && (
        <div className={`p-4 rounded-lg border ${
          actionData.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionData.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBox title="待授权总数" value={stats.total} color="amber" />
        <StatBox title="首次授权" value={stats.waiting} color="blue" />
        <StatBox title="升级复核" value={stats.escalated} color="orange" />
        <StatBox title="超时等待" value={stats.timeout} color="red" />
        <StatBox title="高优先级" value={stats.priority} color="rose" />
      </div>

      <div className="card p-2">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map(tab => {
            const isActive = activeFilter === tab.key;
            const colorMap: Record<string, string> = {
              slate: isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              blue: isActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
              orange: isActive ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
              red: isActive ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
              rose: isActive ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
            };
            return (
              <button
                key={tab.key}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  if (tab.key === 'all') {
                    params.delete('filter');
                  } else {
                    params.set('filter', tab.key);
                  }
                  setSearchParams(params);
                  setExpandedCase(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${colorMap[tab.color]}`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-white/20' : 'bg-white'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!isSupervisor ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-slate-600 mb-2">仅运营主管可处理授权复核业务</p>
          <p className="text-sm text-slate-500">请使用 supervisor01 / 123456 账号登录</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-600">
            {activeFilter === 'all' ? '暂无待授权业务' : '此筛选条件下暂无待处理业务'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((businessCase: any) => {
            const isExpanded = expandedCase === businessCase.id;
            const authPendingMinutes = getWaitMinutes(businessCase);
            const blockedReason = getBlockedReason(businessCase);
            const handler = getHandlerInfo(businessCase);
            const lastAuthReview = businessCase.authReviews[0];
            const authSummary = getAuthReviewSummary(businessCase);
            const currentLevel = lastAuthReview?.result === 'ESCALATED'
              ? lastAuthReview.reviewLevel + 1
              : 1;

            return (
              <div key={businessCase.id} className="card overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedCase(isExpanded ? null : businessCase.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="font-semibold text-slate-800">{businessCase.caseNumber}</span>
                        </div>
                        <span className="badge bg-amber-100 text-amber-700">
                          {STATUS_LABELS[businessCase.status as BusinessStatus]}
                        </span>
                        {businessCase.priority > 0 && (
                          <span className="badge bg-red-100 text-red-700">
                            优先级 {businessCase.priority}
                          </span>
                        )}
                        <span className={`badge ${currentLevel > 1 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {currentLevel}级授权
                        </span>
                        {authPendingMinutes > 30 && (
                          <span className="badge bg-red-100 text-red-700">
                            等待{formatWaitTime(authPendingMinutes)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">业务类型：</span>
                          <span className="font-medium text-slate-700">{businessCase.businessType}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">客户：</span>
                          <span className="font-medium text-slate-700">{businessCase.customer.name}</span>
                          <span className="text-xs text-amber-600 ml-1">({businessCase.customer.customerLevel})</span>
                        </div>
                        {businessCase.amount != null && (
                          <div>
                            <span className="text-slate-500">金额：</span>
                            <span className="font-bold text-slate-800">¥{formatAmount(businessCase.amount)}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-500">处理人：</span>
                          <span className="font-medium text-slate-700">{handler}</span>
                        </div>
                      </div>
                      {blockedReason && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <p className="text-sm text-amber-800">
                            <span className="font-medium">卡在哪里：</span>{blockedReason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500 mb-1">提交授权时间</p>
                      <p className="text-sm font-medium text-slate-700">
                        {businessCase.authPendingAt
                          ? format(new Date(businessCase.authPendingAt), 'MM-dd HH:mm', { locale: zhCN })
                          : '-'}
                      </p>
                      {authPendingMinutes > 0 && (
                        <p className={`text-xs mt-1 ${authPendingMinutes > 30 ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          等待 {formatWaitTime(authPendingMinutes)}
                        </p>
                      )}
                      <svg
                        className={`w-5 h-5 text-slate-400 mt-3 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        {authSummary && (
                          <div className={`rounded-lg border p-4 ${
                            authSummary.type === 'escalated'
                              ? 'bg-orange-50 border-orange-200'
                              : 'bg-amber-50 border-amber-200'
                          }`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                authSummary.type === 'escalated'
                                  ? 'bg-orange-100 text-orange-600'
                                  : 'bg-amber-100 text-amber-600'
                              }`}>
                                {authSummary.type === 'escalated' ? '↑' : '←'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold mb-1 ${
                                  authSummary.type === 'escalated'
                                    ? 'text-orange-800'
                                    : 'text-amber-800'
                                }`}>
                                  {authSummary.type === 'escalated' ? '最近升级原因' : '最近退回原因'}
                                </p>
                                <p className="text-sm text-slate-700">{authSummary.text}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {businessCase.documentCheck && (
                          <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <h4 className="font-semibold text-slate-800 mb-3">资料检查</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <DocCheck label="身份证复印件" ok={businessCase.documentCheck.idCardCopy} />
                              <DocCheck label="身份证原件" ok={businessCase.documentCheck.idCardOriginal} />
                              <DocCheck label="户口簿" ok={businessCase.documentCheck.accountBook} />
                              <DocCheck label="住址证明" ok={businessCase.documentCheck.proofOfAddress} />
                              <DocCheck label="收入证明" ok={businessCase.documentCheck.incomeProof} />
                            </div>
                            {businessCase.documentCheck.issues.length > 0 && (
                              <p className="text-xs text-amber-600 mt-2">
                                ⚠️ 资料问题：{businessCase.documentCheck.issueNote}
                              </p>
                            )}
                          </div>
                        )}

                        {businessCase.dueDiligence && (
                          <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <h4 className="font-semibold text-slate-800 mb-3">尽调审查</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-slate-500 text-xs">风险等级：</span>
                                <span className={`font-medium ml-1 ${
                                  businessCase.dueDiligence.riskLevel === '高' ? 'text-red-600' :
                                  businessCase.dueDiligence.riskLevel === '中' ? 'text-amber-600' :
                                  'text-green-600'
                                }`}>
                                  {businessCase.dueDiligence.riskLevel}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs">PEP：</span>
                                <span className="font-medium ml-1">{businessCase.dueDiligence.pepCheck ? '已通过' : '待查'}</span>
                              </div>
                              {businessCase.dueDiligence.sourceOfFunds && (
                                <div>
                                  <span className="text-slate-500 text-xs">资金来源：</span>
                                  <span className="font-medium ml-1">{businessCase.dueDiligence.sourceOfFunds}</span>
                                </div>
                              )}
                              {businessCase.dueDiligence.purpose && (
                                <div>
                                  <span className="text-slate-500 text-xs">用途：</span>
                                  <span className="font-medium ml-1">{businessCase.dueDiligence.purpose}</span>
                                </div>
                              )}
                            </div>
                            {businessCase.dueDiligence.needsSupplement && (
                              <p className="text-xs text-orange-600 mt-2">
                                📋 需补件：{businessCase.dueDiligence.supplementNote}
                              </p>
                            )}
                          </div>
                        )}

                        {businessCase.authReviews.length > 0 && (
                          <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <h4 className="font-semibold text-slate-800 mb-3">授权历史</h4>
                            <div className="space-y-3">
                              {businessCase.authReviews.map((review: any) => (
                                <div key={review.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                  <span className={`badge flex-shrink-0 ${AUTHORIZATION_RESULT_COLORS[review.result as keyof typeof AUTHORIZATION_RESULT_COLORS]}`}>
                                    {AUTHORIZATION_RESULT_LABELS[review.result as keyof typeof AUTHORIZATION_RESULT_LABELS]}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-700">{review.reason}</p>
                                    {review.note && <p className="text-xs text-slate-500 mt-1">{review.note}</p>}
                                    <p className="text-xs text-slate-400 mt-1">
                                      {getRoleName(review.reviewedBy.role)} {review.reviewedBy.name} ·
                                      {format(new Date(review.reviewedAt), ' MM-dd HH:mm', { locale: zhCN })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {businessCase.timeline?.length > 0 && (
                          <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <h4 className="font-semibold text-slate-800 mb-3">最近动态</h4>
                            <div className="space-y-2">
                              {businessCase.timeline.slice(0, 5).map((event: any) => (
                                <div key={event.id} className="flex items-center gap-3 text-sm">
                                  <span className="text-slate-400 text-xs whitespace-nowrap">
                                    {format(new Date(event.createdAt), 'HH:mm')}
                                  </span>
                                  <span className="text-slate-700">{event.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Link
                          to={`/cases/${businessCase.id}`}
                          className="btn-secondary w-full justify-center"
                        >
                          查看完整详情 →
                        </Link>

                        {processingAction?.caseId === businessCase.id && processingAction ? (
                          <AuthProcessForm
                            caseId={businessCase.id}
                            actionType={processingAction.type}
                            currentLevel={currentLevel}
                            isSubmitting={isSubmitting}
                            onCancel={() => setProcessingAction(null)}
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => setProcessingAction({ caseId: businessCase.id, type: 'AUTH_APPROVE' })}
                              className="w-full btn-success justify-center py-3"
                            >
                              ✓ 授权通过
                            </button>
                            <button
                              onClick={() => setProcessingAction({ caseId: businessCase.id, type: 'AUTH_RETURN' })}
                              className="w-full btn-warning justify-center py-3"
                            >
                              ← 退回补件
                            </button>
                            <button
                              onClick={() => setProcessingAction({ caseId: businessCase.id, type: 'AUTH_ESCALATE' })}
                              className="w-full justify-center py-3 bg-orange-600 text-white hover:bg-orange-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              ↑ 升级授权
                            </button>
                            <button
                              onClick={() => setProcessingAction({ caseId: businessCase.id, type: 'AUTH_REJECT' })}
                              className="w-full btn-danger justify-center py-3"
                            >
                              ✕ 拒绝授权
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ title, value, color }: { title: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    rose: 'bg-rose-100 text-rose-600',
  };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function DocCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1.5 rounded ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
      {ok ? (
        <svg className="w-3 h-3 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={`${ok ? 'text-green-700' : 'text-red-700'} truncate`}>{label}</span>
    </div>
  );
}

function AuthProcessForm({
  caseId,
  actionType,
  currentLevel,
  isSubmitting,
  onCancel,
}: {
  caseId: string;
  actionType: string;
  currentLevel: number;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  const defaultReasons: Record<string, string> = {
    AUTH_APPROVE: '业务材料齐全，符合规定，同意授权',
    AUTH_RETURN: '请补充完善相关材料后重新提交',
    AUTH_ESCALATE: '业务金额较大或风险较高，需上级复核',
    AUTH_REJECT: '不符合业务办理条件，拒绝授权',
  };

  const actionLabels: Record<string, string> = {
    AUTH_APPROVE: '通过授权',
    AUTH_RETURN: '退回补件',
    AUTH_ESCALATE: '升级授权',
    AUTH_REJECT: '拒绝授权',
  };

  const btnClasses: Record<string, string> = {
    AUTH_APPROVE: 'btn-success',
    AUTH_RETURN: 'btn-warning',
    AUTH_ESCALATE: 'bg-orange-600 text-white hover:bg-orange-700 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    AUTH_REJECT: 'btn-danger',
  };

  return (
    <Form method="post" className="space-y-3 p-4 bg-white rounded-lg border border-slate-200">
      <input type="hidden" name="actionType" value={actionType} />
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="reviewLevel" value={currentLevel} />

      <h5 className="font-semibold text-slate-800 text-sm">
        确认{actionLabels[actionType]}
      </h5>

      <div>
        <label className="label text-xs">处理原因</label>
        <textarea
          name="reason"
          className="input min-h-[80px] text-sm"
          defaultValue={defaultReasons[actionType]}
          required
        />
      </div>

      <div>
        <label className="label text-xs">备注（可选）</label>
        <textarea
          name="note"
          className="input min-h-[50px] text-sm"
          placeholder="补充说明..."
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 justify-center"
          disabled={isSubmitting}
        >
          取消
        </button>
        <button
          type="submit"
          className={`${btnClasses[actionType]} flex-1 justify-center`}
          disabled={isSubmitting}
        >
          {isSubmitting ? '处理中...' : `确认${actionLabels[actionType]}`}
        </button>
      </div>
    </Form>
  );
}
