import { useLoaderData, Link } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireUser } from '../utils/session.server';
import { getCaseList } from '../utils/business.server';
import CaseCard from '../components/CaseCard';
import { STATUS_LABELS } from '../utils/constants';
import type { BusinessStatus } from '@prisma/client';

const STATUS_OPTIONS: { value: BusinessStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'QUEUED', label: '排队中' },
  { value: 'ACCEPTED', label: '已受理' },
  { value: 'DOCUMENT_CHECKING', label: '资料检查中' },
  { value: 'DUE_DILIGENCE', label: '尽调审查中' },
  { value: 'PROCESSING', label: '柜面处理中' },
  { value: 'PENDING_AUTHORIZATION', label: '待授权' },
  { value: 'AUTHORIZED', label: '已授权' },
  { value: 'RETURNED', label: '已退回' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'TIMEOUT', label: '已超时' },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status') as BusinessStatus | '';

  const cases = await getCaseList(user.id, user.role, {
    status: statusParam || undefined,
  });

  return json({ user, cases, currentStatus: statusParam || '' });
}

export default function CasesPage() {
  const { cases, currentStatus } = useLoaderData<typeof loader>();

  const counts = {
    all: cases.length,
    pending: cases.filter((c: any) =>
      ['ACCEPTED', 'DOCUMENT_CHECKING', 'DUE_DILIGENCE', 'PROCESSING', 'PENDING_AUTHORIZATION', 'AUTHORIZATION_REVIEW'].includes(c.status)
    ).length,
    document: cases.filter((c: any) => c.status === 'DOCUMENT_CHECKING').length,
    dueDiligence: cases.filter((c: any) => c.status === 'DUE_DILIGENCE').length,
    auth: cases.filter((c: any) => c.status === 'PENDING_AUTHORIZATION').length,
    returned: cases.filter((c: any) => c.status === 'RETURNED').length,
    timeout: cases.filter((c: any) => c.status === 'TIMEOUT' || c.timeoutWarning).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">业务列表</h1>
          <p className="text-slate-500 mt-1">共 {cases.length} 条记录</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="全部"
          count={counts.all}
          active={currentStatus === ''}
          href="/cases"
          color="slate"
        />
        <FilterChip
          label="进行中"
          count={counts.pending}
          active={false}
          href="/cases"
          color="blue"
        />
        <FilterChip
          label="资料检查"
          count={counts.document}
          active={currentStatus === 'DOCUMENT_CHECKING'}
          href="/cases?status=DOCUMENT_CHECKING"
          color="purple"
        />
        <FilterChip
          label="尽调审查"
          count={counts.dueDiligence}
          active={currentStatus === 'DUE_DILIGENCE'}
          href="/cases?status=DUE_DILIGENCE"
          color="indigo"
        />
        <FilterChip
          label="待授权"
          count={counts.auth}
          active={currentStatus === 'PENDING_AUTHORIZATION'}
          href="/cases?status=PENDING_AUTHORIZATION"
          color="amber"
        />
        <FilterChip
          label="已退回"
          count={counts.returned}
          active={currentStatus === 'RETURNED'}
          href="/cases?status=RETURNED"
          color="rose"
        />
        <FilterChip
          label="超时/预警"
          count={counts.timeout}
          active={currentStatus === 'TIMEOUT'}
          href="/cases?status=TIMEOUT"
          color="red"
        />
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="label">按状态筛选</label>
            <select
              className="input"
              value={currentStatus}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('status', e.target.value);
                } else {
                  url.searchParams.delete('status');
                }
                window.location.href = url.toString();
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {cases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((businessCase) => (
            <CaseCard key={businessCase.id} businessCase={businessCase as any} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 mb-2">没有符合条件的业务记录</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            返回仪表盘 →
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  href,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  href: string;
  color: 'slate' | 'blue' | 'purple' | 'indigo' | 'amber' | 'rose' | 'red';
}) {
  const colorMap: Record<string, string> = {
    slate: active ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    blue: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    purple: active ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    indigo: active ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
    amber: active ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    rose: active ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
    red: active ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
  };

  return (
    <Link
      to={href}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colorMap[color]}`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-white'}`}>
        {count}
      </span>
    </Link>
  );
}
