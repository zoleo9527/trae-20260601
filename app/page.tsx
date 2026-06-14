import Link from 'next/link';
import { getDashboardStats, getTodayPendingRecords, getOverdueRecords, getReturnedRecords, getPendingReviews, getWaitingConfirmReviews } from '../actions/dataActions';
import { Role } from '../types';

const roles: Role[] = ['教务老师', '任课老师', '家长顾问'];

export default async function HomePage() {
  const statsByRole = await Promise.all(roles.map(role => getDashboardStats(role)));
  const todayPending = await getTodayPendingRecords();
  const overdueRecords = await getOverdueRecords();
  const returnedRecords = await getReturnedRecords();
  const pendingReviews = await getPendingReviews();
  const waitingConfirmReviews = await getWaitingConfirmReviews();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">音乐培训机构</h1>
              <p className="text-sm text-gray-500">陪练打卡与阶段点评系统</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">选择角色进入工作台</h2>
          <p className="text-gray-500">不同角色有不同的数据权限和操作权限</p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {roles.map((role, index) => (
            <Link
              key={role}
              href={`/repayment?role=${encodeURIComponent(role)}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  role === '教务老师' ? 'bg-primary-100' :
                  role === '任课老师' ? 'bg-secondary-100' : 'bg-success-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    role === '教务老师' ? 'text-primary-600' :
                    role === '任课老师' ? 'text-secondary-600' : 'text-success-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {role === '教务老师' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    ) : role === '任课老师' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    )}
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600">{role}</h3>
                  <p className="text-sm text-gray-500">
                    {role === '教务老师' ? '处理陪练打卡' :
                     role === '任课老师' ? '阶段点评撰写' : '确认与回看'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {role === '教务老师' && (
                  <>
                    <div className="bg-primary-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">今日待处理</div>
                      <div className="text-xl font-bold text-primary-600">{statsByRole[index].todayPending}</div>
                    </div>
                    <div className="bg-danger-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">超时</div>
                      <div className="text-xl font-bold text-danger-600">{statsByRole[index].overdueCount}</div>
                    </div>
                    <div className="bg-warning-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">已退回</div>
                      <div className="text-xl font-bold text-warning-600">{statsByRole[index].returnedCount}</div>
                    </div>
                  </>
                )}
                {role === '任课老师' && (
                  <>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">待点评</div>
                      <div className="text-xl font-bold text-purple-600">{statsByRole[index].pendingReviews}</div>
                    </div>
                    <div className="bg-warning-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">已退回</div>
                      <div className="text-xl font-bold text-warning-600">{statsByRole[index].returnedCount}</div>
                    </div>
                  </>
                )}
                {role === '家长顾问' && (
                  <>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500">待确认</div>
                      <div className="text-xl font-bold text-orange-600">{statsByRole[index].waitingConfirm}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center justify-end text-primary-600 group-hover:text-primary-700">
                <span className="text-sm">进入工作台</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">今日待办一览</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                今日待处理 ({todayPending.length})
              </h4>
              <div className="space-y-2">
                {todayPending.slice(0, 3).map(record => (
                  <div key={record.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-800">{record.studentName}</div>
                    <div className="text-sm text-gray-500">{record.instrument} · {record.duration}分钟</div>
                  </div>
                ))}
                {todayPending.length === 0 && (
                  <div className="text-sm text-gray-400 py-2">暂无待处理记录</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-danger-500 rounded-full"></span>
                超时未处理 ({overdueRecords.length})
              </h4>
              <div className="space-y-2">
                {overdueRecords.slice(0, 3).map(record => (
                  <div key={record.id} className="bg-danger-50 rounded-lg p-3">
                    <div className="font-medium text-gray-800">{record.studentName}</div>
                    <div className="text-sm text-danger-600">{record.practiceDate} · {record.instrument}</div>
                  </div>
                ))}
                {overdueRecords.length === 0 && (
                  <div className="text-sm text-gray-400 py-2">暂无超时记录</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-warning-500 rounded-full"></span>
                刚退回 ({returnedRecords.length})
              </h4>
              <div className="space-y-2">
                {returnedRecords.slice(0, 3).map(record => (
                  <div key={record.id} className="bg-warning-50 rounded-lg p-3">
                    <div className="font-medium text-gray-800">{record.studentName}</div>
                    <div className="text-sm text-warning-600">{record.instrument} · {record.note}</div>
                  </div>
                ))}
                {returnedRecords.length === 0 && (
                  <div className="text-sm text-gray-400 py-2">暂无退回记录</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}