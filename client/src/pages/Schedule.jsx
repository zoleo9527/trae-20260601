import { AlertTriangle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { schedulesApi } from '../api';
import StatusBadge from '../components/StatusBadge';

const CHANNELS = ['综合频道', '影视频道', '生活频道', '少儿频道', '体育频道'];
const TIME_SLOTS = ['17:00', '17:30', '17:45', '18:00', '18:30', '19:00', '19:30', '20:00', '20:15', '20:30', '21:00', '21:30'];

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatWeekday(date) {
  const d = new Date(date);
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
}

export default function Schedule() {
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState({});
  const [channels, setChannels] = useState(CHANNELS);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    loadCalendar();
  }, [weekOffset]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const data = await schedulesApi.calendar({
        start_date: weekDays[0],
        end_date: weekDays[6],
      });
      setCalendarData(data.schedules || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const conflictSchedules = Object.values(calendarData).flat().filter(s => s.status === 'conflict');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">排期管理</h2>
          <p className="text-gray-500 mt-1">频道广告排期日历视图</p>
        </div>
        {conflictSchedules.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-red-700 text-sm font-medium">{conflictSchedules.length} 个排期冲突</span>
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setWeekOffset(0)} className="btn-secondary text-xs">
              本周
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={20} />
            </button>
            <span className="text-sm font-medium text-gray-700 ml-2">
              {formatDate(weekDays[0])} — {formatDate(weekDays[6])}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              表格视图
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${viewMode === 'timeline' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              时间线
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : viewMode === 'grid' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[100px]">
                    频道 / 时段
                  </th>
                  {weekDays.map(day => {
                    const isToday = day === new Date().toISOString().split('T')[0];
                    return (
                      <th key={day} className={`text-center px-3 py-3 text-xs font-medium min-w-[140px] ${isToday ? 'bg-primary-50 text-primary-700' : 'text-gray-500'}`}>
                        <div>{formatDate(day)}</div>
                        <div className="text-xs opacity-75">周{formatWeekday(day)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {channels.map(ch => (
                  <>
                    <tr key={`header-${ch}`} className="bg-gray-50/50">
                      <td colSpan={8} className="px-4 py-2 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50/50 z-10">
                        {ch}
                      </td>
                    </tr>
                    {TIME_SLOTS.filter(slot => {
                      return weekDays.some(day => (calendarData[day] || []).some(s => s.channel === ch && s.time_slot === slot && s.status !== 'cancelled'));
                    }).map(slot => (
                      <tr key={`${ch}-${slot}`} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 text-xs text-gray-500 font-medium sticky left-0 bg-white z-10 border-r border-gray-100">
                          {slot}
                        </td>
                        {weekDays.map(day => {
                          const items = (calendarData[day] || []).filter(s => s.channel === ch && s.time_slot === slot && s.status !== 'cancelled');
                          return (
                            <td key={`${day}-${ch}-${slot}`} className="px-2 py-1.5">
                              {items.map(item => (
                                <div
                                  key={item.id}
                                  onClick={() => navigate(`/orders/${item.order_id}`)}
                                  className={`p-2 rounded-lg cursor-pointer text-xs transition-all hover:shadow-md ${
                                    item.status === 'conflict'
                                      ? 'bg-red-100 border border-red-200 text-red-700'
                                      : item.status === 'aired'
                                      ? 'bg-emerald-100 border border-emerald-200 text-emerald-700'
                                      : 'bg-primary-50 border border-primary-200 text-primary-700'
                                  }`}
                                >
                                  <p className="font-medium truncate">{item.client_name}</p>
                                  <p className="opacity-75 truncate mt-0.5">{item.order_no}</p>
                                  {item.status === 'conflict' && (
                                    <p className="flex items-center gap-1 mt-1 text-red-500">
                                      <AlertTriangle size={10} /> 冲突
                                    </p>
                                  )}
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {weekDays.map(day => {
            const items = calendarData[day] || [];
            const activeItems = items.filter(s => s.status !== 'cancelled');
            if (activeItems.length === 0) return null;
            const isToday = day === new Date().toISOString().split('T')[0];

            return (
              <div key={day} className={`card p-5 ${isToday ? 'ring-2 ring-primary-200' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Calendar size={16} className="text-gray-400" />
                  <h3 className={`text-sm font-semibold ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
                    {formatDate(day)} 周{formatWeekday(day)} {isToday && '（今天）'}
                  </h3>
                  <span className="badge bg-gray-100 text-gray-600">{activeItems.length} 条排期</span>
                </div>
                <div className="space-y-2">
                  {activeItems.sort((a, b) => a.time_slot.localeCompare(b.time_slot)).map(item => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/orders/${item.order_id}`)}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${
                        item.status === 'conflict' ? 'bg-red-50' :
                        item.status === 'aired' ? 'bg-emerald-50' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-bold text-primary-600 min-w-[50px]">{item.time_slot}</span>
                      <span className="text-xs text-gray-500 min-w-[80px]">{item.channel}</span>
                      <span className="text-sm text-gray-900 flex-1">{item.client_name} — {item.file_name}</span>
                      <StatusBadge status={item.status} type="schedule" />
                      {item.status === 'conflict' && <span className="text-xs text-red-600">{item.conflict_note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
