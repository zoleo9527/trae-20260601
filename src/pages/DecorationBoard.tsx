import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, CheckCircle, Image, User, ChevronRight } from 'lucide-react';
import { useDecorationStore } from '../stores/decorationStore';
import { useBookingStore } from '../stores/bookingStore';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime } from '../utils/storage';
import { DecorationStatus } from '../types';

const DecorationBoard: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, getTasksByStatus } = useDecorationStore();
  const { getBookingById } = useBookingStore();

  const statusColumns: { status: DecorationStatus; label: string; icon: typeof Clock }[] = [
    { status: 'pending', label: '待布置', icon: Clock },
    { status: 'in_progress', label: '布置中', icon: Sparkles },
    { status: 'completed', label: '已完成', icon: CheckCircle },
    { status: 'restored', label: '已还原', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">包厢布置看板</h2>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statusColumns.map((col) => {
          const Icon = col.icon;
          const columnTasks = getTasksByStatus(col.status);
          
          return (
            <div key={col.status} className="bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-sm">{col.label}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                  {columnTasks.length}
                </span>
              </div>
              <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
                {columnTasks.map((task) => {
                  const booking = getBookingById(task.bookingId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/decorations/${task.id}`)}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">包厢{booking?.roomNumber}</span>
                        <StatusBadge status={task.status as DecorationStatus} type="decoration" />
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{task.theme}</p>
                      {task.photos.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          {task.photos.slice(0, 3).map((photo, idx) => (
                            <div key={idx} className="w-12 h-12 bg-slate-800 rounded overflow-hidden">
                              <img src={photo} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {task.photos.length > 3 && (
                            <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center text-xs text-slate-400">
                              +{task.photos.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{task.operator || '未分配'}</span>
                        </div>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  );
                })}
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    暂无任务
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="font-semibold">布置任务回看</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 font-medium text-slate-400">任务ID</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">包厢</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">主题</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">照片</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">操作员</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">状态</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const booking = getBookingById(task.bookingId);
                return (
                  <tr
                    key={task.id}
                    onClick={() => navigate(`/decorations/${task.id}`)}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer last:border-0"
                  >
                    <td className="px-5 py-3 font-mono text-xs">{task.id}</td>
                    <td className="px-5 py-3">{booking?.roomNumber || '-'}</td>
                    <td className="px-5 py-3">{task.theme}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Image className="w-4 h-4" />
                        <span>{task.photos.length}张</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{task.operator || '-'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={task.status as DecorationStatus} type="decoration" />
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {formatDateTime(task.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DecorationBoard;
