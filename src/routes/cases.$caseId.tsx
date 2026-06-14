import { useState } from 'react';
import { useLoaderData, useActionData, Form, useNavigate, useNavigation, Link } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';
import { requireUser } from '../utils/session.server';
import {
  getCaseDetail,
  updateDocumentCheck,
  updateDueDiligence,
  advanceCaseStatus,
  assignCase,
  createAuthReview,
  getBlockedReason,
  getHandlerInfo,
} from '../utils/business.server';
import CaseDetailPanel from '../components/case/CaseDetailPanel';
import { STATUS_LABELS, DOCUMENT_ISSUE_LABELS } from '../utils/constants';
import { getRoleName } from '../utils/session.server';
import type { DocumentIssue, BusinessStatus } from '@prisma/client';
import { prisma } from '../utils/db.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.caseId, 'caseId is required');

  const businessCase = await getCaseDetail(params.caseId);
  if (!businessCase) {
    throw new Response('Not Found', { status: 404 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
  });

  return json({ user, businessCase, users });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.caseId, 'caseId is required');

  const formData = await request.formData();
  const actionType = formData.get('actionType') as string;

  try {
    switch (actionType) {
      case 'ADVANCE_STATUS': {
        const note = formData.get('note') as string | undefined;
        await advanceCaseStatus(params.caseId, user.id, note);
        return json({ success: true, message: '状态已推进' });
      }

      case 'UPDATE_DOCUMENT': {
        const docData = {
          idCardCopy: formData.get('idCardCopy') === 'on',
          idCardOriginal: formData.get('idCardOriginal') === 'on',
          accountBook: formData.get('accountBook') === 'on',
          proofOfAddress: formData.get('proofOfAddress') === 'on',
          incomeProof: formData.get('incomeProof') === 'on',
          otherDocs: (formData.get('otherDocs') as string) || undefined,
          issues: formData.getAll('issues') as DocumentIssue[],
          issueNote: (formData.get('issueNote') as string) || undefined,
        };
        await updateDocumentCheck(params.caseId, user.id, docData);
        return json({ success: true, message: '资料检查已更新' });
      }

      case 'UPDATE_DUE_DILIGENCE': {
        const dueData = {
          riskLevel: (formData.get('riskLevel') as string) || '低',
          pepCheck: formData.get('pepCheck') === 'on',
          sanctionCheck: formData.get('sanctionCheck') === 'on',
          adverseMedia: formData.get('adverseMedia') === 'on',
          sourceOfFunds: (formData.get('sourceOfFunds') as string) || undefined,
          purpose: (formData.get('purpose') as string) || undefined,
          needsSupplement: formData.get('needsSupplement') === 'on',
          supplementNote: (formData.get('supplementNote') as string) || undefined,
        };
        await updateDueDiligence(params.caseId, user.id, dueData);
        return json({ success: true, message: '尽调审查已更新' });
      }

      case 'ASSIGN_CASE': {
        const assigneeId = formData.get('assigneeId') as string;
        invariant(assigneeId, 'assigneeId is required');
        await assignCase(params.caseId, user.id, assigneeId);
        return json({ success: true, message: '已分配处理人' });
      }

      case 'AUTH_APPROVE':
      case 'AUTH_REJECT':
      case 'AUTH_RETURN':
      case 'AUTH_ESCALATE': {
        const resultMap: Record<string, 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED'> = {
          AUTH_APPROVE: 'APPROVED',
          AUTH_REJECT: 'REJECTED',
          AUTH_RETURN: 'RETURNED',
          AUTH_ESCALATE: 'ESCALATED',
        };
        const reason = formData.get('reason') as string;
        const note = (formData.get('note') as string) || undefined;
        const reviewLevel = parseInt((formData.get('reviewLevel') as string) || '1');
        invariant(reason, '请填写处理原因');
        await createAuthReview(params.caseId, user.id, resultMap[actionType], reason, note, reviewLevel);
        return json({ success: true, message: '授权处理完成' });
      }

      default:
        return json({ success: false, message: '未知操作类型' }, { status: 400 });
    }
  } catch (error: any) {
    return json({ success: false, message: error.message || '操作失败' }, { status: 400 });
  }
}

export default function CaseDetailPage() {
  const { user, businessCase: _businessCase, users } = useLoaderData<typeof loader>();
  const businessCase = _businessCase as any;
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [activeTab, setActiveTab] = useState<'action' | 'document' | 'due' | 'auth' | 'assign'>('action');

  const canAdvance = ['QUEUED', 'ACCEPTED', 'DOCUMENT_CHECKING', 'DUE_DILIGENCE', 'PROCESSING', 'PENDING_AUTHORIZATION', 'AUTHORIZED'].includes(businessCase.status);
  const canDoAuth = user.role === 'OPERATION_SUPERVISOR' && ['PENDING_AUTHORIZATION', 'AUTHORIZATION_REVIEW'].includes(businessCase.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/cases"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回列表
        </Link>
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

      <CaseDetailPanel businessCase={businessCase as any} />

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-slate-800">业务操作</h2>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
            <TabButton active={activeTab === 'action'} onClick={() => setActiveTab('action')}>
              状态流转
            </TabButton>
            <TabButton active={activeTab === 'document'} onClick={() => setActiveTab('document')}>
              资料检查
            </TabButton>
            <TabButton active={activeTab === 'due'} onClick={() => setActiveTab('due')}>
              尽调审查
            </TabButton>
            {canDoAuth && (
              <TabButton active={activeTab === 'auth'} onClick={() => setActiveTab('auth')}>
                授权复核
              </TabButton>
            )}
            <TabButton active={activeTab === 'assign'} onClick={() => setActiveTab('assign')}>
              分配处理
            </TabButton>
          </div>

          {activeTab === 'action' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-2">
                  <span className="font-medium">当前状态：</span>
                  {STATUS_LABELS[businessCase.status as BusinessStatus]}
                </p>
                <p className="text-sm text-slate-500">
                  推进到下一状态将自动记录时间线
                </p>
              </div>

              <Form method="post" className="space-y-4">
                <input type="hidden" name="actionType" value="ADVANCE_STATUS" />
                <div>
                  <label className="label">备注说明（可选）</label>
                  <textarea
                    name="note"
                    className="input min-h-[80px]"
                    placeholder="填写本次操作的备注说明..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canAdvance || isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? '处理中...' : '推进到下一状态'}
                </button>
              </Form>
            </div>
          )}

          {activeTab === 'document' && (
            <Form method="post" className="space-y-6">
              <input type="hidden" name="actionType" value="UPDATE_DOCUMENT" />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <CheckboxField
                  name="idCardCopy"
                  label="身份证复印件"
                  defaultChecked={businessCase.documentCheck?.idCardCopy}
                />
                <CheckboxField
                  name="idCardOriginal"
                  label="身份证原件"
                  defaultChecked={businessCase.documentCheck?.idCardOriginal}
                />
                <CheckboxField
                  name="accountBook"
                  label="户口簿"
                  defaultChecked={businessCase.documentCheck?.accountBook}
                />
                <CheckboxField
                  name="proofOfAddress"
                  label="住址证明"
                  defaultChecked={businessCase.documentCheck?.proofOfAddress}
                />
                <CheckboxField
                  name="incomeProof"
                  label="收入证明"
                  defaultChecked={businessCase.documentCheck?.incomeProof}
                />
              </div>

              <div>
                <label className="label">其他资料说明</label>
                <input
                  type="text"
                  name="otherDocs"
                  className="input"
                  defaultValue={businessCase.documentCheck?.otherDocs || ''}
                  placeholder="其他需要说明的资料..."
                />
              </div>

              <div>
                <label className="label">发现问题（可多选）</label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(DOCUMENT_ISSUE_LABELS).map(([key, label]) => (
                    <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="issues"
                        value={key}
                        defaultChecked={businessCase.documentCheck?.issues?.includes(key as DocumentIssue)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">问题说明</label>
                <textarea
                  name="issueNote"
                  className="input min-h-[80px]"
                  defaultValue={businessCase.documentCheck?.issueNote || ''}
                  placeholder="详细描述资料问题..."
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? '保存中...' : '保存资料检查结果'}
              </button>
            </Form>
          )}

          {activeTab === 'due' && (
            <Form method="post" className="space-y-6">
              <input type="hidden" name="actionType" value="UPDATE_DUE_DILIGENCE" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">风险等级</label>
                  <select
                    name="riskLevel"
                    className="input"
                    defaultValue={businessCase.dueDiligence?.riskLevel || '低'}
                  >
                    <option value="低">低风险</option>
                    <option value="中">中风险</option>
                    <option value="高">高风险</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label mb-2">合规检查</label>
                <div className="grid grid-cols-3 gap-4">
                  <CheckboxField
                    name="pepCheck"
                    label="PEP检查通过"
                    defaultChecked={businessCase.dueDiligence?.pepCheck}
                  />
                  <CheckboxField
                    name="sanctionCheck"
                    label="无制裁记录"
                    defaultChecked={businessCase.dueDiligence?.sanctionCheck}
                  />
                  <CheckboxField
                    name="adverseMedia"
                    label="无不良媒体"
                    defaultChecked={businessCase.dueDiligence?.adverseMedia}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">资金来源</label>
                  <input
                    type="text"
                    name="sourceOfFunds"
                    className="input"
                    defaultValue={businessCase.dueDiligence?.sourceOfFunds || ''}
                    placeholder="如：工资收入、投资收益等"
                  />
                </div>
                <div>
                  <label className="label">业务用途</label>
                  <input
                    type="text"
                    name="purpose"
                    className="input"
                    defaultValue={businessCase.dueDiligence?.purpose || ''}
                    placeholder="业务办理用途说明"
                  />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <CheckboxField
                  name="needsSupplement"
                  label="需要客户补充材料"
                  defaultChecked={businessCase.dueDiligence?.needsSupplement}
                />
                <div className="mt-3">
                  <label className="label">补件说明</label>
                  <textarea
                    name="supplementNote"
                    className="input min-h-[80px]"
                    defaultValue={businessCase.dueDiligence?.supplementNote || ''}
                    placeholder="说明需要客户补充哪些材料..."
                  />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? '保存中...' : '保存尽调审查结果'}
              </button>
            </Form>
          )}

          {activeTab === 'auth' && canDoAuth && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <AuthOptionButton
                  actionType="AUTH_APPROVE"
                  label="通过"
                  description="授权通过，业务继续"
                  color="green"
                  defaultReason="业务材料齐全，符合规定，同意授权"
                />
                <AuthOptionButton
                  actionType="AUTH_RETURN"
                  label="退回"
                  description="退回补充材料"
                  color="amber"
                  defaultReason="请补充完善相关材料后重新提交"
                />
                <AuthOptionButton
                  actionType="AUTH_ESCALATE"
                  label="升级"
                  description="升级上级授权"
                  color="orange"
                  defaultReason="业务金额较大或风险较高，需上级复核"
                />
                <AuthOptionButton
                  actionType="AUTH_REJECT"
                  label="拒绝"
                  description="拒绝本次授权"
                  color="red"
                  defaultReason="不符合业务办理条件，拒绝授权"
                />
              </div>
            </div>
          )}

          {activeTab === 'assign' && (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="actionType" value="ASSIGN_CASE" />

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">当前处理人：</span>
                  {businessCase.assignee
                    ? `${getRoleName(businessCase.assignee.role as any)} ${businessCase.assignee.name}`
                    : '暂未分配'}
                </p>
              </div>

              <div>
                <label className="label">选择处理人</label>
                <select name="assigneeId" className="input" defaultValue={businessCase.assignee?.id || ''}>
                  <option value="">请选择处理人</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {getRoleName(u.role as any)} - {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? '分配中...' : '分配处理人'}
              </button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function CheckboxField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

function AuthOptionButton({
  actionType,
  label,
  description,
  color,
  defaultReason,
}: {
  actionType: string;
  label: string;
  description: string;
  color: 'green' | 'amber' | 'orange' | 'red';
  defaultReason: string;
}) {
  const [open, setOpen] = useState(false);

  const colorClasses: Record<string, string> = {
    green: 'border-green-300 hover:bg-green-50 hover:border-green-400',
    amber: 'border-amber-300 hover:bg-amber-50 hover:border-amber-400',
    orange: 'border-orange-300 hover:bg-orange-50 hover:border-orange-400',
    red: 'border-red-300 hover:bg-red-50 hover:border-red-400',
  };

  const btnClasses: Record<string, string> = {
    green: 'btn-success',
    amber: 'btn-warning',
    orange: 'bg-orange-600 text-white hover:bg-orange-700 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    red: 'btn-danger',
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${colorClasses[color]}`}
      >
        <p className="font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </button>

      {open && (
        <Form method="post" className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <input type="hidden" name="actionType" value={actionType} />
          <input type="hidden" name="reviewLevel" value="1" />
          <div>
            <label className="label">处理原因</label>
            <textarea
              name="reason"
              className="input min-h-[80px]"
              defaultValue={defaultReason}
              required
            />
          </div>
          <div>
            <label className="label">备注（可选）</label>
            <textarea
              name="note"
              className="input min-h-[60px]"
              placeholder="补充说明..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="submit" className={btnClasses[color]}>
              确认{label}
            </button>
          </div>
        </Form>
      )}
    </div>
  );
}
