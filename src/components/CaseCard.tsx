import { Link } from '@remix-run/react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { BusinessCase, Customer, User, DocumentCheck, DueDiligenceRecord, AuthorizationReview, TimelineEvent } from '@prisma/client';
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT_COLORS, DOCUMENT_ISSUE_LABELS } from '../utils/constants';
import { getBlockedReason, getHandlerInfo } from '../utils/business.server';
import { getRoleName } from '../utils/session.server';

type CaseWithRelations = BusinessCase & {
  customer: Customer;
  assignee?: Pick<User, 'id' | 'name' | 'role'> | null;
  acceptor?: Pick<User, 'id' | 'name' | 'role'> | null;
  documentCheck?: DocumentCheck | null;
  dueDiligence?: DueDiligenceRecord | null;
  authReviews?: AuthorizationReview[];
  timeline?: TimelineEvent[];
  complaints?: any[];
};

export default function CaseCard({ businessCase, showHandler = true, showBlocked = true }: { businessCase: CaseWithRelations; showHandler?: boolean; showBlocked?: boolean }) {
  const blockedReason = getBlockedReason(businessCase);
  const handler = getHandlerInfo(businessCase);

  const hasDocumentIssues = businessCase.documentCheck?.issues && businessCase.documentCheck.issues.length > 0;
  const hasDueDiligenceIssues = businessCase.dueDiligence?.needsSupplement;
  const hasComplaints = businessCase.complaints && businessCase.complaints.length > 0;
  const hasTimeout = businessCase.status === 'TIMEOUT' || businessCase.timeoutWarning;

  const alerts = [];
  if (hasDocumentIssues) alerts.push({ type: 'document', text: '资料缺页' });
  if (hasDueDiligenceIssues) alerts.push({ type: 'due', text: '尽调补件' });
  if (hasTimeout) alerts.push({ type: 'timeout', text: '业务超时' });
  if (hasComplaints) alerts.push({ type: 'complaint', text: '客户投诉' });

  return (
    <Link to={`/cases/${businessCase.id}`} className="block">
      <div className="card hover:shadow-md transition-shadow p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`status-dot ${STATUS_DOT_COLORS[businessCase.status]}`} />
              <span className="font-medium text-slate-800">{businessCase.caseNumber}</span>
              <span className={`badge ${STATUS_COLORS[businessCase.status]}`}>
                {STATUS_LABELS[businessCase.status]}
              </span>
            </div>
            <div className="text-sm text-slate-600">{businessCase.businessType}</div>
          </div>
          {businessCase.priority > 0 && (
            <span className="badge bg-red-100 text-red-700">
              优先级 {businessCase.priority}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <span className="text-slate-500">客户：</span>
            <span className="font-medium text-slate-700">{businessCase.customer.name}</span>
          </div>
          <div>
            <span className="text-slate-500">等级：</span>
            <span className="font-medium text-amber-600">{businessCase.customer.customerLevel}</span>
          </div>
          {businessCase.amount && (
            <div className="col-span-2">
              <span className="text-slate-500">金额：</span>
              <span className="font-semibold text-slate-800">¥{businessCase.amount.toNumber().toLocaleString()}</span>
            </div>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {alerts.map((alert, index) => (
              <span
                key={index}
                className={`badge ${
                  alert.type === 'document' ? 'bg-amber-100 text-amber-700' :
                  alert.type === 'due' ? 'bg-orange-100 text-orange-700' :
                  alert.type === 'timeout' ? 'bg-red-100 text-red-700' :
                  'bg-rose-100 text-rose-700'
                }`}
              >
                {alert.text}
              </span>
            ))}
          </div>
        )}

        {showHandler && (
          <div className="flex items-center justify-between text-sm mb-3">
            <div>
              <span className="text-slate-500">处理人：</span>
              <span className="font-medium text-slate-700">{handler}</span>
            </div>
          </div>
        )}

        {showBlocked && blockedReason && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-sm text-amber-800">
              <span className="font-medium">卡在哪里：</span>
              {blockedReason}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <span>
            创建于 {format(new Date(businessCase.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
          </span>
          <span className="text-blue-600 font-medium">查看详情 →</span>
        </div>
      </div>
    </Link>
  );
}
