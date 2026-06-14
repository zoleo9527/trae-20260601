import { useLoaderData } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { requireUser } from '../utils/session.server';
import { getDashboardData } from '../utils/business.server';
import StatCard from '../components/StatCard';
import CaseCard from '../components/CaseCard';
import { Link } from '@remix-run/react';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const data = await getDashboardData(user.id, user.role);
  return json({ user, ...data });
}

export default function Dashboard() {
  const { user, statistics, pendingCases, timeoutCases, returnedCases } = useLoaderData<typeof loader>();

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">今日概览</h1>
          <p className="text-slate-500 mt-1">{dateStr}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">欢迎回来</p>
          <p className="font-semibold text-slate-800">{user.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="今日总业务"
          value={statistics.totalToday}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="已完成"
          value={statistics.completedToday}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="待处理"
          value={statistics.pendingCount}
          color="amber"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="已超时"
          value={statistics.timeoutCount}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          title="已退回"
          value={statistics.returnedCount}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          }
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 mb-1">快速回答三个问题</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-blue-700">
              <div>
                <span className="font-medium">谁在处理：</span>
                每笔业务均显示当前处理人（大堂经理/客户经理/运营主管）
              </div>
              <div>
                <span className="font-medium">卡在哪里：</span>
                橙色标签标注资料缺页、尽调补件、等待授权等阻塞原因
              </div>
              <div>
                <span className="font-medium">为何未完成：</span>
                授权复核处明确标注退回原因、升级原因、等待时长
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-1 h-5 bg-amber-500 rounded-full" />
              今日待处理 ({pendingCases.length})
            </h2>
            <Link to="/cases?status=PENDING_AUTHORIZATION" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              查看全部 →
            </Link>
          </div>
          {pendingCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingCases.map((businessCase) => (
                <CaseCard key={businessCase.id} businessCase={businessCase as any} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-500">今日暂无待处理业务</p>
            </div>
          )}
        </section>

        {timeoutCases.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-5 bg-red-500 rounded-full" />
                超时业务 ({timeoutCases.length})
              </h2>
              <Link to="/cases?status=TIMEOUT" className="text-sm text-red-600 hover:text-red-700 font-medium">
                查看全部 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeoutCases.map((businessCase) => (
                <CaseCard key={businessCase.id} businessCase={businessCase as any} />
              ))}
            </div>
          </section>
        )}

        {returnedCases.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-5 bg-rose-500 rounded-full" />
                刚退回 ({returnedCases.length})
              </h2>
              <Link to="/cases?status=RETURNED" className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                查看全部 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {returnedCases.map((businessCase) => (
                <CaseCard key={businessCase.id} businessCase={businessCase as any} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
