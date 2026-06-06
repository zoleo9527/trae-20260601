import React, { useEffect } from 'react';
import { Film, MonitorPlay, Ticket, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useHallStore } from '@/store/hallStore';
import { useTicketStore } from '@/store/ticketStore';
import { useRoleStore } from '@/store/roleStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime, formatTime } from '@/utils/date';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { getActiveSchedules, schedules } = useScheduleStore();
  const { halls, initHalls, faultTickets, getFaultTickets } = useHallStore();
  const { tickets } = useTicketStore();
  const { getRoleName } = useRoleStore();

  useEffect(() => {
    initHalls();
  }, [initHalls]);

  const activeSchedules = getActiveSchedules();
  const pendingFaults = getFaultTickets().filter((t) => t.status === 'pending' || t.status === 'processing');
  const todaySchedules = schedules.slice(0, 5);

  const stats = [
    {
      label: '今日排片',
      value: activeSchedules.length,
      icon: Film,
      color: 'bg-blue-500',
      link: '/schedule',
    },
    {
      label: '影厅总数',
      value: halls.length,
      icon: MonitorPlay,
      color: 'bg-green-500',
      link: '/hall',
    },
    {
      label: '处理中工单',
      value: pendingFaults.length,
      icon: AlertTriangle,
      color: 'bg-amber-500',
      link: '/hall',
    },
    {
      label: '票券总数',
      value: tickets.length,
      icon: Ticket,
      color: 'bg-purple-500',
      link: '/ticket',
    },
  ];

  const hallStatusCounts = halls.reduce(
    (acc, hall) => {
      acc[hall.status] = (acc[hall.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{getRoleName()}</h1>
        <p className="text-gray-500 mt-1">
          {formatDateTime(new Date())} · 影院运营工作面
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="card p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">今日排片</h2>
              <Link to="/schedule" className="text-sm text-cinema-red hover:underline">
                查看全部
              </Link>
            </div>
            {activeSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Film className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>暂无排片计划</p>
                <Link
                  to="/schedule/new"
                  className="text-cinema-red hover:underline text-sm mt-2 inline-block"
                >
                  + 创建新排片
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSchedules.slice(0, 5).map((schedule) => (
                  <Link
                    key={schedule.id}
                    to={`/schedule/${schedule.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-cinema-red/10 rounded-xl flex items-center justify-center">
                        <Film className="w-6 h-6 text-cinema-red" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{schedule.movieName}</p>
                        <p className="text-sm text-gray-500">{schedule.hallName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium text-gray-900">
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </p>
                      <StatusBadge type="schedule" status={schedule.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">影厅状态</h2>
            <div className="space-y-3">
              {halls.slice(0, 4).map((hall) => (
                <div key={hall.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{hall.name}</span>
                  <StatusBadge type="hall" status={hall.status} />
                </div>
              ))}
            </div>
            <Link
              to="/hall"
              className="block w-full text-center text-sm text-cinema-red hover:underline mt-4"
            >
              查看全部影厅
            </Link>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">待处理工单</h2>
            {pendingFaults.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无待处理工单</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingFaults.slice(0, 3).map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/hall/${ticket.hallId}`}
                    className="block p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-amber-900">{ticket.title}</p>
                    <p className="text-xs text-amber-700 mt-1">{ticket.hallName}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
