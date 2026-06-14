import { PracticeRecord, PracticeStatus } from '../types';

interface PracticeDetailViewProps {
  record: PracticeRecord;
}

const statusConfig: Record<PracticeStatus, { label: string; className: string }> = {
  '待处理': { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  '已确认': { label: '已确认', className: 'bg-blue-100 text-blue-700' },
  '已退回': { label: '已退回', className: 'bg-red-100 text-red-700' },
  '已完成': { label: '已完成', className: 'bg-green-100 text-green-700' },
  '超时': { label: '超时', className: 'bg-danger-100 text-danger-700' },
};

export function PracticeDetailView({ record }: PracticeDetailViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">学生姓名</label>
          <span className="text-lg font-medium text-gray-800">{record.studentName}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">状态</label>
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusConfig[record.status].className}`}>
            {statusConfig[record.status].label}
          </span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">乐器</label>
          <span className="text-gray-800">{record.instrument}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">练习日期</label>
          <span className="text-gray-800">{record.practiceDate}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">练习时长</label>
          <span className="text-gray-800">{record.duration}分钟</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">处理人</label>
          <span className="text-gray-800">{record.handledBy || '-'}</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">练习内容</label>
        <div className="bg-gray-50 rounded-lg p-3 text-gray-800">{record.content}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">备注</label>
        <div className="bg-primary-50 rounded-lg p-3 text-primary-800">{record.note || '-'}</div>
      </div>
      <div className="flex justify-between text-sm text-gray-400 pt-4 border-t border-gray-200">
        <span>创建时间: {record.createdAt}</span>
        <span>更新时间: {record.updatedAt}</span>
      </div>
    </div>
  );
}
