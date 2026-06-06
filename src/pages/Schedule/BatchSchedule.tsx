import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Film,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useHallStore } from '@/store/hallStore';
import { Modal } from '@/components/common/Modal';
import { formatTime } from '@/utils/date';
import type { BatchScheduleItem, BatchScheduleResult } from '@/types/schedule';

const BatchSchedule: React.FC = () => {
  const navigate = useNavigate();
  const { halls, initHalls } = useHallStore();
  const { batchCreateSchedules, checkTimeConflict } = useScheduleStore();

  const [scheduleItems, setScheduleItems] = useState<BatchScheduleItem[]>([
    {
      movieName: '',
      hallId: '',
      startTime: '',
      endTime: '',
      price: 35,
      remark: '',
    },
  ]);

  const [result, setResult] = useState<BatchScheduleResult | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    initHalls();
  }, [initHalls]);

  const addScheduleItem = () => {
    setScheduleItems([
      ...scheduleItems,
      {
        movieName: '',
        hallId: '',
        startTime: '',
        endTime: '',
        price: 35,
        remark: '',
      },
    ]);
  };

  const removeScheduleItem = (index: number) => {
    if (scheduleItems.length <= 1) return;
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
  };

  const updateScheduleItem = (index: number, field: keyof BatchScheduleItem, value: any) => {
    const updated = [...scheduleItems];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleItems(updated);
  };

  const validateItems = (): string | null => {
    for (let i = 0; i < scheduleItems.length; i++) {
      const item = scheduleItems[i];
      if (!item.movieName.trim()) {
        return `第 ${i + 1} 场：请填写影片名称`;
      }
      if (!item.hallId) {
        return `第 ${i + 1} 场：请选择影厅`;
      }
      if (!item.startTime) {
        return `第 ${i + 1} 场：请选择开始时间`;
      }
      if (!item.endTime) {
        return `第 ${i + 1} 场：请选择结束时间`;
      }
      if (new Date(item.startTime) >= new Date(item.endTime)) {
        return `第 ${i + 1} 场：结束时间必须晚于开始时间`;
      }
      if (item.price <= 0) {
        return `第 ${i + 1} 场：票价必须大于 0`;
      }

      const conflict = checkTimeConflict(item.hallId, item.startTime, item.endTime);
      if (conflict) {
        return `第 ${i + 1} 场：时间冲突 - 与 ${conflict.movieName} (${formatTime(conflict.startTime)}-${formatTime(conflict.endTime)}) 冲突`;
      }

      for (let j = 0; j < i; j++) {
        const prev = scheduleItems[j];
        if (prev.hallId === item.hallId) {
          const prevStart = new Date(prev.startTime).getTime();
          const prevEnd = new Date(prev.endTime).getTime();
          const currStart = new Date(item.startTime).getTime();
          const currEnd = new Date(item.endTime).getTime();

          if ((currStart >= prevStart && currStart < prevEnd) ||
              (currEnd > prevStart && currEnd <= prevEnd) ||
              (currStart <= prevStart && currEnd >= prevEnd)) {
            return `第 ${i + 1} 场与第 ${j + 1} 场在同一影厅时间冲突`;
          }
        }
      }
    }
    return null;
  };

  const handlePreview = () => {
    const validationError = validateItems();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setConfirmModalOpen(true);
  };

  const handleBatchCreate = () => {
    const batchResult = batchCreateSchedules(scheduleItems);
    setResult(batchResult);
    setConfirmModalOpen(false);
  };

  const handleReset = () => {
    setScheduleItems([
      {
        movieName: '',
        hallId: '',
        startTime: '',
        endTime: '',
        price: 35,
        remark: '',
      },
    ]);
    setResult(null);
    setError(null);
  };

  const handleBack = () => {
    navigate('/schedule');
  };

  const generateSampleData = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDate = (date: Date, hour: number, minute: number) => {
      const d = new Date(date);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString().slice(0, 16);
    };

    setScheduleItems([
      {
        movieName: '流浪地球3',
        hallId: halls[0]?.id || 'hall-1',
        startTime: formatDate(tomorrow, 9, 0),
        endTime: formatDate(tomorrow, 11, 30),
        price: 45,
        remark: '早场特惠',
      },
      {
        movieName: '流浪地球3',
        hallId: halls[0]?.id || 'hall-1',
        startTime: formatDate(tomorrow, 13, 0),
        endTime: formatDate(tomorrow, 15, 30),
        price: 50,
        remark: '',
      },
      {
        movieName: '哪吒之魔童闹海',
        hallId: halls[1]?.id || 'hall-2',
        startTime: formatDate(tomorrow, 10, 0),
        endTime: formatDate(tomorrow, 12, 0),
        price: 40,
        remark: '',
      },
      {
        movieName: '哪吒之魔童闹海',
        hallId: halls[1]?.id || 'hall-2',
        startTime: formatDate(tomorrow, 14, 0),
        endTime: formatDate(tomorrow, 16, 0),
        price: 40,
        remark: '',
      },
      {
        movieName: '复仇者联盟5',
        hallId: halls[2]?.id || 'hall-3',
        startTime: formatDate(tomorrow, 19, 0),
        endTime: formatDate(tomorrow, 21, 45),
        price: 55,
        remark: '黄金场次',
      },
    ]);
    setError(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">批量录入排片</h1>
            <p className="text-gray-500 mt-1">一次性创建多场排片，系统自动校验时间冲突</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateSampleData}
            className="btn-secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            填充示例
          </button>
          <button
            onClick={handleReset}
            className="btn-secondary"
          >
            重置
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">校验失败</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className={`p-6 rounded-xl ${result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-start gap-3">
            {result.failed === 0 ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">批量创建完成</h3>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-white rounded-lg text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                  <p className="text-sm text-gray-500">总计</p>
                </div>
                <div className="p-3 bg-white rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{result.success}</p>
                  <p className="text-sm text-green-600">成功</p>
                </div>
                <div className="p-3 bg-white rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-sm text-red-600">失败</p>
                </div>
              </div>
              {result.failedItems.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">失败详情：</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {result.failedItems.map((item, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded-lg text-sm flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-red-800">
                          第 {item.index + 1} 场「{item.movieName}」：{item.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleBack}
                  className="btn-primary"
                >
                  返回排片列表
                </button>
                <button
                  onClick={handleReset}
                  className="btn-secondary"
                >
                  继续添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <>
          <div className="card p-6">
            <div className="space-y-4">
              {scheduleItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative"
                >
                  <div className="absolute -top-3 -left-2 w-8 h-8 bg-cinema-red text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  {scheduleItems.length > 1 && (
                    <button
                      onClick={() => removeScheduleItem(index)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Film className="w-4 h-4 inline mr-1" />
                        影片名称
                      </label>
                      <input
                        type="text"
                        value={item.movieName}
                        onChange={(e) => updateScheduleItem(index, 'movieName', e.target.value)}
                        placeholder="请输入影片名称"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        影厅
                      </label>
                      <select
                        value={item.hallId}
                        onChange={(e) => updateScheduleItem(index, 'hallId', e.target.value)}
                        className="input"
                      >
                        <option value="">请选择影厅</option>
                        {halls.map((hall) => (
                          <option key={hall.id} value={hall.id}>
                            {hall.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        开始时间
                      </label>
                      <input
                        type="datetime-local"
                        value={item.startTime}
                        onChange={(e) => updateScheduleItem(index, 'startTime', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-1" />
                        结束时间
                      </label>
                      <input
                        type="datetime-local"
                        value={item.endTime}
                        onChange={(e) => updateScheduleItem(index, 'endTime', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        票价 (元)
                      </label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateScheduleItem(index, 'price', Number(e.target.value))}
                        min="0"
                        step="1"
                        className="input"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                    <input
                      type="text"
                      value={item.remark || ''}
                      onChange={(e) => updateScheduleItem(index, 'remark', e.target.value)}
                      placeholder="选填"
                      className="input"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addScheduleItem}
              className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-cinema-red hover:text-cinema-red transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              添加一场排片
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleBack}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handlePreview}
              className="btn-primary"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              校验并创建
            </button>
          </div>
        </>
      )}

      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="确认批量创建"
        footer={
          <>
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleBatchCreate}
              className="btn-primary"
            >
              确认创建 {scheduleItems.length} 场
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            即将批量创建 <span className="font-semibold text-cinema-red">{scheduleItems.length}</span> 场排片，确认无误后点击创建。
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {scheduleItems.map((item, index) => {
              const hall = halls.find((h) => h.id === item.hallId);
              return (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {index + 1}. {item.movieName}
                    </span>
                    <span className="text-sm text-gray-500">¥{item.price}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {hall?.name || '未知影厅'} · {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BatchSchedule;
