import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { AlertBanner } from '../components/AlertBanner';
import { formatDate, getRelativeTime } from '../utils/date';

export function Dashboard() {
  const { currentUser, getVisitsByCurrentUser, getCommunicationsByCurrentUser, elders } = useStore();
  
  const visits = getVisitsByCurrentUser();
  const communications = getCommunicationsByCurrentUser();

  const pendingVisits = visits.filter(v => v.status === 'pending_approval').length;
  const todayVisits = visits.filter(v => v.status === 'approved' || v.status === 'checked_in').length;
  const stuckVisits = visits.filter(v => v.status === 'stuck').length;

  const pendingComms = communications.filter(c => c.status === 'pending').length;
  const stuckComms = communications.filter(c => c.status === 'stuck' || c.status === 'escalated').length;
  const urgentComms = communications.filter(c => c.priority === 'urgent').length;

  const recentStuckVisits = visits.filter(v => v.status === 'stuck').slice(0, 3);
  const recentStuckComms = communications.filter(c => c.status === 'stuck' || c.status === 'escalated').slice(0, 3);

  const getElderName = (elderId: string) => {
    const elder = elders.find(e => e.id === elderId);
    return elder?.name || '未知';
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">请先选择一个角色开始操作</h2>
        <p className="mt-2 text-gray-500">使用顶部角色切换器选择身份</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
        <p className="mt-1 text-gray-500">欢迎回来，{currentUser.name}</p>
      </div>

      {(stuckVisits > 0 || stuckComms > 0) && (
        <AlertBanner
          type="danger"
          title="⚠️ 存在异常记录需要处理"
          message={`发现 ${stuckVisits} 条卡住的探视记录和 ${stuckComms} 条卡住/升级的沟通记录，请及时跟进处理。`}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批探视</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingVisits}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日探视</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{todayVisits}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理沟通</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pendingComms}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">紧急事项</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{urgentComms + stuckVisits}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">异常探视记录</h2>
            <Link to="/visits?filter=stuck" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </Link>
          </div>
          <div className="card-body">
            {recentStuckVisits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p>暂无异常探视记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStuckVisits.map(visit => (
                  <Link
                    key={visit.id}
                    to={`/visits/${visit.id}`}
                    className="block p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{getElderName(visit.elderId)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(visit.requestedDate)} {visit.requestedTimeSlot}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          访客：{visit.visitorName}
                        </p>
                      </div>
                      <StatusBadge status={visit.status} type="visit" />
                    </div>
                    {visit.notes && (
                      <p className="mt-2 text-sm text-red-600">{visit.notes}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">异常沟通记录</h2>
            <Link to="/communications?filter=stuck" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </Link>
          </div>
          <div className="card-body">
            {recentStuckComms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p>暂无异常沟通记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStuckComms.map(comm => (
                  <Link
                    key={comm.id}
                    to={`/communications/${comm.id}`}
                    className="block p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{comm.title}</p>
                          <PriorityBadge priority={comm.priority} />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {getElderName(comm.elderId)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {getRelativeTime(comm.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={comm.status} type="communication" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">近期探视预约</h2>
            <Link to="/visits" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {visits.slice(0, 5).map(visit => (
                <Link
                  key={visit.id}
                  to={`/visits/${visit.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{getElderName(visit.elderId)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(visit.requestedDate)} {visit.requestedTimeSlot}
                    </p>
                  </div>
                  <StatusBadge status={visit.status} type="visit" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">近期家属沟通</h2>
            <Link to="/communications" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {communications.slice(0, 5).map(comm => (
                <Link
                  key={comm.id}
                  to={`/communications/${comm.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{comm.title}</p>
                    <p className="text-sm text-gray-500">
                      {getElderName(comm.elderId)} · {getRelativeTime(comm.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={comm.status} type="communication" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
