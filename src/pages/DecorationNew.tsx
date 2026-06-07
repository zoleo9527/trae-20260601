import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  User,
  FileText
} from 'lucide-react';
import { useDecorationStore } from '../stores/decorationStore';
import { useBookingStore } from '../stores/bookingStore';
import { useAuthStore } from '../stores/authStore';

const DecorationNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const { addTask, getTasksByBooking } = useDecorationStore();
  const { getBookingById, bookings } = useBookingStore();
  const { currentUser } = useAuthStore();

  const [formData, setFormData] = useState({
    bookingId: bookingId,
    theme: '',
    notes: '',
    operator: currentUser,
  });

  const booking = formData.bookingId ? getBookingById(formData.bookingId) : undefined;
  const existingTask = formData.bookingId ? getTasksByBooking(formData.bookingId) : undefined;
  const availableBookings = bookings.filter((b) => !b.decorationTaskId && b.status !== 'cancelled');

  useEffect(() => {
    if (existingTask && formData.bookingId) {
      navigate(`/bookings/${formData.bookingId}`, { replace: true });
    }
  }, [existingTask, formData.bookingId, navigate]);

  const themes = [
    '浪漫粉色生日',
    '酷炫黑金派对',
    '童趣卡通主题',
    '清新森系布置',
    '豪华香槟主题',
    '简约商务风',
    '复古港风',
    '赛博朋克',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bookingId) {
      alert('请选择关联预订');
      return;
    }
    if (!formData.theme) {
      alert('请选择或输入布置主题');
      return;
    }
    const taskId = addTask({
      bookingId: formData.bookingId,
      theme: formData.theme,
      status: 'pending',
      notes: formData.notes || undefined,
      operator: formData.operator || undefined,
    });
    
    navigate(`/decorations/${taskId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(bookingId ? `/bookings/${bookingId}` : '/decorations')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold">安排包厢布置</h2>
      </div>

      {booking && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400">关联预订</p>
          <p className="font-medium mt-1">
            包厢{booking.roomNumber} · {booking.customerName}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-5">
        {!bookingId && (
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">
              选择预订
            </label>
            <select
              value={formData.bookingId}
              onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
              required
            >
              <option value="">请选择需要布置的预订</option>
              {availableBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  包厢{b.roomNumber} - {b.customerName} ({new Date(b.startTime).toLocaleDateString('zh-CN')})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm text-slate-400 block mb-1.5">
            <Sparkles className="w-4 h-4 inline mr-1" />
            布置主题
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {themes.map((theme) => (
              <div
                key={theme}
                onClick={() => setFormData({ ...formData, theme })}
                className={`p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                  formData.theme === theme
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {theme}
              </div>
            ))}
          </div>
          <input
            type="text"
            value={formData.theme}
            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
            placeholder="或输入自定义主题"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 block mb-1.5">
            <User className="w-4 h-4 inline mr-1" />
            操作员
          </label>
          <input
            type="text"
            value={formData.operator}
            onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
            placeholder="负责布置的工作人员"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 block mb-1.5">
            <FileText className="w-4 h-4 inline mr-1" />
            布置说明
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="特殊要求、客户偏好、气球颜色等细节"
            rows={3}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(bookingId ? `/bookings/${bookingId}` : '/decorations')}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            创建布置任务
          </button>
        </div>
      </form>
    </div>
  );
};

export default DecorationNew;
