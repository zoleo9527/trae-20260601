import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, User, Phone } from 'lucide-react';
import { useBookingStore } from '../stores/bookingStore';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatTime } from '../utils/storage';
import { BookingStatus } from '../types';

const BookingList: React.FC = () => {
  const navigate = useNavigate();
  const { bookings, rooms, checkRoomConflict } = useBookingStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待确认' },
    { value: 'confirmed', label: '已确认' },
    { value: 'checked_in', label: '已到店' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];

  const filteredBookings = bookings.filter((b) => {
    const matchSearch = b.customerName.includes(search) || 
                       b.customerPhone.includes(search) || 
                       b.roomNumber.includes(search);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const hours = Array.from({ length: 14 }, (_, i) => i + 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getBookingsForRoomAndTime = (roomNumber: string, hour: number) => {
    return bookings.filter((b) => {
      if (b.roomNumber !== roomNumber || b.status === 'cancelled') return false;
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      const checkTime = new Date(today);
      checkTime.setHours(hour, 0, 0, 0);
      return checkTime >= start && checkTime < end;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索客户姓名、电话、包厢号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm w-72 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => navigate('/bookings/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建预订
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="font-semibold">今日预订时间轴</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="flex border-b border-slate-800">
              <div className="w-24 flex-shrink-0 p-3 border-r border-slate-800 text-xs text-slate-400 font-medium">
                包厢
              </div>
              {hours.map((hour) => (
                <div key={hour} className="flex-1 min-w-[60px] p-3 text-center text-xs text-slate-400 border-r border-slate-800 last:border-0">
                  {hour}:00
                </div>
              ))}
            </div>
            {rooms.map((room) => (
              <div key={room.number} className="flex border-b border-slate-800 last:border-0">
                <div className="w-24 flex-shrink-0 p-3 border-r border-slate-800 text-sm font-medium">
                  {room.number}
                </div>
                {hours.map((hour) => {
                  const roomBookings = getBookingsForRoomAndTime(room.number, hour);
                  const hasConflict = roomBookings.length > 1;
                  
                  return (
                    <div
                      key={hour}
                      className={`flex-1 min-w-[60px] h-12 border-r border-slate-800 last:border-0 p-1 ${
                        hasConflict ? 'bg-red-500/10' : ''
                      }`}
                    >
                      {roomBookings.slice(0, 1).map((booking) => (
                        <div
                          key={booking.id}
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                          className={`h-full rounded text-xs p-1 cursor-pointer truncate ${
                            hasConflict
                              ? 'bg-red-500/30 text-red-200'
                              : booking.status === 'confirmed'
                              ? 'bg-blue-500/30 text-blue-200'
                              : booking.status === 'checked_in'
                              ? 'bg-emerald-500/30 text-emerald-200'
                              : 'bg-amber-500/30 text-amber-200'
                          }`}
                        >
                          {booking.customerName}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h3 className="font-semibold">预订列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 font-medium text-slate-400">包厢</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">客户信息</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">时间段</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">套餐</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">布置</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">状态</th>
                <th className="text-left px-5 py-3 font-medium text-slate-400">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer last:border-0"
                >
                  <td className="px-5 py-3 font-medium">{booking.roomNumber}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{booking.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{booking.customerPhone}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {booking.packageOrderId ? (
                      <span className="text-emerald-400">已预订</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {booking.decorationTaskId ? (
                      <span className="text-amber-400">已安排</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={booking.status as BookingStatus} type="booking" />
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {formatDateTime(booking.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingList;
