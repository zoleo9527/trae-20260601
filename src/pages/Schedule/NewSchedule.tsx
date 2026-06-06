import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Film, MapPin, Clock, DollarSign, Save, AlertCircle } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useHallStore } from '@/store/hallStore';
import { addHours, format } from 'date-fns';

const NewSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { createSchedule, checkTimeConflict } = useScheduleStore();
  const { halls } = useHallStore();

  const [formData, setFormData] = useState({
    movieName: '',
    hallId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(addHours(new Date(), 1), 'HH:mm'),
    endTime: format(addHours(new Date(), 3), 'HH:mm'),
    price: 50,
    remark: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.movieName.trim()) {
      setError('请输入影片名称');
      return;
    }
    if (!formData.hallId) {
      setError('请选择影厅');
      return;
    }

    const startTime = `${formData.date}T${formData.startTime}:00`;
    const endTime = `${formData.date}T${formData.endTime}:00`;

    if (new Date(startTime) >= new Date(endTime)) {
      setError('结束时间必须晚于开始时间');
      return;
    }

    if (checkTimeConflict(formData.hallId, startTime, endTime)) {
      setError('该时段影厅已有排片，请选择其他时间或影厅');
      return;
    }

    const result = createSchedule({
      movieName: formData.movieName,
      hallId: formData.hallId,
      startTime,
      endTime,
      price: formData.price,
      remark: formData.remark,
    });

    if (result) {
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/schedule/${result.id}`);
      }, 1000);
    } else {
      setError('创建排片失败，请检查时间冲突');
    }
  };

  const availableHalls = halls.filter((h) => h.status === 'idle' || h.status === 'screening');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/schedule" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新建排片</h1>
          <p className="text-gray-500 mt-1">创建新的影片排片计划</p>
        </div>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Save className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-900">排片创建成功！</p>
            <p className="text-sm text-green-700">正在跳转到详情页...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Film className="w-4 h-4 inline mr-2" />
            影片名称
          </label>
          <input
            type="text"
            value={formData.movieName}
            onChange={(e) => setFormData({ ...formData, movieName: e.target.value })}
            placeholder="请输入影片名称"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            选择影厅
          </label>
          <select
            value={formData.hallId}
            onChange={(e) => setFormData({ ...formData, hallId: e.target.value })}
            className="input"
          >
            <option value="">请选择影厅</option>
            {availableHalls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.name}（{hall.seatCount}座）
              </option>
            ))}
          </select>
          {availableHalls.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">当前无可用影厅，请先处理影厅故障</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              放映日期
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-2" />
            票价（元）
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            min={0}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
          <textarea
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            placeholder="可选：添加排片备注信息"
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link to="/schedule" className="btn-secondary">
            取消
          </Link>
          <button type="submit" className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            创建排片
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewSchedule;
