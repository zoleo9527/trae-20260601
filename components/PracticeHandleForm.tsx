import { useState } from 'react';
import { PracticeRecord, PracticeStatus } from '../types';

interface PracticeHandleFormProps {
  record: PracticeRecord;
  onSubmit: (recordId: string, note: string, status: PracticeStatus) => void;
  onCancel: () => void;
}

export function PracticeHandleForm({ record, onSubmit, onCancel }: PracticeHandleFormProps) {
  const [note, setNote] = useState(record.note);
  const [status, setStatus] = useState<PracticeStatus>('已确认');

  const handleSubmit = () => {
    onSubmit(record.id, note, status);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
          <input
            type="text"
            value={record.studentName}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">乐器</label>
          <input
            type="text"
            value={record.instrument}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">练习日期</label>
          <input
            type="text"
            value={record.practiceDate}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">练习时长</label>
          <input
            type="text"
            value={`${record.duration}分钟`}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">练习内容</label>
        <textarea
          value={record.content}
          disabled
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          处理备注 <span className="text-primary-600">（此备注将同步到阶段点评）</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="请输入处理备注，此备注将被阶段点评引用"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">处理结果</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="已确认"
              checked={status === '已确认'}
              onChange={(e) => setStatus(e.target.value as PracticeStatus)}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm">确认通过</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="已退回"
              checked={status === '已退回'}
              onChange={(e) => setStatus(e.target.value as PracticeStatus)}
              className="w-4 h-4 text-danger-600"
            />
            <span className="text-sm">退回修改</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${
            status === '已退回' ? 'bg-danger-500 hover:bg-danger-600' : 'bg-primary-500 hover:bg-primary-600'
          }`}
        >
          {status === '已退回' ? '退回' : '确认'}
        </button>
      </div>
    </div>
  );
}
