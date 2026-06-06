import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MonitorPlay, Users, Wrench, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useHallStore } from '@/store/hallStore';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDateTime } from '@/utils/date';
import { hallStatusLabels } from '@/types/common';

const HallList: React.FC = () => {
  const { halls, initHalls, getFaultTickets } = useHallStore();
  const faultTickets = getFaultTickets();

  useEffect(() => {
    initHalls();
  }, [initHalls]);

  const statusCounts = halls.reduce(
    (acc, hall) => {
      acc[hall.status] = (acc[hall.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pendingFaults = faultTickets.filter((t) => t.status === 'pending' || t.status === 'processing');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">影厅资源</h1>
        <p className="text-gray-500 mt-1">查看影厅状态，提交巡检记录，处理设备故障</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(hallStatusLabels).map(([status, label]) => (
          <div key={status} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts[status] || 0}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                status === 'idle' ? 'bg-green-100' :
                status === 'screening' ? 'bg-blue-100' :
                status === 'fault' ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                {status === 'idle' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {status === 'screening' && <MonitorPlay className="w-5 h-5 text-blue-600" />}
                {status === 'fault' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                {status === 'maintenance' && <Wrench className="w-5 h-5 text-amber-600" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pendingFaults.length > 0 && (
        <div className="card p-6 border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">待处理故障工单</h2>
              <p className="text-sm text-gray-500">共 {pendingFaults.length} 个工单需要处理</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingFaults.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/hall/${ticket.hallId}`}
                className="p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-red-900">{ticket.title}</p>
                    <p className="text-sm text-red-700 mt-1">{ticket.hallName}</p>
                  </div>
                  <StatusBadge type="fault" status={ticket.status} />
                </div>
                <p className="text-xs text-red-600 mt-2">
                  上报于 {formatDateTime(ticket.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {halls.map((hall) => (
          <Link
            key={hall.id}
            to={`/hall/${hall.id}`}
            className={`card p-6 hover:shadow-lg transition-all group ${
              hall.status === 'fault' ? 'border-red-200 bg-red-50/30' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                hall.status === 'idle' ? 'bg-green-100' :
                hall.status === 'screening' ? 'bg-blue-100' :
                hall.status === 'fault' ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                <MonitorPlay className={`w-6 h-6 ${
                  hall.status === 'idle' ? 'text-green-600' :
                  hall.status === 'screening' ? 'text-blue-600' :
                  hall.status === 'fault' ? 'text-red-600' : 'text-amber-600'
                }`} />
              </div>
              <StatusBadge type="hall" status={hall.status} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{hall.name}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                {hall.seatCount} 座位
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-gray-400" />
                {hall.equipment.slice(0, 2).join('、')}
                {hall.equipment.length > 2 && ` 等${hall.equipment.length}项`}
              </div>
              {hall.lastInspection && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  上次巡检：{formatDateTime(hall.lastInspection)}
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="text-cinema-red group-hover:underline">查看详情 →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HallList;
