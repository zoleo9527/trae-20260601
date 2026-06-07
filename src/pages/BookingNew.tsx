import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useBookingStore } from '../stores/bookingStore';
import { useMemberStore } from '../stores/memberStore';

const BookingNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { rooms, addBooking, checkRoomConflict } = useBookingStore();
  const { getMemberByPhone } = useMemberStore();

  const [formData, setFormData] = useState({
    roomNumber: rooms[0]?.number || '',
    startTime: '',
    endTime: '',
    customerName: '',
    customerPhone: '',
    memberId: '',
    notes: '',
  });

  const [conflicts, setConflicts] = useState<ReturnType<typeof checkRoomConflict>>([]);
  const [memberInfo, setMemberInfo] = useState<ReturnType<typeof getMemberByPhone>>(undefined);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setHours(tomorrow.getHours() + 2);
    setFormData((prev) => ({
      ...prev,
      startTime: today.toISOString().slice(0, 16),
      endTime: tomorrow.toISOString().slice(0, 16),
    }));
  }, []);

  useEffect(() => {
    if (formData.roomNumber && formData.startTime && formData.endTime) {
      const c = checkRoomConflict(formData.roomNumber, formData.startTime, formData.endTime);
      setConflicts(c);
    } else {
      setConflicts([]);
    }
  }, [formData.roomNumber, formData.startTime, formData.endTime, checkRoomConflict]);

  useEffect(() => {
    if (formData.customerPhone.length >= 11) {
      const member = getMemberByPhone(formData.customerPhone);
      setMemberInfo(member);
      if (member) {
        setFormData((prev) => ({
          ...prev,
          customerName: member.name,
          memberId: member.id,
        }));
      }
    } else {
      setMemberInfo(undefined);
    }
  }, [formData.customerPhone, getMemberByPhone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflicts.length > 0) {
      if (!confirm('存在包厢撞档，是否继续创建？')) return;
    }
    const id = addBooking({
      ...formData,
      status: 'pending',
    });
    navigate(`/bookings/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bookings')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">新建预订</h2>
      </div>

      {conflicts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-400 mb-1">包厢撞档预警</p>
              <p className="text-sm text-slate-300">
                该时段与以下预订存在冲突：
              </p>
              <div className="mt-2 space-y-1">
                {conflicts.map((c) => (
                  <div key={c.id} className="text-sm text-slate-400">
                    {c.customerName} · {new Date(c.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    -{new Date(c.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">
              <Calendar className="w-4 h-4 inline mr-1" />
              选择包厢
            </label>
            <select
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              required
            >
              {rooms.map((room) => (
                <option key={room.number} value={room.number}>
                  {room.number} - {room.name} ({room.capacity}人)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">
              <Clock className="w-4 h-4 inline mr-1" />
              开始时间
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">
              <Clock className="w-4 h-4 inline mr-1" />
              结束时间
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">
              <Phone className="w-4 h-4 inline mr-1" />
              联系电话
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="输入手机号自动识别会员"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {memberInfo && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">已识别会员：</span>
              <span className="text-sm font-medium">{memberInfo.name}</span>
              <span className="text-xs text-slate-400">（{memberInfo.level} · 余额¥{memberInfo.balance}）</span>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-slate-400 block mb-1.5">
            <User className="w-4 h-4 inline mr-1" />
            客户姓名
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="请输入客户姓名"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 block mb-1.5">备注</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="特殊要求、生日布置需求等"
            rows={3}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            创建预订
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingNew;
