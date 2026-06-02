import { useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useCounselorStore } from '../store/useCounselorStore';
import { useAppointmentStore } from '../store/useAppointmentStore';
import { useUserStore } from '../store/useUserStore';
import { TypeBadge } from '../components/StatusBadge';

const dates = ['2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06'];
const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

export function Schedule() {
  const { currentUser } = useUserStore();
  const { counselors, selectedDate, setSelectedDate, getScheduleForDate } = useCounselorStore();
  const { appointments } = useAppointmentStore();
  const [selectedCounselor, setSelectedCounselor] = useState<string | null>(null);

  const currentDateIndex = dates.indexOf(selectedDate);
  const scheduleForDate = getScheduleForDate(selectedDate);

  const displayCounselors = (() => {
    if (currentUser.role === 'counselor' && currentUser.counselorId) {
      return counselors.filter((c) => c.id === currentUser.counselorId);
    }
    if (selectedCounselor) {
      return counselors.filter((c) => c.id === selectedCounselor);
    }
    return counselors;
  })();

  const getAppointmentForSlot = (counselorId: string, date: string, time: string) => {
    return appointments.find(
      (a) => a.counselorId === counselorId && a.date === date && a.time === time && a.status !== 'cancelled'
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return {
      weekday: weekdays[date.getDay()],
      day: date.getDate(),
      month: date.getMonth() + 1,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">排班</h1>
          <p className="muted-text mt-0.5">咨询师日程安排</p>
        </div>

        {currentUser.role === 'reception' && (
          <select
            value={selectedCounselor || ''}
            onChange={(e) => setSelectedCounselor(e.target.value || null)}
            className="filter-select"
          >
            <option value="">全部咨询师</option>
            {counselors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <button
            onClick={() => currentDateIndex > 0 && setSelectedDate(dates[currentDateIndex - 1])}
            className="p-1.5 rounded-md hover:bg-surface-muted transition-colors disabled:opacity-30"
            disabled={currentDateIndex === 0}
          >
            <ChevronLeft size={18} className="text-text-secondary" />
          </button>

          <div className="flex gap-1">
            {dates.map((date) => {
              const { weekday, day, month } = formatDate(date);
              const isSelected = date === selectedDate;
              const isToday = date === '2026-06-02';
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-md text-center min-w-[72px] transition-colors ${
                    isSelected
                      ? 'bg-primary-700 text-white'
                      : isToday
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-surface-hover text-text-secondary'
                  }`}
                >
                  <p className="text-2xs opacity-70">周{weekday}</p>
                  <p className="text-sm font-medium">{month}/{day}</p>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => currentDateIndex < dates.length - 1 && setSelectedDate(dates[currentDateIndex + 1])}
            className="p-1.5 rounded-md hover:bg-surface-muted transition-colors disabled:opacity-30"
            disabled={currentDateIndex === dates.length - 1}
          >
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left py-3 px-4 text-2xs font-medium text-text-tertiary w-28">咨询师</th>
                {timeSlots.map((time) => (
                  <th key={time} className="text-center py-3 px-2 text-2xs font-medium text-text-tertiary min-w-[100px]">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayCounselors.map((counselor) => {
                const schedule = scheduleForDate.find((s) => s.counselorId === counselor.id);
                return (
                  <tr key={counselor.id} className="border-b border-gray-50 last:border-b-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
                          <User size={14} className="text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{counselor.name}</p>
                          <p className="text-2xs text-text-tertiary truncate max-w-20">
                            {counselor.specialty[0]}
                          </p>
                        </div>
                      </div>
                    </td>
                    {timeSlots.map((time) => {
                      const appointment = getAppointmentForSlot(counselor.id, selectedDate, time);
                      const isAvailable = schedule?.availableSlots.includes(time);

                      let cellBg = 'bg-surface-muted/30';
                      let content: React.ReactNode = null;

                      if (appointment) {
                        cellBg = appointment.status === 'rescheduled'
                          ? 'bg-amber-50/60'
                          : 'bg-primary-50/50';
                        content = (
                          <div className="text-2xs p-1">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-text-primary truncate">{appointment.clientName}</span>
                              <TypeBadge type={appointment.type} />
                            </div>
                            {appointment.status === 'rescheduled' && (
                              <p className="text-amber-600 text-2xs mt-0.5">改期中</p>
                            )}
                          </div>
                        );
                      } else if (isAvailable) {
                        cellBg = 'bg-emerald-50/30';
                        content = <span className="text-2xs text-status-normal">空闲</span>;
                      }

                      return (
                        <td
                          key={time}
                          className={`text-center py-2 px-1 border-l border-gray-50 ${cellBg}`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-5 px-5 py-3 border-t border-gray-50 bg-surface-muted/30 rounded-b-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-primary-50 border border-primary-100"></div>
            <span className="text-2xs text-text-tertiary">已预约</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-100"></div>
            <span className="text-2xs text-text-tertiary">空闲</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-100"></div>
            <span className="text-2xs text-text-tertiary">改期待确认</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-surface-muted border border-gray-200"></div>
            <span className="text-2xs text-text-tertiary">不可约</span>
          </div>
        </div>
      </div>
    </div>
  );
}
