import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { BusinessCase, Customer, User, DocumentCheck, DueDiligenceRecord, AuthorizationReview, TimelineEvent, QueueTicket, Complaint } from '@prisma/client';
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT_COLORS, DOCUMENT_ISSUE_LABELS, COMPLAINT_TYPE_LABELS, AUTHORIZATION_RESULT_LABELS, AUTHORIZATION_RESULT_COLORS } from '../../utils/constants';
import { getBlockedReason, getHandlerInfo, getRoleName, formatAmount, formatWaitTime } from '../../utils/display';
import Timeline from '../Timeline';

type CaseWithRelations = BusinessCase & {
  customer: Customer;
  queueTicket?: QueueTicket | null;
  assignee?: Pick<User, 'id' | 'name' | 'role' | 'username'> | null;
  acceptor?: Pick<User, 'id' | 'name' | 'role' | 'username'> | null;
  documentCheck?: (DocumentCheck & { checkedBy?: Pick<User, 'id' | 'name' | 'role'> | null }) | null;
  dueDiligence?: (DueDiligenceRecord & { completedBy?: Pick<User, 'id' | 'name' | 'role'> | null }) | null;
  timeline: (TimelineEvent & { createdBy?: Pick<User, 'id' | 'name' | 'role'> | null })[];
  authReviews: (AuthorizationReview & { reviewedBy: Pick<User, 'id' | 'name' | 'role'> })[];
  complaints: (Complaint & { reportedBy: Pick<User, 'id' | 'name' | 'role'> })[];
};

export default function CaseDetailPanel({ businessCase }: { businessCase: CaseWithRelations }) {
  const blockedReason = getBlockedReason(businessCase);
  const handler = getHandlerInfo(businessCase);

  const lastAuthReview = businessCase.authReviews?.[0];
  const authPendingMinutes = businessCase.authPendingAt
    ? Math.floor((Date.now() - new Date(businessCase.authPendingAt).getTime()) / 60000)
    : null;

  const authWaitReason = lastAuthReview
    ? lastAuthReview.result === 'ESCALATED'
      ? `已升级到${lastAuthReview.reviewLevel + 1}级授权：${lastAuthReview.reason}`
      : lastAuthReview.result === 'RETURNED'
        ? `被退回：${lastAuthReview.reason}`
        : `${AUTHORIZATION_RESULT_LABELS[lastAuthReview.result]}：${lastAuthReview.reason}`
    : businessCase.status === 'PENDING_AUTHORIZATION'
      ? '等待运营主管首次授权'
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`status-dot ${STATUS_DOT_COLORS[businessCase.status]}`} />
            <h1 className="text-2xl font-bold text-slate-800">{businessCase.caseNumber}</h1>
            <span className={`badge ${STATUS_COLORS[businessCase.status]} px-3 py-1`}>
              {STATUS_LABELS[businessCase.status]}
            </span>
            {businessCase.priority > 0 && (
              <span className="badge bg-red-100 text-red-700 px-3 py-1">优先级 {businessCase.priority}</span>
            )}
            {businessCase.timeoutWarning && (
              <span className="badge bg-red-100 text-red-700 px-3 py-1">超时预警</span>
            )}
          </div>
          <p className="text-slate-600">{businessCase.businessType}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-slate-500">创建时间</p>
          <p className="font-medium text-slate-700">
            {format(new Date(businessCase.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">谁在处理</h3>
              <p className="text-blue-700">{handler}</p>
            </div>
          </div>
        </div>

        <div className={`${blockedReason ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${blockedReason ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <svg className={`w-5 h-5 ${blockedReason ? 'text-amber-600' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-semibold mb-1 ${blockedReason ? 'text-amber-800' : 'text-slate-800'}`}>卡在哪里</h3>
              <p className={blockedReason ? 'text-amber-700' : 'text-slate-600'}>
                {blockedReason || '流程正常推进中'}
              </p>
            </div>
          </div>
        </div>

        <div className={`${authWaitReason ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${authWaitReason ? 'bg-orange-100' : 'bg-slate-100'}`}>
              <svg className={`w-5 h-5 ${authWaitReason ? 'text-orange-600' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-semibold mb-1 ${authWaitReason ? 'text-orange-800' : 'text-slate-800'}`}>为何未完成</h3>
              <p className={`text-sm ${authWaitReason ? 'text-orange-700' : 'text-slate-600'}`}>
                {authWaitReason || (
                  businessCase.status === 'COMPLETED'
                    ? '业务已完成'
                    : authPendingMinutes
                      ? `授权等待中，已等待 ${authPendingMinutes} 分钟`
                      : '流程正常推进中'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-slate-800">客户与排队信息</h2>
            </div>
            <div className="card-body grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">客户姓名</span>
                <p className="font-medium text-slate-800 mt-1">{businessCase.customer.name}</p>
              </div>
              <div>
                <span className="text-slate-500">客户等级</span>
                <p className="font-medium text-amber-600 mt-1">{businessCase.customer.customerLevel}</p>
              </div>
              <div>
                <span className="text-slate-500">身份证号</span>
                <p className="font-medium text-slate-800 mt-1">{businessCase.customer.idCard}</p>
              </div>
              <div>
                <span className="text-slate-500">联系电话</span>
                <p className="font-medium text-slate-800 mt-1">{businessCase.customer.phone}</p>
              </div>
              {businessCase.queueTicket && (
                <>
                  <div>
                    <span className="text-slate-500">排队号</span>
                    <p className="font-medium text-slate-800 mt-1">{businessCase.queueTicket.ticketNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">业务类型</span>
                    <p className="font-medium text-slate-800 mt-1">{businessCase.queueTicket.businessType}</p>
                  </div>
                </>
              )}
              {businessCase.amount && (
                <div className="col-span-2">
                  <span className="text-slate-500">业务金额</span>
                  <p className="font-bold text-slate-800 text-xl mt-1">
                    ¥{formatAmount(businessCase.amount)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">资料检查</h2>
              {businessCase.documentCheck?.checkedAt && (
                <span className="text-sm text-slate-500">
                  {format(new Date(businessCase.documentCheck.checkedAt), 'MM-dd HH:mm', { locale: zhCN })}
                </span>
              )}
            </div>
            {businessCase.documentCheck ? (
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <DocCheckItem label="身份证复印件" ok={businessCase.documentCheck.idCardCopy} />
                  <DocCheckItem label="身份证原件" ok={businessCase.documentCheck.idCardOriginal} />
                  <DocCheckItem label="户口簿" ok={businessCase.documentCheck.accountBook} />
                  <DocCheckItem label="住址证明" ok={businessCase.documentCheck.proofOfAddress} />
                  <DocCheckItem label="收入证明" ok={businessCase.documentCheck.incomeProof} />
                </div>
                {businessCase.documentCheck.issues.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-amber-800 mb-1">发现问题：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {businessCase.documentCheck.issues.map((issue, i) => (
                        <span key={i} className="badge bg-amber-100 text-amber-700">
                          {DOCUMENT_ISSUE_LABELS[issue]}
                        </span>
                      ))}
                    </div>
                    {businessCase.documentCheck.issueNote && (
                      <p className="text-sm text-amber-700 mt-2">{businessCase.documentCheck.issueNote}</p>
                    )}
                  </div>
                )}
                {businessCase.documentCheck.checkedBy && (
                  <p className="text-xs text-slate-500">
                    检查人：{getRoleName(businessCase.documentCheck.checkedBy.role)} {businessCase.documentCheck.checkedBy.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="card-body text-center text-slate-500 py-8">暂无资料检查记录</div>
            )}
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">尽调审查</h2>
              {businessCase.dueDiligence?.completedAt && (
                <span className="text-sm text-slate-500">
                  {format(new Date(businessCase.dueDiligence.completedAt), 'MM-dd HH:mm', { locale: zhCN })}
                </span>
              )}
            </div>
            {businessCase.dueDiligence ? (
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">风险等级</span>
                    <p className={`font-medium mt-1 ${
                      businessCase.dueDiligence.riskLevel === '高' ? 'text-red-600' :
                      businessCase.dueDiligence.riskLevel === '中' ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {businessCase.dueDiligence.riskLevel}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <CheckItem label="PEP" ok={businessCase.dueDiligence.pepCheck} />
                    <CheckItem label="制裁" ok={businessCase.dueDiligence.sanctionCheck} reverse />
                    <CheckItem label="不良媒体" ok={businessCase.dueDiligence.adverseMedia} reverse />
                  </div>
                  {businessCase.dueDiligence.sourceOfFunds && (
                    <div>
                      <span className="text-slate-500">资金来源</span>
                      <p className="font-medium text-slate-800 mt-1">{businessCase.dueDiligence.sourceOfFunds}</p>
                    </div>
                  )}
                  {businessCase.dueDiligence.purpose && (
                    <div>
                      <span className="text-slate-500">业务用途</span>
                      <p className="font-medium text-slate-800 mt-1">{businessCase.dueDiligence.purpose}</p>
                    </div>
                  )}
                </div>
                {businessCase.dueDiligence.needsSupplement && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-orange-800 mb-1">需要补件</p>
                    <p className="text-sm text-orange-700">
                      {businessCase.dueDiligence.supplementNote || '请联系客户补充相关材料'}
                    </p>
                  </div>
                )}
                {businessCase.dueDiligence.completedBy && (
                  <p className="text-xs text-slate-500">
                    审查人：{getRoleName(businessCase.dueDiligence.completedBy.role)} {businessCase.dueDiligence.completedBy.name}
                  </p>
                )}
              </div>
            ) : (
              <div className="card-body text-center text-slate-500 py-8">暂无尽调审查记录</div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-slate-800">处理时间线</h2>
            </div>
            <div className="card-body">
              {businessCase.timeline.length > 0 ? (
                <Timeline events={businessCase.timeline} />
              ) : (
                <div className="text-center text-slate-500 py-8">暂无时间线记录</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-slate-800">授权复核回看</h2>
            </div>
            <div className="card-body space-y-4">
              {businessCase.authReviews.length > 0 ? (
                <div className="space-y-4">
                  {businessCase.authReviews.map((review, index) => (
                    <div key={review.id} className={`p-4 rounded-lg border ${
                      index === 0 ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`badge ${AUTHORIZATION_RESULT_COLORS[review.result]}`}>
                          {AUTHORIZATION_RESULT_LABELS[review.result]}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(review.reviewedAt), 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="text-slate-500">级别：</span>
                          <span className="font-medium text-slate-700">{review.reviewLevel}级授权</span>
                        </div>
                        <div>
                          <span className="text-slate-500">原因：</span>
                          <p className="text-slate-700 mt-1">{review.reason}</p>
                        </div>
                        {review.note && (
                          <div>
                            <span className="text-slate-500">备注：</span>
                            <p className="text-slate-600 mt-1">{review.note}</p>
                          </div>
                        )}
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-400">
                            {getRoleName(review.reviewedBy.role)} {review.reviewedBy.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-6">暂无授权复核记录</div>
              )}

              {authPendingMinutes !== null && businessCase.status === 'PENDING_AUTHORIZATION' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">等待时长：</span>
                    {authPendingMinutes >= 60
                      ? `${Math.floor(authPendingMinutes / 60)}小时${authPendingMinutes % 60}分钟`
                      : `${authPendingMinutes}分钟`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {businessCase.complaints.length > 0 && (
            <div className="card border-red-200">
              <div className="card-header border-red-200">
                <h2 className="text-lg font-semibold text-red-700">客户投诉</h2>
              </div>
              <div className="card-body space-y-3">
                {businessCase.complaints.map((complaint) => (
                  <div key={complaint.id} className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge bg-red-100 text-red-700">
                        {COMPLAINT_TYPE_LABELS[complaint.type]}
                      </span>
                      <span className="text-xs text-red-500">
                        {format(new Date(complaint.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    <p className="text-sm text-red-700">{complaint.description}</p>
                    {complaint.resolved && complaint.resolution && (
                      <div className="mt-2 pt-2 border-t border-red-100">
                        <p className="text-xs text-red-500">
                          处理结果：{complaint.resolution}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-red-400 mt-2">
                      登记人：{getRoleName(complaint.reportedBy.role)} {complaint.reportedBy.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-slate-800">处理人员</h2>
            </div>
            <div className="card-body space-y-3 text-sm">
              {businessCase.acceptor && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">受理人</span>
                  <div className="text-right">
                    <p className="font-medium text-slate-700">{businessCase.acceptor.name}</p>
                    <p className="text-xs text-slate-400">{getRoleName(businessCase.acceptor.role)}</p>
                  </div>
                </div>
              )}
              {businessCase.assignee && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-slate-500">当前处理人</span>
                  <div className="text-right">
                    <p className="font-medium text-slate-700">{businessCase.assignee.name}</p>
                    <p className="text-xs text-slate-400">{getRoleName(businessCase.assignee.role)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocCheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ok ? 'bg-green-100' : 'bg-red-100'}`}>
        {ok ? (
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${ok ? 'text-green-700' : 'text-red-700'}`}>{label}</span>
    </div>
  );
}

function CheckItem({ label, ok, reverse = false }: { label: string; ok: boolean; reverse?: boolean }) {
  const effectiveOk = reverse ? !ok : ok;
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${effectiveOk ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${effectiveOk ? 'bg-green-100' : 'bg-red-100'}`}>
        {effectiveOk ? (
          <svg className="w-2.5 h-2.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-2.5 h-2.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className={`text-xs ${effectiveOk ? 'text-green-700' : 'text-red-700'}`}>{label}</span>
    </div>
  );
}