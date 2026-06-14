import { useState } from 'react';
import { PracticeStatus, ReviewStatus, Role } from '../types';
import { instruments } from '../data/mockData';

interface FilterBarProps {
  role: Role;
  onFilterChange: (filters: {
    studentName?: string;
    instrument?: string;
    practiceStatus?: PracticeStatus;
    reviewStatus?: ReviewStatus;
  }) => void;
}

const practiceStatuses: PracticeStatus[] = ['待处理', '已确认', '已退回', '已完成', '超时'];
const reviewStatuses: ReviewStatus[] = ['待点评', '已点评', '待确认', '已完成'];

export function FilterBar({ role, onFilterChange }: FilterBarProps) {
  const [studentName, setStudentName] = useState('');
  const [instrument, setInstrument] = useState('全部');
  const [practiceStatus, setPracticeStatus] = useState<PracticeStatus | ''>('');
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | ''>('');

  const handleSubmit = () => {
    onFilterChange({
      studentName: studentName || undefined,
      instrument: instrument === '全部' ? undefined : instrument,
      practiceStatus: practiceStatus || undefined,
      reviewStatus: reviewStatus || undefined,
    });
  };

  const handleReset = () => {
    setStudentName('');
    setInstrument('全部');
    setPracticeStatus('');
    setReviewStatus('');
    onFilterChange({});
  };

  const showPracticeFilter = role === '教务老师' || role === '任课老师';
  const showReviewFilter = role === '任课老师' || role === '家长顾问';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="请输入学生姓名"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-gray-700 mb-1">乐器类型</label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          >
            {instruments.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        {showPracticeFilter && (
          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">陪练状态</label>
            <select
              value={practiceStatus}
              onChange={(e) => setPracticeStatus(e.target.value as PracticeStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">全部</option>
              {practiceStatuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        )}
        {showReviewFilter && (
          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">点评状态</label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as ReviewStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">全部</option>
              {reviewStatuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            筛选
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
}